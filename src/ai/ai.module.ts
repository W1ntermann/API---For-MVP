import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AuthModule } from '../auth/auth.module';
import { Media, MediaSchema } from '../common/schemas/media.schema';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([{ name: Media.name, schema: MediaSchema }]),
    AuthModule,
  ],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}