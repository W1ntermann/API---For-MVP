import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExportsController } from './exports.controller';
import { ExportsService } from './exports.service';
import { AuthModule } from '../auth/auth.module'; // Імпортуємо AuthModule
import { Export, ExportSchema } from '../common/schemas/export.schema';
import { Template, TemplateSchema } from '../common/schemas/template.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Export.name, schema: ExportSchema },
      { name: Template.name, schema: TemplateSchema },
    ]),
    AuthModule, // Додаємо імпорт AuthModule
  ],
  controllers: [ExportsController],
  providers: [ExportsService],
})
export class ExportsModule {}