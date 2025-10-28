import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project } from '../common/schemas/project.schema';
import { Template } from '../common/schemas/template.schema';
import { ProjectCreateDto } from './dto/projects.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(Template.name) private templateModel: Model<Template>,
  ) {}

  async getUserProjects(userId: string) {
    return this.projectModel.find({ user_id: userId }, { _id: 0, __v: 0 }).exec();
  }

  async createProject(userId: string, projectData: ProjectCreateDto) {
    const projectId = this.generateId();
    const now = new Date();

    const project = new this.projectModel({
      id: projectId,
      user_id: userId,
      title: projectData.title,
      description: projectData.description,
      created_at: now,
      updated_at: now,
    });

    await project.save();
    return this.projectModel.findOne({ id: projectId }, { _id: 0, __v: 0 }).exec();
  }

  async getProject(userId: string, projectId: string) {
    const project = await this.projectModel.findOne(
      { id: projectId, user_id: userId },
      { _id: 0, __v: 0 },
    ).exec();
    
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    
    return project;
  }

  async deleteProject(userId: string, projectId: string) {
    const result = await this.projectModel.deleteOne({ id: projectId, user_id: userId }).exec();
    
    if (result.deletedCount === 0) {
      throw new NotFoundException('Project not found');
    }

    await this.templateModel.deleteMany({ project_id: projectId }).exec();
    
    return { message: 'Project deleted successfully' };
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}