import { Test } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CONTENT_BLOCK_TYPE, LESSON_TYPE, USER_ROLE } from '@lms/shared';

import type { TestingModule } from '@nestjs/testing';

import { ContentBlocksService } from './content-blocks.service';
import { ContentBlockRepository } from '../infrastructure/content-block.repository';
import { ContentVersionRepository } from '../infrastructure/content-version.repository';
import { LessonRepository } from '../infrastructure/lesson.repository';
import { ModuleRepository } from '../infrastructure/module.repository';
import { CoursesService } from './courses.service';
import { ContentBlock } from '../domain/entities/content-block.entity';
import { ContentVersion } from '../domain/entities/content-version.entity';
import { Lesson } from '../domain/entities/lesson.entity';
import { CourseModule } from '../domain/entities/course-module.entity';

import type { CreateContentBlockDto } from './dto/create-content-block.dto';
import type { AuthenticatedUser } from '../../auth/domain/types';

const createMockBlock = (
  overrides: Partial<ContentBlock> = {},
): ContentBlock => {
  const block = new ContentBlock();
  block.id = 'block-uuid-001';
  block.lessonId = 'lesson-uuid-001';
  block.type = CONTENT_BLOCK_TYPE.TEXT;
  block.content = { html: '<p>Hello</p>' };
  block.orderIndex = 0;
  Object.assign(block, overrides);
  return block;
};

