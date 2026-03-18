import { Controller, Get, Patch, Delete, Post, Body, Param, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ImageUploadService } from './services/image-upload.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly imageUploadService: ImageUploadService
  ) {}

  @Patch()
  async updateUser(@Request() req: any, @Body() updateUserDto: UpdateUserDto) {
    const userId = req.user.sub;
    return this.usersService.updateUser(userId, updateUserDto);
  }

  @Get('me')
  async getProfile(@Request() req: any) {
    const userId = req.user.sub;
    return this.usersService.getProfile(userId);
  }

  @Patch('update-password')
  async updatePassword(@Request() req: any,
   @Body() updatePasswordDto: UpdatePasswordDto) {
    console.log('RECEIVED BODY:', updatePasswordDto);
    const userId = req.user.sub;
    await this.usersService.updatePassword(userId, updatePasswordDto);
    return { message: 'Password updated successfully' };
  }

  @Delete('me')
  async softDelete(@Request() req: any) {
    const userId = req.user.sub;
    await this.usersService.softDelete(userId);
    return { message: 'Account deleted successfully' };
  }

  @Post('profile-pic')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfilePic(
    @Request() req: any,
    @UploadedFile() file: any
  ) {
    const userId = req.user.sub;
    const user = await this.usersService.getProfile(userId);
    
    const result = await this.imageUploadService.updateImage(
      file,
      'profile-pictures',
      user.profilePic?.public_id
    );

    await this.usersService.updateUser(userId, {
      profilePic: {
        secure_url: result.secure_url,
        public_id: result.public_id
      }
    });

    return { message: 'Profile picture updated successfully', profilePic: result };
  }

  @Delete('profile-pic')
  async deleteProfilePic(@Request() req: any) {
    const userId = req.user.sub;
    const user = await this.usersService.getProfile(userId);
    
    if (user.profilePic?.public_id) {
      await this.imageUploadService.deleteImage(user.profilePic.public_id);
      await this.usersService.updateUser(userId, {
        profilePic: undefined
      });
    }

    return { message: 'Profile picture deleted successfully' };
  }

  @Post('cover-pic')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCoverPic(
    @Request() req: any,
    @UploadedFile() file: any
  ) {
    const userId = req.user.sub;
    const user = await this.usersService.getProfile(userId);
    
    const result = await this.imageUploadService.updateImage(
      file,
      'cover-pictures',
      user.coverPic?.public_id
    );

    await this.usersService.updateUser(userId, {
      coverPic: {
        secure_url: result.secure_url,
        public_id: result.public_id
      }
    });

    return { message: 'Cover picture updated successfully', coverPic: result };
  }

  @Delete('cover-pic')
  async deleteCoverPic(@Request() req: any) {
    const userId = req.user.sub;
    const user = await this.usersService.getProfile(userId);
    
    if (user.coverPic?.public_id) {
      await this.imageUploadService.deleteImage(user.coverPic.public_id);
      await this.usersService.updateUser(userId, {
        coverPic: undefined
      });
    }

    return { message: 'Cover picture deleted successfully' };
  }
}
