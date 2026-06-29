import { v2 as cloudinary } from 'cloudinary';
import { cloudinary as cloudinaryClient } from '../config/cloudinary';
import { BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';
import { config } from '../config';

export class UploadService {
  async uploadImage(
    buffer: Buffer,
    folder: string,
    filename: string
  ): Promise<{ url: string; publicId: string }> {
    if (!config.CLOUDINARY_CLOUD_NAME) {
      throw new BadRequestError('Cloudinary is not configured');
    }

    return new Promise((resolve, reject) => {
      const stream = cloudinaryClient.uploader.upload_stream(
        {
          folder: `tapmenu/${folder}`,
          public_id: filename,
          resource_type: 'image',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (error, result) => {
          if (error || !result) {
            logger.error('Cloudinary upload failed:', error);
            reject(new BadRequestError('Image upload failed'));
            return;
          }
          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      );
      stream.end(buffer);
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    if (!config.CLOUDINARY_CLOUD_NAME) return;
    await cloudinary.uploader.destroy(publicId);
  }
}

export const uploadService = new UploadService();
