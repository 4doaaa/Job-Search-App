import { Injectable, ConflictException, NotFoundException, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron } from '@nestjs/schedule';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User, UserDocument } from '../users/schemas/user.schema/user.schema';
import { OTPType } from '../users/schemas/user.schema/user.schema';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ConfirmEmailDto } from './dto/confirm-email.dto';
import { ForgetPasswordDto } from './dto/forget-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel('User') private userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async signUp(signupDto: SignupDto): Promise<{ message: string }> {
    // Check if email already exists
    const existingUser = await this.userModel.findOne({ email: signupDto.email });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash the OTP
    const hashedOtp = await bcrypt.hash(otp, 10);
    
    // Set OTP expiry to 10 minutes from now
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Create user with OTP
    const createdUser = new this.userModel({
      ...signupDto,
      OTP: [{
        code: hashedOtp,
        type: OTPType.EMAIL_VERIFICATION,
        expiresIn: otpExpiry,
      }],
    });

    await createdUser.save();

    // In a real application, you would send the OTP via email
    console.log(`OTP for ${signupDto.email}: ${otp}`);

    return { message: 'User created successfully. Please check your email for OTP.' };
  }

  async confirmEmail(confirmEmailDto: ConfirmEmailDto): Promise<{ message: string }> {
    const { email, otp } = confirmEmailDto;

    // Find user by email
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user has OTP
    if (!user.OTP || user.OTP.length === 0) {
      throw new NotFoundException('OTP not found');
    }

    // Find the email verification OTP
    const emailVerificationOTP = user.OTP.find(
      (otpItem) => otpItem.type === OTPType.EMAIL_VERIFICATION
    );

    if (!emailVerificationOTP) {
      throw new NotFoundException('OTP not found');
    }

    // Check OTP expiry
    if (new Date() > emailVerificationOTP.expiresIn) {
      throw new BadRequestException('OTP has expired');
    }

    // Verify OTP
    const isOTPValid = await bcrypt.compare(otp, emailVerificationOTP.code);
    if (!isOTPValid) {
      throw new BadRequestException('Invalid OTP');
    }

    // Mark user as confirmed and remove OTP
    await this.userModel.updateOne(
      { _id: user._id },
      { 
        $set: { isConfirmed: true },
        $pull: { OTP: { type: OTPType.EMAIL_VERIFICATION } }
      }
    );

    return { message: 'Email confirmed successfully.' };
  }

  async forgetPassword(forgetPasswordDto: ForgetPasswordDto): Promise<{ message: string }> {
    const { email } = forgetPasswordDto;

    // Find user by email
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash the OTP
    const hashedOtp = await bcrypt.hash(otp, 10);
    
    // Set OTP expiry to 10 minutes from now
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Remove any existing forget password OTPs and add new one
    await this.userModel.updateOne(
      { _id: user._id },
      { 
        $pull: { OTP: { type: OTPType.PASSWORD_RESET } }
      }
    );

    // Add new OTP
    await this.userModel.updateOne(
      { _id: user._id },
      { 
        $push: { 
          OTP: {
            code: hashedOtp,
            type: OTPType.PASSWORD_RESET,
            expiresIn: otpExpiry,
          }
        }
      }
    );

    // In a real application, you would send the OTP via email
    console.log(`Password reset OTP for ${email}: ${otp}`);

    return { message: 'Password reset OTP sent to your email.' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { email, otp, newPassword } = resetPasswordDto;

    // Find user by email
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user has OTP
    if (!user.OTP || user.OTP.length === 0) {
      throw new NotFoundException('OTP not found');
    }

    // Find the password reset OTP
    const passwordResetOTP = user.OTP.find(
      (otpItem) => otpItem.type === OTPType.PASSWORD_RESET
    );

    if (!passwordResetOTP) {
      throw new NotFoundException('OTP not found');
    }

    // Check OTP expiry
    if (new Date() > passwordResetOTP.expiresIn) {
      throw new BadRequestException('OTP has expired');
    }

    // Verify OTP
    const isOTPValid = await bcrypt.compare(otp, passwordResetOTP.code);
    if (!isOTPValid) {
      throw new BadRequestException('Invalid OTP');
    }

    // Update password and remove OTP
    await this.userModel.updateOne(
      { _id: user._id },
      { 
        $set: { password: newPassword }, // Will be hashed by pre-save hook
        $pull: { OTP: { type: OTPType.PASSWORD_RESET } }
      }
    );

    return { message: 'Password reset successfully.' };
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
    const { email, password } = loginDto;

    // Find user by email with password
    const user = await this.userModel.findOne({ email }).select('+password');
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if email is confirmed
    if (!user.isConfirmed) {
      throw new UnauthorizedException('Email not confirmed');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const payload = { sub: user._id, email: user.email, role: user.role };
    console.log('AuthService - JWT Payload:', payload); // Debug log
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return { accessToken, refreshToken };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<{ accessToken: string }> {
    const { refreshToken } = refreshTokenDto;

    try {
      // Verify refresh token
      const decoded = this.jwtService.verify(refreshToken);
      
      // Find user
      const user = await this.userModel.findById(decoded.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Check if changeCredentialTime is greater than token's IAT
      if (user.changeCredentialTime && user.changeCredentialTime > new Date(decoded.iat * 1000)) {
        throw new UnauthorizedException('Account locked');
      }

      // Generate new access token
      const payload = { sub: user._id, email: user.email, role: user.role };
      console.log('AuthService - Refresh Token Payload:', payload); // Debug log
      const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  @Cron('0 */6 * * *')
  async cleanupExpiredOTPs(): Promise<void> {
    this.logger.log('Starting OTP cleanup job...');
    
    try {
      const currentDateTime = new Date();
      
      // Find all users with expired OTPs
      const result = await this.userModel.updateMany(
        {
          'OTP.expiresIn': { $lt: currentDateTime }
        },
        {
          $pull: {
            OTP: { expiresIn: { $lt: currentDateTime } }
          }
        }
      );

      this.logger.log(`OTP cleanup completed. Removed expired OTPs from ${result.modifiedCount} users.`);
    } catch (error) {
      this.logger.error('Error during OTP cleanup:', error);
    }
  }

  async googleLogin(user: any): Promise<{ accessToken: string; refreshToken: string }> {
    // Check if user exists in the DB
    let existingUser = await this.userModel.findOne({ email: user.email });
    
    if (!existingUser) {
      // Create a new user with provider: 'google'
      const newUser = new this.userModel({
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        profilePic: user.profilePic,
        isConfirmed: true, // Google users are pre-verified
        role: 'User',
        // Provide default values for required fields
        password: 'google-user-' + Math.random().toString(36).substring(2, 15),
        mobileNumber: '0000000000', // Default mobile number
        DOB: new Date('2000-01-01'), // Default date of birth
        gender: 'Female', // Default gender (matches enum)
      });

      existingUser = await newUser.save();
    }

    // Generate tokens just like normal login
    const payload = { sub: existingUser._id, email: existingUser.email, role: existingUser.role };
    console.log('AuthService - Google Login Payload:', payload); // Debug log
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return { accessToken, refreshToken };
  }
}
