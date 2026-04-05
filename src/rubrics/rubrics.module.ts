import { Module } from '@nestjs/common';

// Repositories
import { RubricRepository } from './infrastructure/rubric.repository';
import { RubricCriterionRepository } from './infrastructure/rubric-criterion.repository';
import { RubricLevelRepository } from './infrastructure/rubric-level.repository';
import { RubricEvaluationRepository } from './infrastructure/rubric-evaluation.repository';

// Services
import { RubricsService } from './application/rubrics.service';
import { RubricEvaluationsService } from './application/rubric-evaluations.service';

// Controllers
import { RubricsController, RubricEnrollmentController } from './presentation/rubrics.controller';

// Auth module (for guards)
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [RubricsController, RubricEnrollmentController],
  providers: [
    // Repositories
    RubricRepository,
    RubricCriterionRepository,
    RubricLevelRepository,
    RubricEvaluationRepository,

    // Services
    RubricsService,
    RubricEvaluationsService,
  ],
  exports: [RubricsService, RubricEvaluationsService],
})
export class RubricsModule {}
