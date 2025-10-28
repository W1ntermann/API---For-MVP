import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('subscription')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  @Get()
  async getSubscription(@CurrentUser() user: any) {
    const plan = user.subscription_plan || 'free';
    
    const plansInfo = {
      "free": {
        "name": "Free",
        "price": 0,
        "features": [
          "5 проєктів",
          "20 шаблонів",
          "100 MB сховища",
          "AI генерація текстів (обмежено)"
        ]
      },
      "pro": {
        "name": "Pro",
        "price": 19,
        "features": [
          "Необмежені проєкти",
          "Необмежені шаблони",
          "10 GB сховища",
          "Необмежена AI генерація",
          "Експорт у відео",
          "Пріоритетна підтримка"
        ]
      },
      "team": {
        "name": "Team",
        "price": 49,
        "features": [
          "Всі можливості Pro",
          "Командна співпраця",
          "50 GB сховища",
          "Управління правами доступу",
          "API доступ"
        ]
      }
    };
    
    return {
      "current_plan": plan,
      "plan_info": plansInfo[plan] || plansInfo['free'],
      "all_plans": plansInfo,
      "stripe_integrated": false,
      "message": "Stripe інтеграція буде додана у наступній версії"
    };
  }
}