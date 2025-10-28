import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AiTextRequestDto, AiImageRequestDto } from './dto/ai.dto';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('generate-text')
  async generateText(
    @Body() request: AiTextRequestDto,
  ) {
    return this.aiService.generateText(request.prompt, request.tone, request.length);
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
}