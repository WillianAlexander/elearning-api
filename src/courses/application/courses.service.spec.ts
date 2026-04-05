import { Test } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { COURSE_STATUS, DIFFICULTY_LEVEL, USER_ROLE } from '@lms/shared';

import type { TestingModule } from '@nestjs/testing';
import type { DeepPartial } from 'typeorm';

import { CoursesService } from './courses.service';
import { CourseRepository } from '../infrastructure/course.repository';
import { TagRepository } from '../infrastructure/tag.repository';
import { Course } from '../domain/entities/course.entity';
import { Tag } from '../domain/entities/tag.entity';

import type { CreateCourseDto } from './dto/create-course.dto';
import type { AuthenticatedUser } from '../../auth/domain/types';

const createMockCourse = (overrides: DeepPartial<Course> = {}): Course => {
  const course = new Course();
  course.id = 'course-uuid-001';
  course.title = 'Introducción a la Banca Digital';
  course.slug = 'introduccion-a-la-banca-digital';
  course.description = 'Un curso completo';
  course.thumbnailUrl = null;
  course.estimatedDuration = 120;
  course.difficultyLevel = DIFFICULTY_LEVEL.BEGINNER;
  course.status = COURSE_STATUS.DRAFT;
  course.categoryId = null;
  course.createdById = 'instructor-uuid-001';
  course.publishedAt = null;
  course.tags = [];
  Object.assign(course, overrides);
  return course;
};

const createMockTag = (overrides: Partial<Tag> = {}): Tag => {
  const tag = new Tag();
  tag.id = 'tag-uuid-001';
  tag.name = 'finanzas';
  Object.assign(tag, overrides);
  return tag;
};

