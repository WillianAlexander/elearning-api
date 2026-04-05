import { Module, forwardRef } from '@nestjs/common';

// Repositories
import { EnrollmentRepository } from './infrastructure/enrollment.repository';
import { LessonProgressRepository } from './infrastructure/lesson-progress.repository';

// Services
import { EnrollmentsService } from './application/enrollments.service';
import { LessonProgressService } from './application/lesson-progress.service';
import { CertificateService } from './application/certificate.service';

// Ports & Adapters
import { PDF_GENERATOR_PORT } from './domain/ports/pdf-generator.port';
import { PuppeteerPdfAdapter } from './infrastructure/puppeteer-pdf.adapter';

// Controllers
import { EnrollmentsController } from './presentation/enrollments.controller';
import { LessonProgressController } from './presentation/lesson-progress.controller';
import { CertificateVerifyController } from './presentation/certificate-verify.controller';

// Certificate verification service
import { CertificateVerificationService } from './application/certificate-verification.service';

// Auth module (for guards)
import { AuthModule } from '../auth/auth.module';

// Courses module (for CourseRepository)
import { CoursesModule } from '../courses/courses.module';

// Evaluations module (for quiz checking)
import { EvaluationsModule } from '../evaluations/evaluations.module';
import { QuizAttemptsService } from '../evaluations/application/quiz-attempts.service';

@Module({
  imports: [AuthModule, CoursesModule, forwardRef(() => EvaluationsModule)],
  controllers: [EnrollmentsController, LessonProgressController, CertificateVerifyController],
  providers: [
    // Repositories
    EnrollmentRepository,
    LessonProgressRepository,

    // Services
    EnrollmentsService,
    LessonProgressService,
    CertificateService,
    CertificateVerificationService,

    // PDF generation port
    {
      provide: PDF_GENERATOR_PORT,
      useClass: PuppeteerPdfAdapter,
    },

    // Quiz checker token (resolves circular dep via forwardRef)
    {
      provide: 'QUIZ_CHECKER',
      useExisting: QuizAttemptsService,
    },
  ],
  exports: [EnrollmentsService, LessonProgressService],
})
export class EnrollmentsModule {}
