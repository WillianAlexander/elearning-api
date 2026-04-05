import { Module, forwardRef } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { EnrollmentsModule } from '../enrollments/enrollments.module';

import { QuizAttemptRepository } from './infrastructure/quiz-attempt.repository';
import { QuizAttemptsService } from './application/quiz-attempts.service';
import { QuizAttemptsController } from './presentation/quiz-attempts.controller';

@Module({
  imports: [AuthModule, forwardRef(() => EnrollmentsModule)],
  controllers: [QuizAttemptsController],
  providers: [QuizAttemptRepository, QuizAttemptsService],
  exports: [QuizAttemptsService],
})
export class EvaluationsModule {}
