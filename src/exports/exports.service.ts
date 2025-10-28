import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Export } from '../common/schemas/export.schema';
import { Template } from '../common/schemas/template.schema';
import { ExportRequestDto } from './dto/exports.dto';

@Injectable()
export class ExportsService {
  constructor(
    @InjectModel(Export.name) private exportModel: Model<Export>,
    @InjectModel(Template.name) private templateModel: Model<Template>,
  ) {}

  async createExport(userId: string, request: ExportRequestDto) {
    const template = await this.templateModel.findOne({ 
      id: request.template_id, 
      user_id: userId 
    });
    
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    const exportId = this.generateId();

    const exportDoc = new this.exportModel({
      id: exportId,
      user_id: userId,
      template_id: request.template_id,
      format: request.format,
      width: request.width,
      height: request.height,
      status: 'ready',
      created_at: new Date(),
    });

    await exportDoc.save();

    return {
      id: exportId,
      status: 'ready',
      message: 'Експорт буде реалізовано у наступній версії. Canvas можна експортувати через браузер.'
    };
  }

  async getExportStatus(userId: string, exportId: string) {
    const exportDoc = await this.exportModel.findOne(
      { id: exportId, user_id: userId },
      { _id: 0, __v: 0 }
    ).exec();
    
    if (!exportDoc) {
      throw new NotFoundException('Export not found');
    }
    
    return exportDoc;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}