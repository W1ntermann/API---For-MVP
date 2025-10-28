import { Controller, Post, Get, Param, UseGuards, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { File as MulterFile } from 'multer';

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private mediaService: MediaService) {}

  @Post('upload')
@UseInterceptors(FileInterceptor('file'))
async uploadMedia(
  @UploadedFile() file: MulterFile,
  @CurrentUser() user: any,
) {
  return this.mediaService.uploadFile(user.user_id, file);
}

  @Get(':mediaId')
  async getMedia(
    @Param('mediaId') mediaId: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const fileInfo = await this.mediaService.getFile(mediaId, user.user_id);
    
    res.setHeader('Content-Type', fileInfo.contentType);
    res.setHeader('Content-Disposition', `inline; filename="${fileInfo.filename}"`);
    
    fileInfo.stream.pipe(res);
  }

  @Get()
  async listMedia(@CurrentUser() user: any) {
    return this.mediaService.getUserMedia(user.user_id);
  }
}