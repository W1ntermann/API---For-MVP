import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { AuthModule } from '../auth/auth.module'; // Імпортуємо AuthModule
import { Project, ProjectSchema } from '../common/schemas/project.schema';
import { Template, TemplateSchema } from '../common/schemas/template.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: Template.name, schema: TemplateSchema },
    ]),
    AuthModule, // Додаємо імпорт AuthModule
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}