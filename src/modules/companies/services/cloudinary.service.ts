import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadImage(file: Express.Multer.File, folder: string, publicId?: string): Promise<any> {
    try {
      // Convert buffer to base64 string for Cloudinary
      const fileBase64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      
      const result = await cloudinary.uploader.upload(fileBase64, {
        folder,
        public_id: publicId || undefined,
        resource_type: 'auto',
      });

      return {
        secure_url: result.secure_url,
        public_id: result.public_id,
      };
    } catch (error) {
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  }

  async updateImage(file: Express.Multer.File, folder: string, oldPublicId?: string): Promise<any> {
    try {
      // Delete old image if it exists
      if (oldPublicId) {
        await this.deleteImage(oldPublicId);
      }

      // Upload new image
      return await this.uploadImage(file, folder);
    } catch (error) {
      throw new Error(`Failed to update image: ${error.message}`);
    }
  }
}
