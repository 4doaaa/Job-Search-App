import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User, UserDocument } from './schemas/user.schema/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

export interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  gender: 'Male' | 'Female';
  DOB: Date;
}

@Injectable()
export class UsersService {
  constructor(@InjectModel('User') private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

      const createdUser = new this.userModel({
        ...createUserDto,
        password: hashedPassword,
      });

      return await createdUser.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findOne(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userModel.findOne({ email }).select('+password').exec();
    
    if (user && await bcrypt.compare(password, user.password)) {
      return user;
    }
    
    return null;
  }

  async update(id: string, updateUserDto: Partial<CreateUserDto>): Promise<User | null> {
    try {
      if (updateUserDto.password) {
        const saltRounds = 10;
        updateUserDto.password = await bcrypt.hash(updateUserDto.password, saltRounds);
      }

      return await this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true }).exec();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<User | null> {
    return this.userModel.findByIdAndDelete(id).exec();
  }

  async updateUser(userId: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.mobileNumber) {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', process.env.ENCRYPTION_KEY || 'abcdefghijklmnopqrstuvwxyz123456', iv);
      let encrypted = cipher.update(updateUserDto.mobileNumber, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      updateUserDto.mobileNumber = iv.toString('hex') + ':' + encrypted;
    }

    Object.assign(user, updateUserDto);
    return user.save();
  }

  async getProfile(userId: string): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

 async updatePassword(userId: string, updatePasswordDto: UpdatePasswordDto): Promise<void> {
  const { oldPassword, newPassword } = updatePasswordDto;

  const user = await this.userModel.findById(new Types.ObjectId(userId)).select('+password');
  
  console.log('USER FOUND IN DB:', user ? 'YES' : 'NO'); 

  if (!user) {
    throw new NotFoundException('User not found in database');
  }

  if (!user.password) {
    throw new BadRequestException('Google users cannot change password');
  }

  const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
  console.log('IS OLD PASSWORD VALID:', isOldPasswordValid); 

  if (!isOldPasswordValid) {
    throw new BadRequestException('Old password is incorrect');
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  
  await this.userModel.updateOne(
    { _id: new Types.ObjectId(userId) },
    { $set: { password: hashedNewPassword } }
  );

  console.log('PASSWORD UPDATED SUCCESSFULLY IN DB');
}

  async softDelete(userId: string): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.set('isDeleted', true);
    await user.save();
  }
}