import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ENROLLMENT_STATUS } from '@lms/shared';

import { Lesson } from '@/courses/domain/entities/lesson.entity';
import { CourseModule } from '@/courses/domain/entities/course-module.entity';

import { LessonProgressService } from './lesson-progress.service';
import { LessonProgressRepository } from '../infrastructure/lesson-progress.repository';
import { EnrollmentsService } from './enrollments.service';
import type { LessonProgress } from '../domain/entities/lesson-progress.entity';
import type { Enrollment } from '../domain/entities/enrollment.entity';

/* ------------------------------------------------------------------ */
/*  Mock factories                                                     */
/* ------------------------------------------------------------------ */

const createMockEnrollment = (
  overrides: Partial<Enrollment> = {},
): Enrollment =>
  ({
    id: 'enrollment-001',
    userId: 'user-001',
    courseId: 'course-001',
    status: ENROLLMENT_STATUS.ACTIVE,
    enrolledAt: new Date('2026-01-15'),
    progressPercentage: 0,
    lastAccessedAt: null,
    ...overrides,
  }) as Enrollment;

const createMockProgress = (
  overrides: Partial<LessonProgress> = {},
): LessonProgress =>
  ({
    id: 'progress-001',
    enrollmentId: 'enrollment-001',
    lessonId: 'lesson-001',
    completed: false,
    completedAt: null,
    lastPosition: null,
    timeSpentSeconds: 0,
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-15'),
    deletedAt: null,
    ...overrides,
  }) as LessonProgress;

/* ------------------------------------------------------------------ */
/*  QueryBuilder mock                                                  */
/* ------------------------------------------------------------------ */

const createMockQueryBuilder = (count: number) => ({
  innerJoin: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getCount: jest.fn().mockResolvedValue(count),
});

/* ------------------------------------------------------------------ */
/*  Test suite                                                         */
/* ------------------------------------------------------------------ */

