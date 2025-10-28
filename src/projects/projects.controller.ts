import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ProjectCreateDto } from './dto/projects.dto';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get()
  async getProjects(@CurrentUser() user: any) {
    return this.projectsService.getUserProjects(user.user_id);
  }

  @Post()
  async createProject(@CurrentUser() user: any, @Body() projectData: ProjectCreateDto) {
    return this.projectsService.createProject(user.user_id, projectData);
  }

  @Get(':projectId')
  async getProject(@CurrentUser() user: any, @Param('projectId') projectId: string) {
    return this.projectsService.getProject(user.user_id, projectId);
  }

  @Delete(':projectId')
  async deleteProject(@CurrentUser() user: any, @Param('projectId') projectId: string) {
    return this.projectsService.deleteProject(user.user_id, projectId);
  }
}