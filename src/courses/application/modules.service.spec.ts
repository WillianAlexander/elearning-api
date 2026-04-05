import { Test } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

import type { TestingModule } from '@nestjs/testing';
import type { DeepPartial } from 'typeorm';

import { ModulesService } from './modules.service';
import { ModuleRepository } from '../infrastructure/module.repository';
import { CourseRepository } from '../infrastructure/course.repository';
import { CoursesService } from './courses.service';
import { CourseModule } from '../domain/entities/course-module.entity';
import { Course } from '../domain/entities/course.entity';
import { COURSE_STATUS, DIFFICULTY_LEVEL, USER_ROLE } from '@lms/shared';

import type { CreateModuleDto } from './dto/create-module.dto';
import type { AuthenticatedUser } from '../../auth/domain/types';

const createMockModule = (
  overrides: DeepPartial<CourseModule> = {},
): CourseModule => {
  const mod = new CourseModule();
  mod.id = 'module-uuid-001';
  mod.courseId = 'course-uuid-001';
  mod.title = 'Módulo 1: Fundamentos';
  mod.description = 'Descripción del módulo';
  mod.orderIndex = 0;
  Object.assign(mod, overrides);
  return mod;
};

const createMockCourse = (overrides: Partial<Course> = {}): Course => {
  const course = new Course();
  course.id = 'course-uuid-001';
  course.title = 'Test Course';
  course.slug = 'test-course';
  course.status = COURSE_STATUS.DRAFT;
  course.difficultyLevel = DIFFICULTY_LEVEL.BEGINNER;
  course.createdById = 'instructor-uuid-001';
  Object.assign(course, overrides);
  return course;
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

describe('ModulesService', () => {
  let service: ModulesService;
  let moduleRepo: jest.Mocked<ModuleRepository>;
  let courseRepo: jest.Mocked<CourseRepository>;
  let coursesService: jest.Mocked<CoursesService>;

  beforeEach(async () => {
    moduleRepo = {
      findById: jest.fn(),
      findByCourseId: jest.fn(),
      getMaxOrderIndex: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
      softDelete: jest.fn(),
      findByIds: jest.fn(),
    } as unknown as jest.Mocked<ModuleRepository>;

    courseRepo = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<CourseRepository>;

    coursesService = {
      assertCourseOwnership: jest.fn(),
    } as unknown as jest.Mocked<CoursesService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModulesService,
        { provide: ModuleRepository, useValue: moduleRepo },
        { provide: CourseRepository, useValue: courseRepo },
        { provide: CoursesService, useValue: coursesService },
      ],
    }).compile();

    service = module.get<ModulesService>(ModulesService);
  });

  describe('create', () => {
    const owner = createMockUser();

    it('should create a module within a course', async () => {
      const dto: CreateModuleDto = { title: 'Módulo 1: Fundamentos' };
      const courseId = 'course-uuid-001';

      courseRepo.findById.mockResolvedValue(createMockCourse());
      coursesService.assertCourseOwnership.mockResolvedValue(undefined);
      moduleRepo.getMaxOrderIndex.mockResolvedValue(-1);
      moduleRepo.create.mockResolvedValue(createMockModule());

      const result = await service.create(courseId, dto, owner);

      expect(result.courseId).toBe(courseId);
      expect(result.title).toBe('Módulo 1: Fundamentos');
    });

    it('should auto-assign orderIndex as next in sequence', async () => {
      const dto: CreateModuleDto = { title: 'Módulo 2' };

      courseRepo.findById.mockResolvedValue(createMockCourse());
      coursesService.assertCourseOwnership.mockResolvedValue(undefined);
      moduleRepo.getMaxOrderIndex.mockResolvedValue(0);
      moduleRepo.create.mockImplementation(async (data) => {
        return createMockModule(data);
      });

      const result = await service.create('course-uuid-001', dto, owner);

      expect(result.orderIndex).toBe(1);
    });

    it('should throw NotFoundException when course not found', async () => {
      courseRepo.findById.mockResolvedValue(null);

      await expect(
        service.create('non-existent', { title: 'Test' }, owner),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when non-owner creates module', async () => {
      courseRepo.findById.mockResolvedValue(createMockCourse());
      coursesService.assertCourseOwnership.mockRejectedValue(
        new ForbiddenException('You can only modify your own courses'),
      );

      const nonOwner = createMockUser({ id: 'other-user-uuid' });

      await expect(
        service.create('course-uuid-001', { title: 'Test' }, nonOwner),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findByCourseId', () => {
    it('should return modules ordered by orderIndex', async () => {
      const modules = [
        createMockModule({ orderIndex: 0 }),
        createMockModule({ id: 'module-uuid-002', orderIndex: 1 }),
      ];

      courseRepo.findById.mockResolvedValue(createMockCourse());
      moduleRepo.findByCourseId.mockResolvedValue(modules);

      const result = await service.findByCourseId('course-uuid-001');

      expect(result).toHaveLength(2);
    });
  });

  describe('reorder', () => {
    const owner = createMockUser();

    it('should reorder modules based on provided ID order', async () => {
      const modules = [
        createMockModule({ id: 'mod-a', orderIndex: 0 }),
        createMockModule({ id: 'mod-b', orderIndex: 1 }),
        createMockModule({ id: 'mod-c', orderIndex: 2 }),
      ];

      courseRepo.findById.mockResolvedValue(createMockCourse());
      coursesService.assertCourseOwnership.mockResolvedValue(undefined);
      moduleRepo.findByIds.mockResolvedValue(modules);
      moduleRepo.saveMany.mockImplementation(async (mods) => mods);

      const result = await service.reorder('course-uuid-001', {
        orderedIds: ['mod-c', 'mod-a', 'mod-b'],
      }, owner);

      expect(result[0]!.id).toBe('mod-c');
      expect(result[0]!.orderIndex).toBe(0);
      expect(result[1]!.id).toBe('mod-a');
      expect(result[1]!.orderIndex).toBe(1);
      expect(result[2]!.id).toBe('mod-b');
      expect(result[2]!.orderIndex).toBe(2);
    });
  });

  describe('softDelete', () => {
    const owner = createMockUser();

    it('should soft delete a module', async () => {
      moduleRepo.findById.mockResolvedValue(createMockModule());
      coursesService.assertCourseOwnership.mockResolvedValue(undefined);
      moduleRepo.softDelete.mockResolvedValue(undefined);

      await service.softDelete('module-uuid-001', owner);

      expect(moduleRepo.softDelete).toHaveBeenCalledWith('module-uuid-001');
    });

    it('should throw NotFoundException when not found', async () => {
      moduleRepo.findById.mockResolvedValue(null);

      await expect(service.softDelete('non-existent', owner)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
