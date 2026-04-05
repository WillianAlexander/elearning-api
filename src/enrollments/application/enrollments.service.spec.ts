import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { ENROLLMENT_STATUS, COURSE_STATUS, USER_ROLE } from '@lms/shared';

import { CoursesService } from '@/courses/application/courses.service';

import { EnrollmentsService } from './enrollments.service';
import { EnrollmentRepository } from '../infrastructure/enrollment.repository';
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
    completedAt: null,
    droppedAt: null,
    expiredAt: null,
    expiresAt: null,
    enrolledById: null,
    lastAccessedAt: null,
    progressPercentage: 0,
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-15'),
    deletedAt: null,
    ...overrides,
  }) as Enrollment;

const createMockCourse = (overrides: Record<string, unknown> = {}) => ({
  id: 'course-001',
  title: 'Test Course',
  status: COURSE_STATUS.PUBLISHED,
  ...overrides,
});

/* ------------------------------------------------------------------ */
/*  Test suite                                                         */
/* ------------------------------------------------------------------ */

describe('EnrollmentsService', () => {
  let service: EnrollmentsService;
  let enrollmentRepo: jest.Mocked<EnrollmentRepository>;
  let coursesService: jest.Mocked<CoursesService>;

  beforeEach(async () => {
    enrollmentRepo = {
      findById: jest.fn(),
      findByUserAndCourse: jest.fn(),
      findByUser: jest.fn(),
      findPaginated: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<EnrollmentRepository>;

    coursesService = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<CoursesService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnrollmentsService,
        { provide: EnrollmentRepository, useValue: enrollmentRepo },
        { provide: CoursesService, useValue: coursesService },
      ],
    }).compile();

    service = module.get<EnrollmentsService>(EnrollmentsService);
  });

  /* ---- selfEnroll ---- */

  describe('selfEnroll', () => {
    const dto = { courseId: 'course-001' };
    const userId = 'user-001';
    const colaboradorRole = USER_ROLE.COLABORADOR;

    it('should create enrollment for a published course', async () => {
      coursesService.findById.mockResolvedValue(createMockCourse() as never);
      enrollmentRepo.findByUserAndCourse.mockResolvedValue(null);
      const created = createMockEnrollment();
      enrollmentRepo.create.mockResolvedValue(created);

      const result = await service.selfEnroll(dto, userId, colaboradorRole);

      expect(result).toBe(created);
      expect(enrollmentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          courseId: dto.courseId,
          status: ENROLLMENT_STATUS.ACTIVE,
          enrolledById: null,
        }),
      );
    });

    it('should reject enrollment for a draft course', async () => {
      coursesService.findById.mockResolvedValue(
        createMockCourse({ status: COURSE_STATUS.DRAFT }) as never,
      );

      await expect(service.selfEnroll(dto, userId, colaboradorRole)).rejects.toThrow(
        BadRequestException,
      );
      expect(enrollmentRepo.create).not.toHaveBeenCalled();
    });

    it('should reject duplicate active enrollment', async () => {
      coursesService.findById.mockResolvedValue(createMockCourse() as never);
      enrollmentRepo.findByUserAndCourse.mockResolvedValue(
        createMockEnrollment(),
      );

      await expect(service.selfEnroll(dto, userId, colaboradorRole)).rejects.toThrow(
        BadRequestException,
      );
      expect(enrollmentRepo.create).not.toHaveBeenCalled();
    });

    it('should propagate NotFoundException when course does not exist', async () => {
      coursesService.findById.mockRejectedValue(
        new NotFoundException('Course not found'),
      );

      await expect(service.selfEnroll(dto, userId, colaboradorRole)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should reject self-enrollment for admin role', async () => {
      await expect(
        service.selfEnroll(dto, userId, USER_ROLE.ADMINISTRADOR),
      ).rejects.toThrow(ForbiddenException);
      expect(enrollmentRepo.create).not.toHaveBeenCalled();
    });

    it('should reject self-enrollment for instructor role', async () => {
      await expect(
        service.selfEnroll(dto, userId, USER_ROLE.INSTRUCTOR),
      ).rejects.toThrow(ForbiddenException);
      expect(enrollmentRepo.create).not.toHaveBeenCalled();
    });
  });

  /* ---- bulkEnroll ---- */

  describe('bulkEnroll', () => {
    const adminId = 'admin-001';
    const dto = {
      courseId: 'course-001',
      userIds: ['user-001', 'user-002', 'user-003'],
    };

    it('should enroll multiple users and report results', async () => {
      coursesService.findById.mockResolvedValue(createMockCourse() as never);
      enrollmentRepo.findByUserAndCourse.mockResolvedValue(null);
      enrollmentRepo.create.mockResolvedValue(createMockEnrollment());

      const result = await service.bulkEnroll(dto, adminId);

      expect(result.enrolled).toHaveLength(3);
      expect(result.skipped).toHaveLength(0);
      expect(result.total).toBe(3);
      expect(enrollmentRepo.create).toHaveBeenCalledTimes(3);
    });

    it('should skip already-enrolled users (idempotent)', async () => {
      coursesService.findById.mockResolvedValue(createMockCourse() as never);
      enrollmentRepo.findByUserAndCourse
        .mockResolvedValueOnce(createMockEnrollment()) // user-001 already enrolled
        .mockResolvedValueOnce(null) // user-002 new
        .mockResolvedValueOnce(null); // user-003 new
      enrollmentRepo.create.mockResolvedValue(createMockEnrollment());

      const result = await service.bulkEnroll(dto, adminId);

      expect(result.enrolled).toEqual(['user-002', 'user-003']);
      expect(result.skipped).toEqual(['user-001']);
      expect(result.total).toBe(3);
      expect(enrollmentRepo.create).toHaveBeenCalledTimes(2);
    });

    it('should set enrolledById to the admin', async () => {
      coursesService.findById.mockResolvedValue(createMockCourse() as never);
      enrollmentRepo.findByUserAndCourse.mockResolvedValue(null);
      enrollmentRepo.create.mockResolvedValue(createMockEnrollment());

      await service.bulkEnroll({ courseId: 'course-001', userIds: ['user-001'] }, adminId);

      expect(enrollmentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ enrolledById: adminId }),
      );
    });

    it('should reject bulk enroll for non-published course', async () => {
      coursesService.findById.mockResolvedValue(
        createMockCourse({ status: COURSE_STATUS.DRAFT }) as never,
      );

      await expect(service.bulkEnroll(dto, adminId)).rejects.toThrow(
        BadRequestException,
      );
      expect(enrollmentRepo.create).not.toHaveBeenCalled();
    });
  });

  /* ---- findById ---- */

  describe('findById', () => {
    it('should return enrollment when found', async () => {
      const enrollment = createMockEnrollment();
      enrollmentRepo.findById.mockResolvedValue(enrollment);

      const result = await service.findById('enrollment-001');

      expect(result).toBe(enrollment);
      expect(enrollmentRepo.findById).toHaveBeenCalledWith('enrollment-001');
    });

    it('should throw NotFoundException when not found', async () => {
      enrollmentRepo.findById.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  /* ---- findMyEnrollments ---- */

  describe('findMyEnrollments', () => {
    it('should delegate to repository with userId', async () => {
      const enrollments = [createMockEnrollment()];
      enrollmentRepo.findByUser.mockResolvedValue(enrollments);

      const result = await service.findMyEnrollments('user-001');

      expect(result).toBe(enrollments);
      expect(enrollmentRepo.findByUser).toHaveBeenCalledWith('user-001');
    });
  });

  /* ---- findPaginated ---- */

  describe('findPaginated', () => {
    it('should pass query params to repository', async () => {
      const paginated = {
        items: [createMockEnrollment()],
        totalItems: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };
      enrollmentRepo.findPaginated.mockResolvedValue(paginated);

      const query = { page: 1, pageSize: 20, status: ENROLLMENT_STATUS.ACTIVE };
      const result = await service.findPaginated(query);

      expect(result).toBe(paginated);
      expect(enrollmentRepo.findPaginated).toHaveBeenCalledWith(
        expect.objectContaining({ status: ENROLLMENT_STATUS.ACTIVE }),
      );
    });
  });

  /* ---- drop ---- */

  describe('drop', () => {
    it('should drop own active enrollment', async () => {
      const enrollment = createMockEnrollment();
      enrollmentRepo.findById.mockResolvedValue(enrollment);
      enrollmentRepo.save.mockResolvedValue({
        ...enrollment,
        status: ENROLLMENT_STATUS.DROPPED,
      } as Enrollment);

      const result = await service.drop('enrollment-001', 'user-001', false);

      expect(result.status).toBe(ENROLLMENT_STATUS.DROPPED);
      expect(enrollmentRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ENROLLMENT_STATUS.DROPPED,
        }),
      );
    });

    it('should allow admin to drop any enrollment', async () => {
      const enrollment = createMockEnrollment({ userId: 'other-user' });
      enrollmentRepo.findById.mockResolvedValue(enrollment);
      enrollmentRepo.save.mockResolvedValue({
        ...enrollment,
        status: ENROLLMENT_STATUS.DROPPED,
      } as Enrollment);

      const result = await service.drop('enrollment-001', 'admin-001', true);

      expect(result.status).toBe(ENROLLMENT_STATUS.DROPPED);
    });

    it('should forbid non-owner non-admin from dropping', async () => {
      const enrollment = createMockEnrollment({ userId: 'other-user' });
      enrollmentRepo.findById.mockResolvedValue(enrollment);

      await expect(
        service.drop('enrollment-001', 'user-001', false),
      ).rejects.toThrow(ForbiddenException);
      expect(enrollmentRepo.save).not.toHaveBeenCalled();
    });

    it('should reject drop when enrollment is not active', async () => {
      const enrollment = createMockEnrollment({
        status: ENROLLMENT_STATUS.COMPLETED,
      });
      enrollmentRepo.findById.mockResolvedValue(enrollment);

      await expect(
        service.drop('enrollment-001', 'user-001', false),
      ).rejects.toThrow(BadRequestException);
      expect(enrollmentRepo.save).not.toHaveBeenCalled();
    });
  });

  /* ---- softDelete ---- */

  describe('softDelete', () => {
    it('should verify existence then soft-delete', async () => {
      enrollmentRepo.findById.mockResolvedValue(createMockEnrollment());
      enrollmentRepo.softDelete.mockResolvedValue(undefined);

      await service.softDelete('enrollment-001');

      expect(enrollmentRepo.softDelete).toHaveBeenCalledWith('enrollment-001');
    });

    it('should throw NotFoundException if enrollment does not exist', async () => {
      enrollmentRepo.findById.mockResolvedValue(null);

      await expect(service.softDelete('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      expect(enrollmentRepo.softDelete).not.toHaveBeenCalled();
    });
  });

  /* ---- updateProgress ---- */

  describe('updateProgress', () => {
    it('should update percentage and save', async () => {
      const enrollment = createMockEnrollment({ progressPercentage: 50 });
      enrollmentRepo.save.mockResolvedValue({
        ...enrollment,
        progressPercentage: 75,
      } as Enrollment);

      const result = await service.updateProgress(enrollment, 75);

      expect(result.progressPercentage).toBe(75);
    });

    it('should auto-complete when reaching 100%', async () => {
      const enrollment = createMockEnrollment({
        status: ENROLLMENT_STATUS.ACTIVE,
        progressPercentage: 90,
      });
      enrollmentRepo.save.mockImplementation(async (e) => e as Enrollment);

      const result = await service.updateProgress(enrollment, 100);

      expect(result.status).toBe(ENROLLMENT_STATUS.COMPLETED);
      expect(result.completedAt).toBeInstanceOf(Date);
    });

    it('should NOT auto-complete if already completed', async () => {
      const enrollment = createMockEnrollment({
        status: ENROLLMENT_STATUS.COMPLETED,
        completedAt: new Date('2026-01-20'),
      });
      enrollmentRepo.save.mockImplementation(async (e) => e as Enrollment);

      const result = await service.updateProgress(enrollment, 100);

      // completedAt should remain the original date, not get overwritten
      expect(result.completedAt).toEqual(new Date('2026-01-20'));
    });
  });
});
