import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Req, Res, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ConfirmEmailDto } from './dto/confirm-email.dto';
import { ForgetPasswordDto } from './dto/forget-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signUp(signupDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('confirm-email')
  @HttpCode(HttpStatus.OK)
  async confirmEmail(@Body() confirmEmailDto: ConfirmEmailDto) {
    return this.authService.confirmEmail(confirmEmailDto);
  }

  @Post('forget-password')
  @HttpCode(HttpStatus.OK)
  async forgetPassword(@Body() forgetPasswordDto: ForgetPasswordDto) {
    return this.authService.forgetPassword(forgetPasswordDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req: any) {
    // This will redirect to Google OAuth
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any, @Res() res: any) {
    // Handle Google OAuth callback
    // Generate JWT tokens using googleLogin method
    const user = req.user;
    const tokens = await this.authService.googleLogin(user);
    
    // Redirect to frontend with tokens
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`;
    res.redirect(redirectUrl);
  }
}