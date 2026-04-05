import { Test } from '@nestjs/testing';
import { ForbiddenException, ConflictException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';

import type { TestingModule } from '@nestjs/testing';

import { CourseReviewsService } from './course-reviews.service';
import { CourseReviewRepository } from '../infrastructure/course-review.repository';
import { Enrollment } from '../../enrollments/domain/entities/enrollment.entity';
import { Course } from '../../courses/domain/entities/course.entity';

import type { CourseReview } from '../domain/entities/course-review.entity';

const createMockReview = (overrides: Partial<CourseReview> = {}): CourseReview =>
  ({
    id: 'review-001',
    userId: 'user-001',
    courseId: 'course-001',
    rating: 5,
    comment: 'Excellent course',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  }) as CourseReview;

describe('CourseReviewsService', () => {
  let service: CourseReviewsService;
  let reviewRepository: jest.Mocked<CourseReviewRepository>;
  let enrollmentRepository: {
    findOne: jest.Mock;
  };
  let courseRepository: {
    update: jest.Mock;
  };

  beforeEach(async () => {
    reviewRepository = {
      findByUserAndCourse: jest.fn(),
      findByCourse: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
      getAverageRating: jest.fn(),
    } as unknown as jest.Mocked<CourseReviewRepository>;

    enrollmentRepository = {
      findOne: jest.fn(),
    };

    courseRepository = {
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourseReviewsService,
        {
          provide: CourseReviewRepository,
          useValue: reviewRepository,
        },
        {
          provide: getRepositoryToken(Enrollment),
          useValue: enrollmentRepository,
        },
        {
          provide: getRepositoryToken(Course),
          useValue: courseRepository,
        },
      ],
    }).compile();

    service = module.get<CourseReviewsService>(CourseReviewsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should create review for completed enrollment', async () => {
      const review = createMockReview();
      enrollmentRepository.findOne.mockResolvedValue({ id: 'enr-001', status: 'completed' });
      reviewRepository.findByUserAndCourse.mockResolvedValue(null);
      reviewRepository.create.mockResolvedValue(review);
      reviewRepository.getAverageRating.mockResolvedValue({ avg: 5, count: 1 });
      courseRepository.update.mockResolvedValue(undefined);

      const result = await service.create('user-001', 'course-001', {
        rating: 5,
        comment: 'Excellent course',
      });

      expect(result).toEqual(review);
      expect(reviewRepository.create).toHaveBeenCalledWith({
        userId: 'user-001',
        courseId: 'course-001',
        rating: 5,
        comment: 'Excellent course',
      });
    });

    it('should throw ForbiddenException if enrollment not completed', async () => {
      enrollmentRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create('user-001', 'course-001', { rating: 5 }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if user already reviewed', async () => {
      enrollmentRepository.findOne.mockResolvedValue({ id: 'enr-001', status: 'completed' });
      reviewRepository.findByUserAndCourse.mockResolvedValue(createMockReview());

      await expect(
        service.create('user-001', 'course-001', { rating: 4 }),
      ).rejects.toThrow(ConflictException);
    });

    it('should recalculate course avgRating after create', async () => {
      const review = createMockReview();
      enrollmentRepository.findOne.mockResolvedValue({ id: 'enr-001', status: 'completed' });
      reviewRepository.findByUserAndCourse.mockResolvedValue(null);
      reviewRepository.create.mockResolvedValue(review);
      reviewRepository.getAverageRating.mockResolvedValue({ avg: 4.5, count: 2 });
      courseRepository.update.mockResolvedValue(undefined);

      await service.create('user-001', 'course-001', { rating: 5 });

      expect(reviewRepository.getAverageRating).toHaveBeenCalledWith('course-001');
      expect(courseRepository.update).toHaveBeenCalledWith('course-001', {
        avgRating: 4.5,
        reviewCount: 2,
      });
    });
  });

  describe('findByCourse', () => {
    it('should return reviews for a course', async () => {
      const reviews = [createMockReview(), createMockReview({ id: 'review-002', rating: 4 })];
      reviewRepository.findByCourse.mockResolvedValue(reviews);

      const result = await service.findByCourse('course-001');

      expect(result).toEqual(reviews);
      expect(reviewRepository.findByCourse).toHaveBeenCalledWith('course-001');
    });
  });

  describe('remove', () => {
    it('should throw ForbiddenException if not review owner', async () => {
      const review = createMockReview({ userId: 'other-user' });
      reviewRepository.findById.mockResolvedValue(review);

      await expect(service.remove('review-001', 'user-001')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
