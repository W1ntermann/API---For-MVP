import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiCreditsService } from './ai-credits.service';
import { AuthModule } from '../auth/auth.module';
import { Media, MediaSchema } from '../common/schemas/media.schema';
import { AiGeneration, AiGenerationSchema } from '../common/schemas/ai-generation.schema';
import { User, UserSchema } from '../common/schemas/user.schema';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: Media.name, schema: MediaSchema },
      { name: AiGeneration.name, schema: AiGenerationSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuthModule,
  ],
  controllers: [AiController],
  providers: [AiService, AiCreditsService],
  exports: [AiCreditsService],
})
export class AiModule {}