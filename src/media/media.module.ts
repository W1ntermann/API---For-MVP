import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { AuthModule } from '../auth/auth.module'; // Імпортуємо AuthModule
import { Media, MediaSchema } from '../common/schemas/media.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: Media.name, schema: MediaSchema }]),
    AuthModule, // Додаємо імпорт AuthModule
  ],
  controllers: [MediaController],
  providers: [MediaService],
})
export class MediaModule {}