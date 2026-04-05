import { Module } from '@nestjs/common';

// Repositories
import { AnnouncementRepository } from './infrastructure/announcement.repository';
import { SurveyTemplateRepository } from './infrastructure/survey-template.repository';
import { SurveyResponseRepository } from './infrastructure/survey-response.repository';

// Services
import { AnnouncementsService } from './application/announcements.service';
import { SurveysService } from './application/surveys.service';
import { EffortEstimationService } from './application/effort-estimation.service';

// Controllers
import { AnnouncementsController } from './presentation/announcements.controller';
import { SurveysController } from './presentation/surveys.controller';
import { EffortEstimationController } from './presentation/effort-estimation.controller';

// Auth module (for guards)
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AnnouncementsController, SurveysController, EffortEstimationController],
  providers: [
    // Repositories
    AnnouncementRepository,
    SurveyTemplateRepository,
    SurveyResponseRepository,

    // Services
    AnnouncementsService,
    SurveysService,
    EffortEstimationService,
  ],
  exports: [AnnouncementsService, SurveysService, EffortEstimationService],
})
export class FeedbackModule {}
