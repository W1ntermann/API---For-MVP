import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../common/schemas/user.schema';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AiCreditsService {
  // Вартість операцій у кредитах
  private readonly COSTS = {
    TEXT_GENERATION: 1,      // 1 кредит за текст (3 варіанти)
    IMAGE_GENERATION: 5,     // 5 кредитів за зображення
  };

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  /**
   * Перевірка чи достатньо кредитів
   */
  async checkCredits(userId: string, cost: number): Promise<boolean> {
    const user = await this.userModel.findOne({ id: userId });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user.ai_credits >= cost;
  }

  /**
   * Отримати баланс користувача
   */
  async getBalance(userId: string) {
    const user = await this.userModel.findOne({ id: userId });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return {
      credits: user.ai_credits,
      credits_limit: user.ai_credits_limit,
      last_reset: user.ai_credits_last_reset,
      next_reset: this.getNextResetDate(),
      costs: {
        text_generation: this.COSTS.TEXT_GENERATION,
        image_generation: this.COSTS.IMAGE_GENERATION,
      }
    };
  }

  /**
   * Списати кредити
   */
  async deductCredits(userId: string, cost: number, reason: string): Promise<number> {
    const user = await this.userModel.findOne({ id: userId });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.ai_credits < cost) {
      throw new BadRequestException(
        `Insufficient credits. You have ${user.ai_credits} credits, but need ${cost}. ` +
        `Credits will reset on ${this.getNextResetDate().toLocaleDateString()}.`
      );
    }

    const newBalance = user.ai_credits - cost;
    
    await this.userModel.updateOne(
      { id: userId },
      { 
        $set: { ai_credits: newBalance },
        $inc: { [`ai_usage.${reason}`]: cost }
      }
    );

    console.log(`💰 Deducted ${cost} credits from user ${userId} (${reason}). New balance: ${newBalance}`);

    return newBalance;
  }

  /**
   * Додати кредити (для адміністратора або бонусів)
   */
  async addCredits(userId: string, amount: number, reason: string = 'bonus'): Promise<number> {
    const user = await this.userModel.findOne({ id: userId });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const newBalance = Math.min(user.ai_credits + amount, user.ai_credits_limit);
    
    await this.userModel.updateOne(
      { id: userId },
      { $set: { ai_credits: newBalance } }
    );

    console.log(`💰 Added ${amount} credits to user ${userId} (${reason}). New balance: ${newBalance}`);

    return newBalance;
  }

  /**
   * Скинути кредити до ліміту (викликається щомісяця)
   */
  async resetCredits(userId: string): Promise<void> {
    const user = await this.userModel.findOne({ id: userId });
    if (!user) {
      return;
    }

    await this.userModel.updateOne(
      { id: userId },
      { 
        $set: { 
          ai_credits: user.ai_credits_limit,
          ai_credits_last_reset: new Date()
        } 
      }
    );

    console.log(`🔄 Reset credits for user ${userId} to ${user.ai_credits_limit}`);
  }

  /**
   * Автоматичне оновлення кредитів кожного 1-го числа місяця о 00:00
   */
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async handleMonthlyReset() {
    console.log('🔄 Starting monthly AI credits reset...');
    
    try {
      const users = await this.userModel.find({});
      
      for (const user of users) {
        await this.userModel.updateOne(
          { id: user.id },
          { 
            $set: { 
              ai_credits: user.ai_credits_limit,
              ai_credits_last_reset: new Date()
            } 
          }
        );
      }

      console.log(`✅ Monthly reset completed for ${users.length} users`);
    } catch (error) {
      console.error('❌ Monthly reset failed:', error);
    }
  }

  /**
   * Отримати вартість операції
   */
  getCost(operation: 'text' | 'image'): number {
    return operation === 'text' 
      ? this.COSTS.TEXT_GENERATION 
      : this.COSTS.IMAGE_GENERATION;
  }

  /**
   * Отримати дату наступного оновлення
   */
  private getNextResetDate(): Date {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
    return nextMonth;
  }

  /**
   * Отримати статистику використання
   */
  async getUsageStats(userId: string) {
    const user = await this.userModel.findOne({ id: userId });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const creditsUsed = user.ai_credits_limit - user.ai_credits;
    const percentageUsed = (creditsUsed / user.ai_credits_limit) * 100;

    return {
      credits_used: creditsUsed,
      credits_remaining: user.ai_credits,
      credits_limit: user.ai_credits_limit,
      percentage_used: Math.round(percentageUsed),
      last_reset: user.ai_credits_last_reset,
      next_reset: this.getNextResetDate(),
      estimated_text_generations: Math.floor(user.ai_credits / this.COSTS.TEXT_GENERATION),
      estimated_image_generations: Math.floor(user.ai_credits / this.COSTS.IMAGE_GENERATION),
    };
  }
}

