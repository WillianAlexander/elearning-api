import { Module } from '@nestjs/common';

// Repositories
import { CourseRepository } from './infrastructure/course.repository';
import { ModuleRepository } from './infrastructure/module.repository';
import { LessonRepository } from './infrastructure/lesson.repository';
import { ContentBlockRepository } from './infrastructure/content-block.repository';
import { ContentVersionRepository } from './infrastructure/content-version.repository';
import { CategoryRepository } from './infrastructure/category.repository';
import { TagRepository } from './infrastructure/tag.repository';

// Services
import { CoursesService } from './application/courses.service';
import { ModulesService } from './application/modules.service';
import { LessonsService } from './application/lessons.service';
import { ContentBlocksService } from './application/content-blocks.service';
import { CategoriesService } from './application/categories.service';

// Controllers
import { CoursesController } from './presentation/courses.controller';
import { ModulesController } from './presentation/modules.controller';
import { LessonsController } from './presentation/lessons.controller';
import { ContentBlocksController } from './presentation/content-blocks.controller';
import { CategoriesController } from './presentation/categories.controller';

// Auth module (for guards)
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [
    CoursesController,
    ModulesController,
    LessonsController,
    ContentBlocksController,
    CategoriesController,
  ],
  providers: [
    // Repositories
    CourseRepository,
    ModuleRepository,
    LessonRepository,
    ContentBlockRepository,
    ContentVersionRepository,
    CategoryRepository,
    TagRepository,

    // Services
    CoursesService,
    ModulesService,
    LessonsService,
    ContentBlocksService,
    CategoriesService,
  ],
  exports: [
    CoursesService,
    ModulesService,
    LessonsService,
    ContentBlocksService,
    CategoriesService,
  ],
})
export class CoursesModule {}
