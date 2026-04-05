import {
  Injectable,
  Inject,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

import { LessonProgressRepository } from '../infrastructure/lesson-progress.repository';
import { EnrollmentsService } from './enrollments.service';
import type { UpdateLessonProgressDto } from './dto/update-lesson-progress.dto';
import type { LessonProgress } from '../domain/entities/lesson-progress.entity';

interface QuizChecker {
  hasPassedAllQuizzes(enrollmentId: string, lessonId: string): Promise<boolean>;
}

@Injectable()
export class LessonProgressService {
  private readonly logger = new Logger(LessonProgressService.name);

  constructor(
    private readonly progressRepository: LessonProgressRepository,
    private readonly enrollmentsService: EnrollmentsService,
    private readonly prisma: PrismaService,
    @Inject('QUIZ_CHECKER')
    private readonly quizChecker: QuizChecker,
  ) {}

  async findByEnrollment(enrollmentId: string, userId: string): Promise<LessonProgress[]> {
    const enrollment = await this.enrollmentsService.findById(enrollmentId);
    if (enrollment.userId !== userId) {
      throw new ForbiddenException("Cannot view another user's progress");
    }
    return this.progressRepository.findByEnrollment(enrollmentId);
  }

  async updateProgress(
    enrollmentId: string,
    lessonId: string,
    userId: string,
    dto: UpdateLessonProgressDto,
  ): Promise<LessonProgress> {
    const enrollment = await this.enrollmentsService.findById(enrollmentId);
    if (enrollment.userId !== userId) {
      throw new ForbiddenException("Cannot update another user's progress");
    }

    let progress = await this.progressRepository.findByEnrollmentAndLesson(enrollmentId, lessonId);

    if (!progress) {
      progress = await this.progressRepository.create({
        enrollmentId,
        lessonId,
      });
    }

    if (dto.lastPosition !== undefined) {
      progress.lastPosition = dto.lastPosition;
    }
    if (dto.timeSpentSeconds !== undefined) {
      progress.timeSpentSeconds += dto.timeSpentSeconds;
    }

    const saved = await this.progressRepository.save(progress);

    // Update last accessed
    enrollment.lastAccessedAt = new Date();
    await this.enrollmentsService.updateProgress(enrollment, enrollment.progressPercentage);

    return saved;
  }

  async completeLesson(
    enrollmentId: string,
    lessonId: string,
    userId: string,
  ): Promise<LessonProgress> {
    const enrollment = await this.enrollmentsService.findById(enrollmentId);
    if (enrollment.userId !== userId) {
      throw new ForbiddenException("Cannot update another user's progress");
    }

    // Check prerequisites (gating)
    await this.checkPrerequisites(enrollmentId, lessonId);

    // Verify all quizzes in this lesson are passed
    const quizzesPassed = await this.quizChecker.hasPassedAllQuizzes(enrollmentId, lessonId);
    if (!quizzesPassed) {
      throw new BadRequestException(
        'Debe aprobar todos los quizzes de esta leccion antes de marcarla como completada',
      );
    }

    let progress = await this.progressRepository.findByEnrollmentAndLesson(enrollmentId, lessonId);

    if (!progress) {
      progress = await this.progressRepository.create({
        enrollmentId,
        lessonId,
        completed: true,
        completedAt: new Date(),
      });
    } else {
      progress.completed = true;
      progress.completedAt = new Date();
      progress = await this.progressRepository.save(progress);
    }

    // Recalculate progress percentage
    const percentage = await this.calculateProgressPercentage(enrollment.courseId, enrollmentId);
    await this.enrollmentsService.updateProgress(enrollment, percentage);

    this.logger.log(`Lesson ${lessonId} completed in enrollment ${enrollmentId} (${percentage}%)`);

    return progress;
  }

  /**
   * Check if the module's prerequisite (if any) has been completed.
   * Throws BadRequestException if the prerequisite module is not fully completed.
   */
  private async checkPrerequisites(enrollmentId: string, lessonId: string): Promise<void> {
    // Find the module this lesson belongs to
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, deletedAt: null },
      include: { module: { where: { deletedAt: null } } },
    });

    if (!lesson?.module) return;

    // Find the module with its prerequisite info
    const module = await this.prisma.courseModule.findFirst({
      where: { id: lesson.module.id, deletedAt: null },
    });

    if (!module?.prerequisiteModuleId) return;

    // Count total lessons in prerequisite module
    const totalPrereqLessons = await this.prisma.lesson.count({
      where: { moduleId: module.prerequisiteModuleId, deletedAt: null },
    });

    if (totalPrereqLessons === 0) return;

    // Count completed lessons in prerequisite module for this enrollment
    const completedPrereqLessons = await this.prisma.lessonProgress.count({
      where: {
        enrollmentId,
        completed: true,
        deletedAt: null,
        lesson: { moduleId: module.prerequisiteModuleId, deletedAt: null },
      },
    });

    if (completedPrereqLessons < totalPrereqLessons) {
      // Get prerequisite module title for better error message
      const prereqModule = await this.prisma.courseModule.findFirst({
        where: { id: module.prerequisiteModuleId, deletedAt: null },
      });
      throw new BadRequestException(
        `Debes completar el modulo "${prereqModule?.title ?? 'prerequisito'}" antes de acceder a este contenido`,
      );
    }
  }

  private async calculateProgressPercentage(
    courseId: string,
    enrollmentId: string,
  ): Promise<number> {
    // Count total lessons for the course (via modules)
    const totalLessons = await this.prisma.lesson.count({
      where: {
        deletedAt: null,
        module: { courseId, deletedAt: null },
      },
    });

    if (totalLessons === 0) return 100;

    const completedLessons = await this.progressRepository.countCompletedByEnrollment(enrollmentId);

    return Math.min(100, Math.round((completedLessons / totalLessons) * 100));
  }
}
