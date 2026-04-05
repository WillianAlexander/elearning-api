import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { appConfig } from './config/app.config';
import { authConfig } from './config/auth.config';
import { minioConfig } from './config/minio.config';
import { PrismaModule } from './common/prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RbacModule } from './rbac/rbac.module';
import { CoursesModule } from './courses/courses.module';
import { MediaModule } from './media/media.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { EvaluationsModule } from './evaluations/evaluations.module';
import { EngagementModule } from './engagement/engagement.module';
import { FeedbackModule } from './feedback/feedback.module';
import { GamificationModule } from './gamification/gamification.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AiGenerationModule } from './ai-generation/ai-generation.module';
import { RubricsModule } from './rubrics/rubrics.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: process.env['NODE_ENV'] === 'production' ? 60 : 1000,
      },
      {
        name: 'strict',
        ttl: 60000,
        limit: process.env['NODE_ENV'] === 'production' ? 10 : 1000,
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig, minioConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    // Only serve static uploads in development (mock storage)
    ...(process.env['NODE_ENV'] !== 'production'
      ? [
          ServeStaticModule.forRoot({
            rootPath: '/tmp/lms-uploads/uploads',
            serveRoot: '/uploads',
            serveStaticOptions: { index: false },
          }),
        ]
      : []),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    RbacModule,
    CoursesModule,
    MediaModule,
    EnrollmentsModule,
    EvaluationsModule,
    EngagementModule,
    FeedbackModule,
    GamificationModule,
    NotificationsModule,
    AiGenerationModule,
    RubricsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