const createMockLesson = (overrides: Partial<Lesson> = {}): Lesson => {
  const lesson = new Lesson();
  lesson.id = 'lesson-uuid-001';
  lesson.moduleId = 'module-uuid-001';
  lesson.title = 'Lesson 1';
  lesson.type = LESSON_TYPE.TEXT;
  lesson.orderIndex = 0;
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

const createMockVersion = (
  overrides: Partial<ContentVersion> = {},
): ContentVersion => {
  const version = new ContentVersion();
  version.id = 'version-uuid-001';
  version.lessonId = 'lesson-uuid-001';
  version.versionNumber = 1;
  version.blocks = [{ type: 'text', content: { html: '<p>v1</p>' } }];
  version.createdById = 'user-uuid-001';
  version.createdAt = new Date();
  Object.assign(version, overrides);
  return version;
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

describe('ContentBlocksService', () => {
  let service: ContentBlocksService;
  let blockRepo: jest.Mocked<ContentBlockRepository>;
  let versionRepo: jest.Mocked<ContentVersionRepository>;
  let lessonRepo: jest.Mocked<LessonRepository>;
  let moduleRepo: jest.Mocked<ModuleRepository>;
  let coursesService: jest.Mocked<CoursesService>;

  beforeEach(async () => {
    blockRepo = {
      findById: jest.fn(),
      findByLessonId: jest.fn(),
      getMaxOrderIndex: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
      softDelete: jest.fn(),
      findByIds: jest.fn(),
    } as unknown as jest.Mocked<ContentBlockRepository>;

    versionRepo = {
      findById: jest.fn(),
      findByLessonId: jest.fn(),
      getLatestVersionNumber: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<ContentVersionRepository>;

    lessonRepo = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<LessonRepository>;

    moduleRepo = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<ModuleRepository>;

    coursesService = {
      assertCourseOwnership: jest.fn(),
    } as unknown as jest.Mocked<CoursesService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentBlocksService,
        { provide: ContentBlockRepository, useValue: blockRepo },
        { provide: ContentVersionRepository, useValue: versionRepo },
        { provide: LessonRepository, useValue: lessonRepo },
        { provide: ModuleRepository, useValue: moduleRepo },
        { provide: CoursesService, useValue: coursesService },
      ],
    }).compile();

    service = module.get<ContentBlocksService>(ContentBlocksService);
  });

  describe('create', () => {
    const owner = createMockUser();

    it('should create a content block within a lesson', async () => {
      const dto: CreateContentBlockDto = {
        type: CONTENT_BLOCK_TYPE.TEXT,
        content: { html: '<p>Hello</p>' },
      };

      lessonRepo.findById.mockResolvedValue(createMockLesson());
      moduleRepo.findById.mockResolvedValue(createMockModule());
      coursesService.assertCourseOwnership.mockResolvedValue(undefined);
      blockRepo.getMaxOrderIndex.mockResolvedValue(-1);
      blockRepo.create.mockResolvedValue(createMockBlock());

      const result = await service.create('lesson-uuid-001', dto, owner);

      expect(result.lessonId).toBe('lesson-uuid-001');
      expect(result.type).toBe(CONTENT_BLOCK_TYPE.TEXT);
      expect(result.content).toEqual({ html: '<p>Hello</p>' });
    });

    it('should throw NotFoundException when lesson not found', async () => {
      lessonRepo.findById.mockResolvedValue(null);

      await expect(
        service.create('non-existent', {
          type: CONTENT_BLOCK_TYPE.TEXT,
          content: {},
        }, owner),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when non-owner creates block', async () => {
      lessonRepo.findById.mockResolvedValue(createMockLesson());
      moduleRepo.findById.mockResolvedValue(createMockModule());
      coursesService.assertCourseOwnership.mockRejectedValue(
        new ForbiddenException('You can only modify your own courses'),
      );

      const nonOwner = createMockUser({ id: 'other-user-uuid' });

      await expect(
        service.create('lesson-uuid-001', {
          type: CONTENT_BLOCK_TYPE.TEXT,
          content: {},
        }, nonOwner),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findByLessonId', () => {
    it('should return blocks ordered by orderIndex', async () => {
      const blocks = [
        createMockBlock({ orderIndex: 0 }),
        createMockBlock({ id: 'block-uuid-002', orderIndex: 1 }),
      ];

      lessonRepo.findById.mockResolvedValue(createMockLesson());
      blockRepo.findByLessonId.mockResolvedValue(blocks);

      const result = await service.findByLessonId('lesson-uuid-001');

      expect(result).toHaveLength(2);
    });
  });

  describe('reorder', () => {
    const owner = createMockUser();

    it('should reorder blocks based on provided ID order', async () => {
      const blocks = [
        createMockBlock({ id: 'b-a', orderIndex: 0 }),
        createMockBlock({ id: 'b-b', orderIndex: 1 }),
      ];

      lessonRepo.findById.mockResolvedValue(createMockLesson());
      moduleRepo.findById.mockResolvedValue(createMockModule());
      coursesService.assertCourseOwnership.mockResolvedValue(undefined);
      blockRepo.findByIds.mockResolvedValue(blocks);
      blockRepo.saveMany.mockImplementation(async (b) => b);

      const result = await service.reorder('lesson-uuid-001', {
        orderedIds: ['b-b', 'b-a'],
      }, owner);

      expect(result[0]!.id).toBe('b-b');
      expect(result[0]!.orderIndex).toBe(0);
    });
  });

  describe('createVersion', () => {
    const owner = createMockUser();

    it('should create a version snapshot of all blocks', async () => {
      const blocks = [
        createMockBlock({ orderIndex: 0 }),
        createMockBlock({
          id: 'block-uuid-002',
          orderIndex: 1,
          type: CONTENT_BLOCK_TYPE.VIDEO,
          content: { url: 'video.mp4' },
        }),
      ];

      lessonRepo.findById.mockResolvedValue(createMockLesson());
      moduleRepo.findById.mockResolvedValue(createMockModule());
      coursesService.assertCourseOwnership.mockResolvedValue(undefined);
      blockRepo.findByLessonId.mockResolvedValue(blocks);
      versionRepo.getLatestVersionNumber.mockResolvedValue(0);
      versionRepo.create.mockResolvedValue(createMockVersion());

      const result = await service.createVersion(
        'lesson-uuid-001',
        'user-uuid-001',
        owner,
      );

      expect(versionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          lessonId: 'lesson-uuid-001',
          versionNumber: 1,
          createdById: 'user-uuid-001',
        }),
      );
      expect(result.versionNumber).toBe(1);
    });
  });

  describe('listVersions', () => {
    it('should return versions ordered by versionNumber DESC', async () => {
      const versions = [
        createMockVersion({ versionNumber: 2 }),
        createMockVersion({ id: 'v-002', versionNumber: 1 }),
      ];

      lessonRepo.findById.mockResolvedValue(createMockLesson());
      versionRepo.findByLessonId.mockResolvedValue(versions);

      const result = await service.listVersions('lesson-uuid-001');

      expect(result).toHaveLength(2);
    });
  });

  describe('softDelete', () => {
    const owner = createMockUser();

    it('should soft delete a block', async () => {
      blockRepo.findById.mockResolvedValue(createMockBlock());
      lessonRepo.findById.mockResolvedValue(createMockLesson());
      moduleRepo.findById.mockResolvedValue(createMockModule());
      coursesService.assertCourseOwnership.mockResolvedValue(undefined);
      blockRepo.softDelete.mockResolvedValue(undefined);

      await service.softDelete('block-uuid-001', owner);

      expect(blockRepo.softDelete).toHaveBeenCalledWith('block-uuid-001');
    });
  });
});
