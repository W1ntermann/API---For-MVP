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
import Replicate from 'replicate';

const pump = promisify(pipeline);

@Injectable()
export class AiService {
  private readonly uploadDir = join(process.cwd(), 'uploads');
  private replicate: Replicate | null = null;

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

    // Ініціалізуємо Replicate якщо є токен
    const replicateToken = this.configService.get<string>('REPLICATE_API_TOKEN');
    if (replicateToken) {
      this.replicate = new Replicate({
        auth: replicateToken,
      });
      console.log('✅ Replicate initialized for real image generation');
    } else {
      console.log('⚠️ Replicate token not found, will use placeholder images');
    }
  }

  private getApiKey(type: 'text' | 'image' = 'text'): string {
    // Використовуємо окремі ключі для тексту та зображень
    const keyName = type === 'image' ? 'IMAGE_API_KEY' : 'GPT_LLM_KEY';
    const apiKey = this.configService.get<string>(keyName);
    
    if (!apiKey) {
      // Fallback на основний ключ якщо спеціальний не налаштований
      const fallbackKey = this.configService.get<string>('GPT_LLM_KEY');
      if (!fallbackKey) {
        throw new InternalServerErrorException(`${type === 'image' ? 'Image' : 'Text'} API key not configured`);
      }
      return fallbackKey;
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
      const apiKey = this.getApiKey('text');
      
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
      const apiKey = this.getApiKey('image');
      
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
      console.log(`📐 Requested size: ${width}x${height}`);

      // Генеруємо ID для медіа файлу
      const mediaId = this.generateId();
      const filename = `ai_generated_${mediaId}.png`;
      const filePath = join(this.uploadDir, filename);
      
      let imageUrl: string;

      // Спробуємо згенерувати реальне зображення через Replicate
      if (this.replicate) {
        try {
          console.log('🎨 Generating REAL image with Replicate Stable Diffusion...');
          
          const output = await this.replicate.run(
            "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
            {
              input: {
                prompt: prompt,
                width: width,
                height: height,
                num_outputs: 1,
                guidance_scale: 7.5,
                num_inference_steps: 30,
              }
            }
          ) as string[];

          imageUrl = output[0];
          console.log('✨ Real image generated by Replicate:', imageUrl);

          // Завантажуємо згенероване зображення
          console.log('📥 Downloading real generated image...');
          const imageResponse = await lastValueFrom(
            this.httpService.get(imageUrl, { 
              responseType: 'stream',
              timeout: 30000 
            })
          );

          // Зберігаємо файл
          await pump(imageResponse.data, createWriteStream(filePath));
          console.log('💾 Real image saved to:', filePath);

        } catch (replicateError) {
          console.error('❌ Replicate generation failed:', replicateError.message);
          console.log('🔄 Falling back to enhanced placeholder...');
          
          // Fallback на покращений placeholder через GPT опис
          await this.createEnhancedPlaceholder(apiKey, prompt, width, height, filePath);
        }
      } else {
        console.log('⚠️ Replicate not initialized, using placeholder...');
        await this.createEnhancedPlaceholder(apiKey, prompt, width, height, filePath);
      }

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
      console.log('📄 Media record saved with ID:', mediaId);

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

  private async createEnhancedPlaceholder(
    apiKey: string, 
    prompt: string, 
    width: number, 
    height: number, 
    filePath: string
  ): Promise<void> {
    try {
      // Генеруємо опис через GPT
      const descriptionResponse = await lastValueFrom(
        this.httpService.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: 'openai/gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'Create a short visual description for the image in 2-3 words.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 50,
          },
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        )
      );

      const shortDesc = descriptionResponse.data.choices?.[0]?.message?.content || prompt;
      const encodedText = encodeURIComponent(shortDesc.substring(0, 30));
      const placeholderUrl = `https://via.placeholder.com/${width}x${height}/4A90E2/FFFFFF?text=${encodedText}`;
      
      console.log('📥 Creating placeholder with description:', shortDesc.substring(0, 30));
      
      const imageResponse = await lastValueFrom(
        this.httpService.get(placeholderUrl, { 
          responseType: 'stream',
          timeout: 10000 
        })
      );
      
      await pump(imageResponse.data, createWriteStream(filePath));
      console.log('💾 Placeholder saved');
      
    } catch (error) {
      console.error('⚠️ Placeholder creation failed, using basic fallback');
      // Простий fallback
      const simpleUrl = `https://via.placeholder.com/${width}x${height}/4A90E2/FFFFFF?text=Image`;
      const imageResponse = await lastValueFrom(
        this.httpService.get(simpleUrl, { responseType: 'stream' })
      );
      await pump(imageResponse.data, createWriteStream(filePath));
    }
  }

  private generateId(): string {
    return randomUUID();
  }
}