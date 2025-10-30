import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { createReadStream, createWriteStream, existsSync, mkdirSync } from 'fs';
import { promisify } from 'util';
import { pipeline } from 'stream';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';
import { Media } from '../common/schemas/media.schema';
import type { File as MulterFile } from 'multer';

const pump = promisify(pipeline);

@Injectable()
export class MediaService {
  private readonly uploadDir = join(process.cwd(), 'uploads');

  constructor(
    @InjectModel(Media.name) private mediaModel: Model<Media>,
  ) {
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(userId: string, file: MulterFile) {
    try {
      if (!file) {
        throw new BadRequestException('No file provided');
      }

      // Валідація типу файлу
      const allowedMimeTypes = [
        'image/jpeg', 
        'image/jpg',
        'image/png', 
        'image/gif', 
        'image/webp',
        'image/svg+xml'
      ];
      
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          'Invalid file type. Only images (JPEG, PNG, GIF, WebP, SVG) are allowed.'
        );
      }

      // Валідація розміру (10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new BadRequestException('File size exceeds 10MB limit');
      }

      // Санітизація імені файлу
      const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');

      const mediaId = this.generateId();
      const fileExtension = extname(sanitizedOriginalName);
      const filename = `${mediaId}${fileExtension}`;
      const filePath = join(this.uploadDir, filename);

      await pump(file.stream, createWriteStream(filePath));

      const media = new this.mediaModel({
        id: mediaId,
        user_id: userId,
        filename: sanitizedOriginalName,
        content_type: file.mimetype,
        size: file.size,
        file_path: filePath,
        created_at: new Date(),
      });

      await media.save();

      return {
        id: mediaId,
        filename: sanitizedOriginalName,
        url: `/api/media/${mediaId}`
      };

    } catch (error) {
      console.error('File upload error:', error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException('File upload failed');
    }
  }

  async getFile(mediaId: string, userId: string) {
    const media = await this.mediaModel.findOne({ id: mediaId, user_id: userId });
    if (!media) {
      throw new NotFoundException('Media not found');
    }

    if (!existsSync(media.file_path)) {
      throw new NotFoundException('File not found in storage');
    }

    return {
      stream: createReadStream(media.file_path),
      contentType: media.content_type,
      filename: media.filename
    };
  }

  async getUserMedia(userId: string) {
    const mediaFiles = await this.mediaModel.find({ user_id: userId }, { _id: 0, __v: 0, file_path: 0 }).exec();
    
    return mediaFiles.map(media => ({
      ...media.toObject(),
      url: `/api/media/${media.id}`
    }));
  }

  private generateId(): string {
    return randomUUID();
  }
}