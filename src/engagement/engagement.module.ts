import { Module } from '@nestjs/common';

// Repositories
import { BookmarkRepository } from './infrastructure/bookmark.repository';
import { LessonNoteRepository } from './infrastructure/lesson-note.repository';
import { CourseReviewRepository } from './infrastructure/course-review.repository';
import { DailyActivitySummaryRepository } from './infrastructure/daily-activity-summary.repository';
import { VideoWatchLogRepository } from './infrastructure/video-watch-log.repository';

// Services
import { BookmarksService } from './application/bookmarks.service';
import { LessonNotesService } from './application/lesson-notes.service';
import { CourseReviewsService } from './application/course-reviews.service';
import { DailyActivityService } from './application/daily-activity.service';
import { VideoWatchService } from './application/video-watch.service';

// Controllers
import { BookmarksController } from './presentation/bookmarks.controller';
import { LessonNotesController } from './presentation/lesson-notes.controller';
import { CourseReviewsController } from './presentation/course-reviews.controller';
import { HeatmapController } from './presentation/heatmap.controller';
import { VideoWatchController } from './presentation/video-watch.controller';

// Auth module (for guards)
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [
    BookmarksController,
    LessonNotesController,
    CourseReviewsController,
    HeatmapController,
    VideoWatchController,
  ],
  providers: [
    // Repositories
    BookmarkRepository,
    LessonNoteRepository,
    CourseReviewRepository,
    DailyActivitySummaryRepository,
    VideoWatchLogRepository,

    // Services
    BookmarksService,
    LessonNotesService,
    CourseReviewsService,
    DailyActivityService,
    VideoWatchService,
  ],
  exports: [
    BookmarksService,
    LessonNotesService,
    CourseReviewsService,
    DailyActivityService,
    VideoWatchService,
  ],
})
export class EngagementModule {}
