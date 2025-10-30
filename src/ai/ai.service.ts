import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import { pipeline } from 'stream';
import { Media } from '../common/schemas/media.schema';
import { AiGeneration } from '../common/schemas/ai-generation.schema';
import { AiCreditsService } from './ai-credits.service';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

const pump = promisify(pipeline);

@Injectable()
export class AiService {
  private readonly uploadDir = join(process.cwd(), 'uploads');

  constructor(
    @InjectModel(Media.name) private mediaModel: Model<Media>,
    @InjectModel(AiGeneration.name) private aiGenerationModel: Model<AiGeneration>,
    private httpService: HttpService,
    private configService: ConfigService,
    private aiCreditsService: AiCreditsService,
  ) {
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  private getApiKey(): string {
    const apiKey = this.configService.get<string>('GPT_LLM_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException('AI API key not configured');
    }
    return apiKey;
  }

  async generateText(
    prompt: string, 
    tone: string = 'professional', 
    length: string = 'medium',
    userId?: string
  ): Promise<{ variants: string[]; generation_id: string; credits_remaining: number }> {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const generationId = this.generateId();
    const cost = this.aiCreditsService.getCost('text');
    
    // Перевіряємо баланс
    const hasCredits = await this.aiCreditsService.checkCredits(userId, cost);
    if (!hasCredits) {
      const balance = await this.aiCreditsService.getBalance(userId);
      throw new BadRequestException(
        `Insufficient AI credits. You have ${balance.credits} credits, but need ${cost}. ` +
        `Credits will reset on ${balance.next_reset.toLocaleDateString()}.`
      );
    }
    
    try {
      const apiKey = this.getApiKey();
      
      // Створюємо запис в БД
      const generation = new this.aiGenerationModel({
        id: generationId,
        user_id: userId || 'anonymous',
        type: 'text',
        prompt,
        parameters: { tone, length },
        status: 'processing',
        created_at: new Date(),
      });
      await generation.save();

      // Формуємо системний промпт залежно від тону
      const toneInstructions = {
        professional: 'Write in a professional, business-like tone.',
        friendly: 'Write in a warm, friendly, and approachable tone.',
        casual: 'Write in a casual, conversational tone.',
        formal: 'Write in a formal, official tone.',
        humorous: 'Write in a light-hearted, humorous tone.'
      };

      const lengthInstructions = {
        short: 'Keep it brief (1-2 sentences).',
        medium: 'Write 3-5 sentences.',
        long: 'Write a detailed response (6-10 sentences).'
      };

      const systemPrompt = `You are a creative content writer for social media. ${toneInstructions[tone] || toneInstructions.professional} ${lengthInstructions[length] || lengthInstructions.medium} Generate 3 different variations of the content.`;

      // Викликаємо OpenRouter API (працює з OpenAI моделями)
      console.log('🔄 Calling OpenRouter API for text generation...');
      
      const response = await lastValueFrom(
        this.httpService.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: 'openai/gpt-3.5-turbo',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
            max_tokens: length === 'long' ? 500 : length === 'medium' ? 300 : 150,
            n: 3,
            temperature: 0.8,
          },
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        )
      );

      console.log('📦 OpenRouter response status:', response.status);
      console.log('📦 OpenRouter response data:', JSON.stringify(response.data, null, 2));

      // Перевіряємо структуру відповіді
      if (!response.data || !response.data.choices || response.data.choices.length === 0) {
        throw new InternalServerErrorException('Invalid response from OpenRouter API');
      }

      const variants = response.data.choices.map((choice: any) => 
        choice.message?.content?.trim() || ''
      ).filter(v => v.length > 0);

      if (variants.length === 0) {
        throw new InternalServerErrorException('No text variants generated');
      }

      console.log(`✍️ Generated ${variants.length} text variants`);

      // Оновлюємо запис в БД
      await this.aiGenerationModel.updateOne(
        { id: generationId },
        { 
          $set: { 
            result_variants: variants,
            status: 'completed',
            completed_at: new Date()
          } 
        }
      );

      // Списуємо кредити після успішної генерації
      const creditsRemaining = await this.aiCreditsService.deductCredits(
        userId, 
        cost, 
        'text_generation'
      );

      const result = { 
        variants, 
        generation_id: generationId,
        credits_remaining: creditsRemaining
      };

      console.log(`✅ Text generation completed: ${generationId}, Credits remaining: ${creditsRemaining}`);
      console.log('📤 Returning to frontend:', JSON.stringify(result, null, 2));

      return result;

    } catch (error) {
      console.error('❌ AI text generation error:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      
      // Оновлюємо статус на failed
      await this.aiGenerationModel.updateOne(
        { id: generationId },
        { 
          $set: { 
            status: 'failed',
            error_message: error.message,
            completed_at: new Date()
          } 
        }
      );

      const errorMessage = error.response?.data?.error?.message 
        || error.response?.data?.message
        || error.message 
        || 'Unknown error';

      throw new InternalServerErrorException(
        `AI text generation failed: ${errorMessage}`
      );
    }
  }

