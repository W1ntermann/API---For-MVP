import { Module } from '@nestjs/common';
import { SubscriptionController } from './subscription.controller';
import { AuthModule } from '../auth/auth.module'; // Імпортуємо AuthModule

@Module({
  imports: [AuthModule], // Додаємо імпорт AuthModule
  controllers: [SubscriptionController],
})
export class SubscriptionModule {}