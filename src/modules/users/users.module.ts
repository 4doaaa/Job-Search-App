import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from './schemas/user.schema/user.schema';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthModule } from '../auth/auth.module';
import { ImageUploadService } from './services/image-upload.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    AuthModule,
  ],
  providers: [UsersService, ImageUploadService],
  controllers: [UsersController],
  exports: [MongooseModule, UsersService],
})
export class UsersModule {}
