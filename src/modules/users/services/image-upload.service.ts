import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse } from 'cloudinary';

interface MulterFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

@Injectable()
export class ImageUploadService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your-cloud-name',
      api_key: process.env.CLOUDINARY_API_KEY || 'your-api-key',
      api_secret: process.env.CLOUDINARY_API_SECRET || 'your-api-secret',
    });
  }

  async uploadImage(file: MulterFile, folder: string): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'image',
          format: 'webp',
          quality: 'auto:good',
        },
        (error, result) => {
          if (error) return reject(error);
          if (result) resolve(result);
          else reject(new Error('Upload failed'));
        }
      );

      uploadStream.end(file.buffer);
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) return reject(error);
        resolve();
      });
    });
  }

  async updateImage(
    file: MulterFile, 
    folder: string, 
    oldPublicId?: string
  ): Promise<UploadApiResponse> {
    // Delete old image if it exists
    if (oldPublicId) {
      await this.deleteImage(oldPublicId);
    }

    // Upload new image
    return this.uploadImage(file, folder);
  }
}
