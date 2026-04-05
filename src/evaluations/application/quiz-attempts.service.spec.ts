import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CONTENT_BLOCK_TYPE, ENROLLMENT_STATUS } from '@lms/shared';

import { ContentBlock } from '@/courses/domain/entities/content-block.entity';

import { QuizAttemptsService } from './quiz-attempts.service';
import { QuizAttemptRepository } from '../infrastructure/quiz-attempt.repository';
import { EnrollmentsService } from '../../enrollments/application/enrollments.service';
import type { QuizAttempt } from '../domain/entities/quiz-attempt.entity';
import type { Enrollment } from '../../enrollments/domain/entities/enrollment.entity';

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
    ...overrides,
  }) as Enrollment;

const createQuizBlock = (): ContentBlock =>
  ({
    id: 'block-001',
    lessonId: 'lesson-001',
    type: CONTENT_BLOCK_TYPE.QUIZ,
    content: {
      questions: [
        {
          id: 'q1',
          text: 'What is 2+2?',
          options: [
            { id: 'a', text: '3' },
            { id: 'b', text: '4' },
          ],
          correctOptionId: 'b',
          explanation: 'Basic math',
        },
        {
          id: 'q2',
          text: 'What is 3+3?',
          options: [
            { id: 'c', text: '5' },
            { id: 'd', text: '6' },
          ],
          correctOptionId: 'd',
          explanation: 'Basic math',
        },
      ],
      passingScore: 50,
      maxAttempts: 3,
    },
    orderIndex: 0,
  }) as unknown as ContentBlock;

/* ------------------------------------------------------------------ */
/*  Test suite                                                         */
/* ------------------------------------------------------------------ */

describe('QuizAttemptsService', () => {
  let service: QuizAttemptsService;
  let quizAttemptRepo: jest.Mocked<QuizAttemptRepository>;
  let enrollmentsService: jest.Mocked<EnrollmentsService>;
  let contentBlockRepo: { findOne: jest.Mock; find: jest.Mock };

  beforeEach(async () => {
    quizAttemptRepo = {
      create: jest.fn(),
      findByEnrollmentAndBlock: jest.fn(),
      findById: jest.fn(),
      countByEnrollmentAndBlock: jest.fn(),
      bestScoreByEnrollmentAndBlock: jest.fn(),
      hasPassedQuiz: jest.fn(),
      findAllPassedByEnrollmentAndLesson: jest.fn(),
    } as unknown as jest.Mocked<QuizAttemptRepository>;

    enrollmentsService = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<EnrollmentsService>;

    contentBlockRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizAttemptsService,
        { provide: QuizAttemptRepository, useValue: quizAttemptRepo },
        { provide: EnrollmentsService, useValue: enrollmentsService },
        { provide: getRepositoryToken(ContentBlock), useValue: contentBlockRepo },
      ],
    }).compile();

    service = module.get<QuizAttemptsService>(QuizAttemptsService);
  });

  /* ---- submitQuiz ---- */

  describe('submitQuiz', () => {
    const dto = {
      contentBlockId: 'block-001',
      answers: [
        { questionId: 'q1', selectedOptionId: 'b' },
        { questionId: 'q2', selectedOptionId: 'd' },
      ],
    };

    beforeEach(() => {
      enrollmentsService.findById.mockResolvedValue(createMockEnrollment());
      contentBlockRepo.findOne.mockResolvedValue(createQuizBlock());
      quizAttemptRepo.countByEnrollmentAndBlock.mockResolvedValue(0);
    });

    it('should grade and create attempt with correct score', async () => {
      const mockAttempt = {
        id: 'attempt-001',
        score: 100,
        passed: true,
      } as QuizAttempt;
      quizAttemptRepo.create.mockResolvedValue(mockAttempt);

      const result = await service.submitQuiz('enrollment-001', 'user-001', dto);

      expect(result).toBe(mockAttempt);
      expect(quizAttemptRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          score: 100,
          correctCount: 2,
          totalQuestions: 2,
          passed: true,
        }),
      );
    });

    it('should mark as failed when score is below passing', async () => {
      const failDto = {
        contentBlockId: 'block-001',
        answers: [
          { questionId: 'q1', selectedOptionId: 'a' }, // wrong
          { questionId: 'q2', selectedOptionId: 'c' }, // wrong
        ],
      };
      quizAttemptRepo.create.mockResolvedValue({
        id: 'attempt-002',
        passed: false,
      } as QuizAttempt);

      await service.submitQuiz('enrollment-001', 'user-001', failDto);

      expect(quizAttemptRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          score: 0,
          correctCount: 0,
          passed: false,
        }),
      );
    });

    it('should throw ForbiddenException for wrong user', async () => {
      enrollmentsService.findById.mockResolvedValue(
        createMockEnrollment({ userId: 'other-user' }),
      );

      await expect(
        service.submitQuiz('enrollment-001', 'user-001', dto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException for missing block', async () => {
      contentBlockRepo.findOne.mockResolvedValue(null);

      await expect(
        service.submitQuiz('enrollment-001', 'user-001', dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if block is not a quiz', async () => {
      contentBlockRepo.findOne.mockResolvedValue({
        ...createQuizBlock(),
        type: CONTENT_BLOCK_TYPE.TEXT,
      });

      await expect(
        service.submitQuiz('enrollment-001', 'user-001', dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if max attempts exceeded', async () => {
      quizAttemptRepo.countByEnrollmentAndBlock.mockResolvedValue(3);

      await expect(
        service.submitQuiz('enrollment-001', 'user-001', dto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  /* ---- hasPassedAllQuizzes ---- */

  describe('hasPassedAllQuizzes', () => {
    it('should return true when no quizzes exist', async () => {
      contentBlockRepo.find.mockResolvedValue([]);

      const result = await service.hasPassedAllQuizzes('enrollment-001', 'lesson-001');

      expect(result).toBe(true);
    });

    it('should return true when all quizzes are passed', async () => {
      contentBlockRepo.find.mockResolvedValue([
        { id: 'block-1' },
        { id: 'block-2' },
      ]);
      quizAttemptRepo.findAllPassedByEnrollmentAndLesson.mockResolvedValue([
        'block-1',
        'block-2',
      ]);

      const result = await service.hasPassedAllQuizzes('enrollment-001', 'lesson-001');

      expect(result).toBe(true);
    });

    it('should return false when some quizzes are not passed', async () => {
      contentBlockRepo.find.mockResolvedValue([
        { id: 'block-1' },
        { id: 'block-2' },
      ]);
      quizAttemptRepo.findAllPassedByEnrollmentAndLesson.mockResolvedValue([
        'block-1',
      ]);

      const result = await service.hasPassedAllQuizzes('enrollment-001', 'lesson-001');

      expect(result).toBe(false);
    });
  });
});
