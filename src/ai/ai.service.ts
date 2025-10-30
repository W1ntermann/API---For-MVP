import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Media } from '../common/schemas/media.schema';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';


@Injectable()
export class AiService {
  constructor(
    @InjectModel(Media.name) private mediaModel: Model<Media>,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  private getApiKey(): string {
    const apiKey = this.configService.get<string>('GPT_LLM_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException('AI API key not configured');
    }
    return apiKey;
  }

  async generateText(prompt: string, tone: string = 'professional', length: string = 'medium'): Promise<{ variants: string[] }> {
    try {
      const apiKey = this.getApiKey();
      const sessionId = this.generateId();
      
      // Mock implementation - замініть на реальний виклик API
      console.log('Using API Key:', apiKey ? '✅ Present' : '❌ Missing');
      
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
      const apiKey = this.getApiKey();
      
      // Mock implementation
      console.log('Using API Key for image generation:', apiKey ? '✅ Present' : '❌ Missing');
      
      const mediaId = this.generateId();
      const filename = `ai_generated_${mediaId}.png`;
      
      // Тут буде реальний виклик API для генерації зображень
      
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