  async generateImage(
    prompt: string, 
    width: number = 1024, 
    height: number = 1024, 
    userId: string
  ): Promise<{ status: string; generation_id: string; image_id?: string; image_url?: string; credits_remaining: number }> {
    const generationId = this.generateId();
    const cost = this.aiCreditsService.getCost('image');
    
    // Перевіряємо баланс
    const hasCredits = await this.aiCreditsService.checkCredits(userId, cost);
    if (!hasCredits) {
      const balance = await this.aiCreditsService.getBalance(userId);
      throw new BadRequestException(
        `Insufficient AI credits. You have ${balance.credits} credits, but need ${cost}. ` +
        `Credits will reset on ${balance.next_reset.toLocaleDateString()}.`
      );
    }
    
    try {
      const apiKey = this.getApiKey();
      
      // Створюємо запис в БД
      const generation = new this.aiGenerationModel({
        id: generationId,
        user_id: userId,
        type: 'image',
        prompt,
        parameters: { width, height },
        status: 'processing',
        created_at: new Date(),
      });
      await generation.save();

      // Визначаємо розмір зображення (DALL-E підтримує тільки певні розміри)
      let size = '1024x1024'; // default
      if (width === 1024 && height === 1792) {
        size = '1024x1792';
      } else if (width === 1792 && height === 1024) {
        size = '1792x1024';
      }

      console.log(`🎨 Generating image with prompt: "${prompt.substring(0, 50)}..."`);

      // Викликаємо OpenRouter API для генерації зображень
      // Примітка: DALL-E може бути недоступним через OpenRouter
      const response = await lastValueFrom(
        this.httpService.post(
          'https://openrouter.ai/api/v1/images/generations',
          {
            model: 'openai/dall-e-3',
            prompt,
            n: 1,
            size,
            quality: 'standard',
            response_format: 'url',
          },
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        )
      );

      const imageUrl = response.data.data[0].url;
      
      // Завантажуємо згенероване зображення
      const imageResponse = await lastValueFrom(
        this.httpService.get(imageUrl, { responseType: 'stream' })
      );

      const mediaId = this.generateId();
      const filename = `ai_generated_${mediaId}.png`;
      const filePath = join(this.uploadDir, filename);

      // Зберігаємо файл
      await pump(imageResponse.data, createWriteStream(filePath));

      // Зберігаємо в Media collection
      const media = new this.mediaModel({
        id: mediaId,
        user_id: userId,
        filename: `AI Generated: ${prompt.substring(0, 30)}...`,
        content_type: 'image/png',
        size: 0, // Розмір буде визначено пізніше
        file_path: filePath,
        created_at: new Date(),
      });
      await media.save();

      // Оновлюємо запис генерації
      await this.aiGenerationModel.updateOne(
        { id: generationId },
        { 
          $set: { 
            result_image_url: `/api/media/${mediaId}`,
            result_media_id: mediaId,
            status: 'completed',
            completed_at: new Date()
          } 
        }
      );

      // Списуємо кредити після успішної генерації
      const creditsRemaining = await this.aiCreditsService.deductCredits(
        userId, 
        cost, 
        'image_generation'
      );

      console.log(`✅ Image generation completed: ${generationId}, media: ${mediaId}, Credits remaining: ${creditsRemaining}`);

      return {
        status: 'completed',
        generation_id: generationId,
        image_id: mediaId,
        image_url: `/api/media/${mediaId}`,
        credits_remaining: creditsRemaining
      };

    } catch (error) {
      console.error('AI image generation error:', error);
      
      // Оновлюємо статус на failed
      await this.aiGenerationModel.updateOne(
        { id: generationId },
        { 
          $set: { 
            status: 'failed',
            error_message: error.message,
            completed_at: new Date()
          } 
        }
      );

      throw new InternalServerErrorException(
        `AI image generation failed: ${error.response?.data?.error?.message || error.message}`
      );
    }
  }

  async getUserGenerations(userId: string, type?: string, page: number = 1, limit: number = 20) {
    const query: any = { user_id: userId };
    if (type) {
      query.type = type;
    }
    
    const skip = (page - 1) * limit;
    
    const [generations, total] = await Promise.all([
      this.aiGenerationModel
        .find(query, { _id: 0, __v: 0 })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.aiGenerationModel.countDocuments(query)
    ]);
    
    return {
      generations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getGeneration(userId: string, generationId: string) {
    const generation = await this.aiGenerationModel.findOne(
      { id: generationId, user_id: userId },
      { _id: 0, __v: 0 }
    ).exec();
    
    if (!generation) {
      throw new InternalServerErrorException('Generation not found');
    }
    
    return generation;
  }

  private generateId(): string {
    return randomUUID();
  }
}