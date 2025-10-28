import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Media } from '../common/schemas/media.schema';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { createWriteStream } from 'fs';
import { join } from 'path';
import * as fs from 'fs';

@Injectable()
export class AiService {
  private readonly GPT_LLM_KEY = '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';
  private readonly uploadDir = join(process.cwd(), 'uploads');

  constructor(
    @InjectModel(Media.name) private mediaModel: Model<Media>,
    private httpService: HttpService,
  ) {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async generateText(prompt: string, tone: string = 'professional', length: string = 'medium'): Promise<{ variants: string[] }> {
    try {
      const sessionId = this.generateId();
      
      const systemMessage = `Ти - професійний SMM-копірайтер. Створи ${length} текст у ${tone} тоні для соціальних мереж.`;

      // Mock implementation since we don't have the exact LLM API structure
      // In a real implementation, you would call the actual API
      const mockVariants = [
        `[${tone.toUpperCase()}] ${prompt} - варіант 1`,
        `[${tone.toUpperCase()}] ${prompt} - варіант 2`, 
        `[${tone.toUpperCase()}] ${prompt} - варіант 3`
      ];

      return { variants: mockVariants };

    } catch (error) {
      console.error('AI text generation error:', error);
      throw new InternalServerErrorException(`AI generation failed: ${error.message}`);
    }
  }

  async generateImage(prompt: string, width: number = 1080, height: number = 1080, userId: string): Promise<{ status: string; image_id?: string; image_url?: string }> {
    try {
      // Mock implementation for image generation
      // In a real implementation, you would call the actual AI image generation API
      
      const mediaId = this.generateId();
      const filename = `ai_generated_${mediaId}.png`;
      const filePath = join(this.uploadDir, filename);

      // Create a mock image file (in real implementation, this would be the AI-generated image)
      const mockImageData = Buffer.from('mock-image-data');
      
      fs.writeFileSync(filePath, mockImageData);

      const media = new this.mediaModel({
        id: mediaId,
        user_id: userId,
        filename: filename,
        content_type: 'image/png',
        size: mockImageData.length,
        file_path: filePath,
        created_at: new Date(),
      });

      await media.save();

      return {
        status: 'success',
        image_id: mediaId,
        image_url: `/api/media/${mediaId}`
      };

    } catch (error) {
      console.error('AI image generation error:', error);
      throw new InternalServerErrorException(`AI image generation failed: ${error.message}`);
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}