import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { TemplatesModule } from './templates/templates.module';
import { MediaModule } from './media/media.module';
import { AiModule } from './ai/ai.module';
import { ExportsModule } from './exports/exports.module';
import { SubscriptionModule } from './subscription/subscription.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
    useFactory: async (configService: ConfigService) => ({
    uri: configService.get<string>(configService.get('NODE_ENV') === 'production' ? 'MONGO_URL_PROD' : 'MONGO_URL'),
    retryAttempts: 3,
    retryDelay: 1000,
    // Додаткові оптимізації
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  }),
  inject: [ConfigService],
    }),
    AuthModule,
    ProjectsModule,
    TemplatesModule,
    MediaModule,
    AiModule,
    ExportsModule,
    SubscriptionModule,
  ],
})
export class AppModule {}