describe('LessonProgressService', () => {
  let service: LessonProgressService;
  let progressRepo: jest.Mocked<LessonProgressRepository>;
  let enrollmentsService: jest.Mocked<EnrollmentsService>;
  let lessonRepository: { createQueryBuilder: jest.Mock; findOne: jest.Mock };
  let quizChecker: { hasPassedAllQuizzes: jest.Mock };

  beforeEach(async () => {
    progressRepo = {
      findByEnrollment: jest.fn(),
      findByEnrollmentAndLesson: jest.fn(),
      countCompletedByEnrollment: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<LessonProgressRepository>;

    enrollmentsService = {
      findById: jest.fn(),
      updateProgress: jest.fn(),
    } as unknown as jest.Mocked<EnrollmentsService>;

    lessonRepository = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn().mockResolvedValue({ id: 'lesson-001', moduleId: 'module-001', module: { id: 'module-001', prerequisiteModuleId: null } }),
    };

    quizChecker = {
      hasPassedAllQuizzes: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LessonProgressService,
        { provide: LessonProgressRepository, useValue: progressRepo },
        { provide: EnrollmentsService, useValue: enrollmentsService },
        { provide: getRepositoryToken(Lesson), useValue: lessonRepository },
        { provide: getRepositoryToken(CourseModule), useValue: { findOne: jest.fn() } },
        { provide: 'QUIZ_CHECKER', useValue: quizChecker },
      ],
    }).compile();

    service = module.get<LessonProgressService>(LessonProgressService);
  });

  /* ---- findByEnrollment ---- */

  describe('findByEnrollment', () => {
    it('should return progress for own enrollment', async () => {
      const enrollment = createMockEnrollment();
      enrollmentsService.findById.mockResolvedValue(enrollment);
      const progressList = [createMockProgress()];
      progressRepo.findByEnrollment.mockResolvedValue(progressList);

      const result = await service.findByEnrollment('enrollment-001', 'user-001');

      expect(result).toBe(progressList);
      expect(progressRepo.findByEnrollment).toHaveBeenCalledWith('enrollment-001');
    });

    it('should forbid viewing progress of another user', async () => {
      const enrollment = createMockEnrollment({ userId: 'other-user' });
      enrollmentsService.findById.mockResolvedValue(enrollment);

      await expect(
        service.findByEnrollment('enrollment-001', 'user-001'),
      ).rejects.toThrow(ForbiddenException);
      expect(progressRepo.findByEnrollment).not.toHaveBeenCalled();
    });
  });

  /* ---- updateProgress ---- */

  describe('updateProgress', () => {
    const enrollmentId = 'enrollment-001';
    const lessonId = 'lesson-001';
    const userId = 'user-001';

    beforeEach(() => {
      enrollmentsService.findById.mockResolvedValue(createMockEnrollment());
      enrollmentsService.updateProgress.mockResolvedValue(createMockEnrollment());
    });

    it('should create progress record if it does not exist', async () => {
      progressRepo.findByEnrollmentAndLesson.mockResolvedValue(null);
      const created = createMockProgress({ timeSpentSeconds: 0 });
      progressRepo.create.mockResolvedValue(created);
      progressRepo.save.mockResolvedValue(created);

      const result = await service.updateProgress(enrollmentId, lessonId, userId, {
        timeSpentSeconds: 30,
      });

      expect(progressRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ enrollmentId, lessonId }),
      );
      expect(result).toBe(created);
    });

    it('should update lastPosition if provided', async () => {
      const existing = createMockProgress();
      progressRepo.findByEnrollmentAndLesson.mockResolvedValue(existing);
      progressRepo.save.mockImplementation(async (p) => p as LessonProgress);

      const position = { blockIndex: 3, scrollOffset: 120 };
      await service.updateProgress(enrollmentId, lessonId, userId, {
        lastPosition: position,
      });

      expect(existing.lastPosition).toEqual(position);
      expect(progressRepo.save).toHaveBeenCalled();
    });

    it('should accumulate timeSpentSeconds (additive)', async () => {
      const existing = createMockProgress({ timeSpentSeconds: 60 });
      progressRepo.findByEnrollmentAndLesson.mockResolvedValue(existing);
      progressRepo.save.mockImplementation(async (p) => p as LessonProgress);

      await service.updateProgress(enrollmentId, lessonId, userId, {
        timeSpentSeconds: 30,
      });

      expect(existing.timeSpentSeconds).toBe(90);
    });

    it('should update enrollment lastAccessedAt', async () => {
      const enrollment = createMockEnrollment();
      enrollmentsService.findById.mockResolvedValue(enrollment);
      progressRepo.findByEnrollmentAndLesson.mockResolvedValue(createMockProgress());
      progressRepo.save.mockImplementation(async (p) => p as LessonProgress);

      await service.updateProgress(enrollmentId, lessonId, userId, {});

      expect(enrollmentsService.updateProgress).toHaveBeenCalledWith(
        expect.objectContaining({ lastAccessedAt: expect.any(Date) }),
        enrollment.progressPercentage,
      );
    });

    it('should forbid updating progress for another user', async () => {
      enrollmentsService.findById.mockResolvedValue(
        createMockEnrollment({ userId: 'other-user' }),
      );

      await expect(
        service.updateProgress(enrollmentId, lessonId, userId, {}),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  /* ---- completeLesson ---- */

  describe('completeLesson', () => {
    const enrollmentId = 'enrollment-001';
    const lessonId = 'lesson-001';
    const userId = 'user-001';

    beforeEach(() => {
      enrollmentsService.findById.mockResolvedValue(
        createMockEnrollment({ courseId: 'course-001' }),
      );
      enrollmentsService.updateProgress.mockResolvedValue(createMockEnrollment());
    });

    it('should create completed progress if none exists', async () => {
      progressRepo.findByEnrollmentAndLesson.mockResolvedValue(null);
      const created = createMockProgress({ completed: true });
      progressRepo.create.mockResolvedValue(created);

      const qb = createMockQueryBuilder(5);
      lessonRepository.createQueryBuilder.mockReturnValue(qb);
      progressRepo.countCompletedByEnrollment.mockResolvedValue(1);

      const result = await service.completeLesson(enrollmentId, lessonId, userId);

      expect(result.completed).toBe(true);
      expect(progressRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          enrollmentId,
          lessonId,
          completed: true,
          completedAt: expect.any(Date),
        }),
      );
    });

    it('should mark existing progress as completed', async () => {
      const existing = createMockProgress({ completed: false });
      progressRepo.findByEnrollmentAndLesson.mockResolvedValue(existing);
      progressRepo.save.mockImplementation(async (p) => p as LessonProgress);

      const qb = createMockQueryBuilder(5);
      lessonRepository.createQueryBuilder.mockReturnValue(qb);
      progressRepo.countCompletedByEnrollment.mockResolvedValue(2);

      const result = await service.completeLesson(enrollmentId, lessonId, userId);

      expect(result.completed).toBe(true);
      expect(result.completedAt).toBeInstanceOf(Date);
    });

    it('should recalculate progress percentage correctly', async () => {
      progressRepo.findByEnrollmentAndLesson.mockResolvedValue(null);
      progressRepo.create.mockResolvedValue(createMockProgress({ completed: true }));

      const qb = createMockQueryBuilder(4); // 4 total lessons
      lessonRepository.createQueryBuilder.mockReturnValue(qb);
      progressRepo.countCompletedByEnrollment.mockResolvedValue(3); // 3 completed

      await service.completeLesson(enrollmentId, lessonId, userId);

      // 3/4 = 75%
      expect(enrollmentsService.updateProgress).toHaveBeenCalledWith(
        expect.anything(),
        75,
      );
    });

    it('should return 100% when course has no lessons', async () => {
      progressRepo.findByEnrollmentAndLesson.mockResolvedValue(null);
      progressRepo.create.mockResolvedValue(createMockProgress({ completed: true }));

      const qb = createMockQueryBuilder(0); // 0 total lessons
      lessonRepository.createQueryBuilder.mockReturnValue(qb);

      await service.completeLesson(enrollmentId, lessonId, userId);

      expect(enrollmentsService.updateProgress).toHaveBeenCalledWith(
        expect.anything(),
        100,
      );
    });

    it('should cap progress at 100%', async () => {
      progressRepo.findByEnrollmentAndLesson.mockResolvedValue(null);
      progressRepo.create.mockResolvedValue(createMockProgress({ completed: true }));

      const qb = createMockQueryBuilder(3);
      lessonRepository.createQueryBuilder.mockReturnValue(qb);
      progressRepo.countCompletedByEnrollment.mockResolvedValue(4); // more than total (edge case)

      await service.completeLesson(enrollmentId, lessonId, userId);

      expect(enrollmentsService.updateProgress).toHaveBeenCalledWith(
        expect.anything(),
        100,
      );
    });

    it('should forbid completing lesson for another user', async () => {
      enrollmentsService.findById.mockResolvedValue(
        createMockEnrollment({ userId: 'other-user' }),
      );

      await expect(
        service.completeLesson(enrollmentId, lessonId, userId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if quizzes not passed', async () => {
      quizChecker.hasPassedAllQuizzes.mockResolvedValue(false);

      await expect(
        service.completeLesson(enrollmentId, lessonId, userId),
      ).rejects.toThrow(BadRequestException);
      expect(progressRepo.create).not.toHaveBeenCalled();
      expect(progressRepo.save).not.toHaveBeenCalled();
    });
  });
});
