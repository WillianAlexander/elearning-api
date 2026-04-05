import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Port token
import { AI_CONTENT_GENERATOR_PORT } from './domain/ports/ai-content-generator.port';

// Adapters
import { ClaudeContentGeneratorAdapter } from './infrastructure/claude-content-generator.adapter';
import { MockContentGeneratorAdapter } from './infrastructure/mock-content-generator.adapter';

// Services
import { AiGenerationService } from './application/ai-generation.service';

// Controllers
import { AiGenerationController } from './presentation/ai-generation.controller';

// Auth module (for guards)
import { AuthModule } from '../auth/auth.module';

// Courses module (for ContentBlocksService)
import { CoursesModule } from '../courses/courses.module';

@Module({
  imports: [AuthModule, CoursesModule],
  controllers: [AiGenerationController],
  providers: [
    // Port → Adapter binding (uses mock if ANTHROPIC_API_KEY is not set)
    {
      provide: AI_CONTENT_GENERATOR_PORT,
      useFactory: (configService: ConfigService) => {
        const apiKey = configService.get<string>('ANTHROPIC_API_KEY');
        if (apiKey) {
          return new ClaudeContentGeneratorAdapter(configService);
        }
        return new MockContentGeneratorAdapter();
      },
      inject: [ConfigService],
    },

    // Services
    AiGenerationService,
  ],
  exports: [AiGenerationService],
})
export class AiGenerationModule {}
