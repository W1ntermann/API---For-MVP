import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TemplateCreateDto, TemplateUpdateDto } from './dto/templates.dto';

@Controller('templates')
@UseGuards(JwtAuthGuard)
export class TemplatesController {
  constructor(private templatesService: TemplatesService) {}

  @Get()
  async getTemplates(
    @CurrentUser() user: any,
    @Query('projectId') projectId?: string,
  ) {
    return this.templatesService.getUserTemplates(user.user_id, projectId);
  }

  @Post()
  async createTemplate(@CurrentUser() user: any, @Body() templateData: TemplateCreateDto) {
    return this.templatesService.createTemplate(user.user_id, templateData);
  }

  @Get(':templateId')
  async getTemplate(@CurrentUser() user: any, @Param('templateId') templateId: string) {
    return this.templatesService.getTemplate(user.user_id, templateId);
  }

  @Patch(':templateId')
  async updateTemplate(
    @CurrentUser() user: any,
    @Param('templateId') templateId: string,
    @Body() updateData: TemplateUpdateDto,
  ) {
    return this.templatesService.updateTemplate(user.user_id, templateId, updateData);
  }

  @Delete(':templateId')
  async deleteTemplate(@CurrentUser() user: any, @Param('templateId') templateId: string) {
    return this.templatesService.deleteTemplate(user.user_id, templateId);
  }
}