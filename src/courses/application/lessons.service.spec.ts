import { Test } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { LESSON_TYPE, USER_ROLE } from '@lms/shared';

import type { TestingModule } from '@nestjs/testing';

import { LessonsService } from './lessons.service';
import { LessonRepository } from '../infrastructure/lesson.repository';
import { ModuleRepository } from '../infrastructure/module.repository';
import { CoursesService } from './courses.service';
import { Lesson } from '../domain/entities/lesson.entity';
import { CourseModule } from '../domain/entities/course-module.entity';

import type { CreateLessonDto } from './dto/create-lesson.dto';
import type { AuthenticatedUser } from '../../auth/domain/types';

const createMockLesson = (overrides: Partial<Lesson> = {}): Lesson => {
  const lesson = new Lesson();
  lesson.id = 'lesson-uuid-001';
  lesson.moduleId = 'module-uuid-001';
  lesson.title = 'Lección 1: Intro';
  lesson.description = null;
  lesson.type = LESSON_TYPE.TEXT;
  lesson.orderIndex = 0;
  lesson.estimatedDuration = null;
  Object.assign(lesson, overrides);
  return lesson;
};

const createMockModule = (
  overrides: Partial<CourseModule> = {},
): CourseModule => {
  const mod = new CourseModule();
  mod.id = 'module-uuid-001';
  mod.courseId = 'course-uuid-001';
  mod.title = 'Module 1';
  mod.orderIndex = 0;
  Object.assign(mod, overrides);
  return mod;
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

describe('LessonsService', () => {
  let service: LessonsService;
  let lessonRepo: jest.Mocked<LessonRepository>;
  let moduleRepo: jest.Mocked<ModuleRepository>;
  let coursesService: jest.Mocked<CoursesService>;

  beforeEach(async () => {
    lessonRepo = {
      findById: jest.fn(),
      findByModuleId: jest.fn(),
      getMaxOrderIndex: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
      softDelete: jest.fn(),
      findByIds: jest.fn(),
    } as unknown as jest.Mocked<LessonRepository>;

    moduleRepo = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<ModuleRepository>;

    coursesService = {
      assertCourseOwnership: jest.fn(),
    } as unknown as jest.Mocked<CoursesService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LessonsService,
        { provide: LessonRepository, useValue: lessonRepo },
        { provide: ModuleRepository, useValue: moduleRepo },
        { provide: CoursesService, useValue: coursesService },
      ],
    }).compile();

    service = module.get<LessonsService>(LessonsService);
  });

  describe('create', () => {
    const owner = createMockUser();

    it('should create a lesson within a module', async () => {
      const dto: CreateLessonDto = { title: 'Lección 1: Intro' };

      moduleRepo.findById.mockResolvedValue(createMockModule());
      coursesService.assertCourseOwnership.mockResolvedValue(undefined);
      lessonRepo.getMaxOrderIndex.mockResolvedValue(-1);
      lessonRepo.create.mockResolvedValue(createMockLesson());

      const result = await service.create('module-uuid-001', dto, owner);

      expect(result.moduleId).toBe('module-uuid-001');
      expect(result.title).toBe('Lección 1: Intro');
    });

    it('should throw NotFoundException when module not found', async () => {
      moduleRepo.findById.mockResolvedValue(null);

      await expect(
        service.create('non-existent', { title: 'Test' }, owner),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when non-owner creates lesson', async () => {
      moduleRepo.findById.mockResolvedValue(createMockModule());
      coursesService.assertCourseOwnership.mockRejectedValue(
        new ForbiddenException('You can only modify your own courses'),
      );

      const nonOwner = createMockUser({ id: 'other-user-uuid' });

      await expect(
        service.create('module-uuid-001', { title: 'Test' }, nonOwner),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findByModuleId', () => {
    it('should return lessons ordered by orderIndex', async () => {
      const lessons = [
        createMockLesson({ orderIndex: 0 }),
        createMockLesson({ id: 'lesson-uuid-002', orderIndex: 1 }),
      ];

      moduleRepo.findById.mockResolvedValue(createMockModule());
      lessonRepo.findByModuleId.mockResolvedValue(lessons);

      const result = await service.findByModuleId('module-uuid-001');

      expect(result).toHaveLength(2);
    });
  });

  describe('reorder', () => {
    const owner = createMockUser();

    it('should reorder lessons based on provided ID order', async () => {
      const lessons = [
        createMockLesson({ id: 'l-a', orderIndex: 0 }),
        createMockLesson({ id: 'l-b', orderIndex: 1 }),
      ];

      moduleRepo.findById.mockResolvedValue(createMockModule());
      coursesService.assertCourseOwnership.mockResolvedValue(undefined);
      lessonRepo.findByIds.mockResolvedValue(lessons);
      lessonRepo.saveMany.mockImplementation(async (l) => l);

      const result = await service.reorder('module-uuid-001', {
        orderedIds: ['l-b', 'l-a'],
      }, owner);

      expect(result[0]!.id).toBe('l-b');
      expect(result[0]!.orderIndex).toBe(0);
      expect(result[1]!.id).toBe('l-a');
      expect(result[1]!.orderIndex).toBe(1);
    });
  });

  describe('softDelete', () => {
    const owner = createMockUser();

    it('should soft delete a lesson', async () => {
      lessonRepo.findById.mockResolvedValue(createMockLesson());
      moduleRepo.findById.mockResolvedValue(createMockModule());
      coursesService.assertCourseOwnership.mockResolvedValue(undefined);
      lessonRepo.softDelete.mockResolvedValue(undefined);

      await service.softDelete('lesson-uuid-001', owner);

      expect(lessonRepo.softDelete).toHaveBeenCalledWith('lesson-uuid-001');
    });
  });
});