const createMockUser = (overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser => ({
  id: 'instructor-uuid-001',
  azureAdId: 'azure-001',
  email: 'instructor@test.com',
  name: 'Test Instructor',
  firstName: 'Test',
  lastName: 'Instructor',
  role: USER_ROLE.INSTRUCTOR,
  area: 'TI',
  cargo: 'Instructor',
  isActive: true,
  ...overrides,
});

describe('CoursesService', () => {
  let service: CoursesService;
  let courseRepo: jest.Mocked<CourseRepository>;
  let tagRepo: jest.Mocked<TagRepository>;

  beforeEach(async () => {
    courseRepo = {
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findPaginated: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<CourseRepository>;

    tagRepo = {
      findByIds: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      findOrCreate: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<TagRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: CourseRepository, useValue: courseRepo },
        { provide: TagRepository, useValue: tagRepo },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
  });

  describe('create', () => {
    it('should create a course with DRAFT status', async () => {
      const dto: CreateCourseDto = {
        title: 'Introducción a la Banca Digital',
        description: 'Un curso completo',
      };
      const instructorId = 'instructor-uuid-001';

      courseRepo.findBySlug.mockResolvedValue(null);
      const created = createMockCourse();
      courseRepo.create.mockResolvedValue(created);

      const result = await service.create(dto, instructorId);

      expect(result.status).toBe(COURSE_STATUS.DRAFT);
      expect(result.createdById).toBe(instructorId);
      expect(courseRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Introducción a la Banca Digital',
          status: COURSE_STATUS.DRAFT,
          createdById: instructorId,
        }),
      );
    });

    it('should generate a slug from the title', async () => {
      const dto: CreateCourseDto = {
        title: 'Introducción a la Banca Digital',
      };

      courseRepo.findBySlug.mockResolvedValue(null);
      courseRepo.create.mockImplementation(async (data) => {
        return createMockCourse(data);
      });

      const result = await service.create(dto, 'instructor-uuid-001');

      expect(result.slug).toContain('introduccion-a-la-banca-digital');
    });

    it('should resolve tags when tagIds provided', async () => {
      const dto: CreateCourseDto = {
        title: 'Curso con Tags',
        tagIds: ['tag-uuid-001', 'tag-uuid-002'],
      };
      const tags = [
        createMockTag({ id: 'tag-uuid-001', name: 'finanzas' }),
        createMockTag({ id: 'tag-uuid-002', name: 'digital' }),
      ];

      courseRepo.findBySlug.mockResolvedValue(null);
      tagRepo.findByIds.mockResolvedValue(tags);
      courseRepo.create.mockImplementation(async (data) => {
        return createMockCourse({ ...data, tags });
      });

      const result = await service.create(dto, 'instructor-uuid-001');

      expect(tagRepo.findByIds).toHaveBeenCalledWith([
        'tag-uuid-001',
        'tag-uuid-002',
      ]);
      expect(result.tags).toHaveLength(2);
    });
  });

  describe('findById', () => {
    it('should return a course when found', async () => {
      const mockCourse = createMockCourse();
      courseRepo.findById.mockResolvedValue(mockCourse);

      const result = await service.findById('course-uuid-001');

      expect(result).toEqual(mockCourse);
    });

    it('should throw NotFoundException when not found', async () => {
      courseRepo.findById.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findPaginated', () => {
    it('should return paginated courses', async () => {
      const paginatedResult = {
        items: [createMockCourse()],
        totalItems: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };

      courseRepo.findPaginated.mockResolvedValue(paginatedResult);

      const result = await service.findPaginated({ page: 1, pageSize: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.totalItems).toBe(1);
    });
  });

  describe('publish', () => {
    it('should publish a PENDING_REVIEW course (admin-only, no user param)', async () => {
      const pending = createMockCourse({ status: COURSE_STATUS.PENDING_REVIEW });
      const published = createMockCourse({
        status: COURSE_STATUS.PUBLISHED,
        publishedAt: new Date(),
      });

      courseRepo.findById.mockResolvedValue(pending);
      courseRepo.save.mockResolvedValue(published);

      const result = await service.publish('course-uuid-001');

      expect(result.status).toBe(COURSE_STATUS.PUBLISHED);
    });

    it('should throw BadRequestException when publishing a non-PENDING_REVIEW course', async () => {
      const draft = createMockCourse({ status: COURSE_STATUS.DRAFT });
      courseRepo.findById.mockResolvedValue(draft);

      await expect(service.publish('course-uuid-001')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('archive', () => {
    it('should archive a PUBLISHED course (admin-only, no user param)', async () => {
      const published = createMockCourse({ status: COURSE_STATUS.PUBLISHED });
      const archived = createMockCourse({ status: COURSE_STATUS.ARCHIVED });

      courseRepo.findById.mockResolvedValue(published);
      courseRepo.save.mockResolvedValue(archived);

      const result = await service.archive('course-uuid-001');

      expect(result.status).toBe(COURSE_STATUS.ARCHIVED);
    });

    it('should throw BadRequestException when archiving a DRAFT course', async () => {
      const draft = createMockCourse({ status: COURSE_STATUS.DRAFT });
      courseRepo.findById.mockResolvedValue(draft);

      await expect(service.archive('course-uuid-001')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    const owner = createMockUser();

    it('should update course metadata', async () => {
      const existing = createMockCourse();
      const updated = createMockCourse({
        title: 'Título Actualizado',
      });

      courseRepo.findById.mockResolvedValue(existing);
      courseRepo.update.mockResolvedValue(updated);

      const result = await service.update('course-uuid-001', {
        title: 'Título Actualizado',
      }, owner);

      expect(result.title).toBe('Título Actualizado');
    });

    it('should throw NotFoundException for non-existent course', async () => {
      courseRepo.findById.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { title: 'New' }, owner),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when non-owner tries to update', async () => {
      const existing = createMockCourse();
      courseRepo.findById.mockResolvedValue(existing);

      const nonOwner = createMockUser({ id: 'other-user-uuid' });

      await expect(
        service.update('course-uuid-001', { title: 'New' }, nonOwner),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('softDelete', () => {
    it('should soft delete a course', async () => {
      const existing = createMockCourse();
      courseRepo.findById.mockResolvedValue(existing);
      courseRepo.softDelete.mockResolvedValue(undefined);

      await service.softDelete('course-uuid-001');

      expect(courseRepo.softDelete).toHaveBeenCalledWith('course-uuid-001');
    });

    it('should throw NotFoundException for non-existent course', async () => {
      courseRepo.findById.mockResolvedValue(null);

      await expect(service.softDelete('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
