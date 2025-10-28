import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Template } from '../common/schemas/template.schema';
import { TemplateCreateDto, TemplateUpdateDto } from './dto/templates.dto';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectModel(Template.name) private templateModel: Model<Template>,
  ) {}

  async getUserTemplates(userId: string, projectId?: string) {
    const query: any = { user_id: userId };
    if (projectId) {
      query.project_id = projectId;
    }
    
    return this.templateModel.find(query, { _id: 0, __v: 0 }).exec();
  }

  async createTemplate(userId: string, templateData: TemplateCreateDto) {
    const templateId = this.generateId();
    const now = new Date();

    const template = new this.templateModel({
      id: templateId,
      user_id: userId,
      project_id: templateData.project_id,
      name: templateData.name,
      canvas_data: templateData.canvas_data,
      created_at: now,
      updated_at: now,
    });

    await template.save();
    return this.templateModel.findOne({ id: templateId }, { _id: 0, __v: 0 }).exec();
  }

  async getTemplate(userId: string, templateId: string) {
    const template = await this.templateModel.findOne(
      { id: templateId, user_id: userId },
      { _id: 0, __v: 0 },
    ).exec();
    
    if (!template) {
      throw new NotFoundException('Template not found');
    }
    
    return template;
  }

  async updateTemplate(userId: string, templateId: string, updateData: TemplateUpdateDto) {
    const template = await this.templateModel.findOne({ id: templateId, user_id: userId }).exec();
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    const updateFields: any = { updated_at: new Date() };
    if (updateData.name !== undefined) {
      updateFields.name = updateData.name;
    }
    if (updateData.canvas_data !== undefined) {
      updateFields.canvas_data = updateData.canvas_data;
    }

    await this.templateModel.updateOne(
      { id: templateId },
      { $set: updateFields },
    ).exec();

    return this.templateModel.findOne({ id: templateId }, { _id: 0, __v: 0 }).exec();
  }

  async deleteTemplate(userId: string, templateId: string) {
    const result = await this.templateModel.deleteOne({ id: templateId, user_id: userId }).exec();
    
    if (result.deletedCount === 0) {
      throw new NotFoundException('Template not found');
    }
    
    return { message: 'Template deleted successfully' };
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}