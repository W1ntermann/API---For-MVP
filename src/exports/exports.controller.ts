import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ExportsService } from './exports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ExportRequestDto } from './dto/exports.dto';

@Controller('exports')
@UseGuards(JwtAuthGuard)
export class ExportsController {
  constructor(private exportsService: ExportsService) {}

  @Post()
  async createExport(
    @Body() request: ExportRequestDto,
    @CurrentUser() user: any,
  ) {
    return this.exportsService.createExport(user.user_id, request);
  }

  @Get(':exportId/status')
  async getExportStatus(
    @Param('exportId') exportId: string,
    @CurrentUser() user: any,
  ) {
    return this.exportsService.getExportStatus(user.user_id, exportId);
  }
}