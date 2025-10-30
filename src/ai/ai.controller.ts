import { Controller, Post, Get, Body, Query, Param, UseGuards, Patch } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiCreditsService } from './ai-credits.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AiTextRequestDto, AiImageRequestDto } from './dto/ai.dto';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max, IsIn } from 'class-validator';

class GenerationQueryDto {
  @IsOptional()
  @IsIn(['text', 'image'])
  type?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private aiService: AiService,
    private aiCreditsService: AiCreditsService,
  ) {}

  @Post('generate-text')
  async generateText(
    @Body() request: AiTextRequestDto,
    @CurrentUser() user: any,
  ) {
    return this.aiService.generateText(
      request.prompt, 
      request.tone, 
      request.length,
      user.user_id
    );
  }

  @Post('generate-image')
  async generateImage(
    @Body() request: AiImageRequestDto,
    @CurrentUser() user: any,
  ) {
    return this.aiService.generateImage(
      request.prompt,
      request.width,
      request.height,
      user.user_id
    );
  }

  @Get('generations')
  async getGenerations(
    @CurrentUser() user: any,
    @Query() query: GenerationQueryDto,
  ) {
    return this.aiService.getUserGenerations(
      user.user_id,
      query.type,
      query.page,
      query.limit,
    );
  }

  @Get('generations/:id')
  async getGeneration(
    @CurrentUser() user: any,
    @Param('id') generationId: string,
  ) {
    return this.aiService.getGeneration(user.user_id, generationId);
  }

  @Get('credits')
  async getCredits(@CurrentUser() user: any) {
    return this.aiCreditsService.getBalance(user.user_id);
  }

  @Get('credits/stats')
  async getCreditStats(@CurrentUser() user: any) {
    return this.aiCreditsService.getUsageStats(user.user_id);
  }

  @Patch('credits/reset')
  async resetCredits(@CurrentUser() user: any) {
    await this.aiCreditsService.resetCredits(user.user_id);
    return { 
      message: 'Credits reset successfully',
      balance: await this.aiCreditsService.getBalance(user.user_id)
    };
  }
}