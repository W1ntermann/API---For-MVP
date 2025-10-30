import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import { Project } from '../common/schemas/project.schema';
import { Template } from '../common/schemas/template.schema';
import { ProjectCreateDto } from './dto/projects.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(Template.name) private templateModel: Model<Template>,
  ) {}

  async getUserProjects(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    
    const [projects, total] = await Promise.all([
      this.projectModel
        .find({ user_id: userId }, { _id: 0, __v: 0 })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.projectModel.countDocuments({ user_id: userId })
    ]);
    
    return {
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
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
    const session = await this.projectModel.db.startSession();
    session.startTransaction();
    
    try {
      const result = await this.projectModel
        .deleteOne({ id: projectId, user_id: userId })
        .session(session);
      
      if (result.deletedCount === 0) {
        await session.abortTransaction();
        throw new NotFoundException('Project not found');
      }

      await this.templateModel
        .deleteMany({ project_id: projectId })
        .session(session);
      
      await session.commitTransaction();
      return { message: 'Project deleted successfully' };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  private generateId(): string {
    return randomUUID();
  }
}