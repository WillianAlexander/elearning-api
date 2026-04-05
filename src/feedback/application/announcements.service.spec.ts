import { Test } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';

import type { TestingModule } from '@nestjs/testing';

import { AnnouncementsService } from './announcements.service';
import { AnnouncementRepository } from '../infrastructure/announcement.repository';
import { Course } from '../../courses/domain/entities/course.entity';

import type { Announcement } from '../domain/entities/announcement.entity';

const createMockAnnouncement = (
  overrides: Partial<Announcement> = {},
): Announcement =>
  ({
    id: 'ann-001',
    courseId: 'course-001',
    authorId: 'user-001',
    title: 'Course Update',
    content: 'New materials added',
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  }) as Announcement;

describe('AnnouncementsService', () => {
  let service: AnnouncementsService;
  let announcementRepository: jest.Mocked<AnnouncementRepository>;
  let courseRepository: {
    findOne: jest.Mock;
  };

  beforeEach(async () => {
    announcementRepository = {
      findByCourse: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<AnnouncementRepository>;

    courseRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnnouncementsService,
        {
          provide: AnnouncementRepository,
          useValue: announcementRepository,
        },
        {
          provide: getRepositoryToken(Course),
          useValue: courseRepository,
        },
      ],
    }).compile();

    service = module.get<AnnouncementsService>(AnnouncementsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should create announcement for course', async () => {
      const announcement = createMockAnnouncement();
      courseRepository.findOne.mockResolvedValue({
        id: 'course-001',
        createdById: 'user-001',
      });
      announcementRepository.create.mockResolvedValue(announcement);

      const result = await service.create('course-001', 'user-001', {
        title: 'Course Update',
        content: 'New materials added',
      });

      expect(result).toEqual(announcement);
      expect(announcementRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          courseId: 'course-001',
          authorId: 'user-001',
          title: 'Course Update',
          content: 'New materials added',
        }),
      );
    });

    it('should throw ForbiddenException if user does not own the course', async () => {
      courseRepository.findOne.mockResolvedValue({
        id: 'course-001',
        createdById: 'other-user',
      });

      await expect(
        service.create('course-001', 'user-001', {
          title: 'Update',
          content: 'Content',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if course does not exist', async () => {
      courseRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create('course-999', 'user-001', {
          title: 'Update',
          content: 'Content',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCourse', () => {
    it('should return announcements for a course', async () => {
      const announcements = [
        createMockAnnouncement(),
        createMockAnnouncement({ id: 'ann-002', title: 'Second Update' }),
      ];
      announcementRepository.findByCourse.mockResolvedValue(announcements);

      const result = await service.findByCourse('course-001');

      expect(result).toEqual(announcements);
      expect(announcementRepository.findByCourse).toHaveBeenCalledWith('course-001');
    });
  });
});
