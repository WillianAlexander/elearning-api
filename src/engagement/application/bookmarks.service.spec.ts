import { Test } from '@nestjs/testing';

import type { TestingModule } from '@nestjs/testing';

import { BookmarksService } from './bookmarks.service';
import { BookmarkRepository } from '../infrastructure/bookmark.repository';

import type { Bookmark } from '../domain/entities/bookmark.entity';

const createMockBookmark = (overrides: Partial<Bookmark> = {}): Bookmark =>
  ({
    id: 'bookmark-001',
    userId: 'user-001',
    lessonId: 'lesson-001',
    courseId: 'course-001',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  }) as Bookmark;

describe('BookmarksService', () => {
  let service: BookmarksService;
  let bookmarkRepository: jest.Mocked<BookmarkRepository>;

  beforeEach(async () => {
    bookmarkRepository = {
      findOne: jest.fn(),
      findByUser: jest.fn(),
      findByUserAndCourse: jest.fn(),
      create: jest.fn(),
      softDelete: jest.fn(),
      exists: jest.fn(),
    } as unknown as jest.Mocked<BookmarkRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookmarksService,
        {
          provide: BookmarkRepository,
          useValue: bookmarkRepository,
        },
      ],
    }).compile();

    service = module.get<BookmarksService>(BookmarksService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('toggle', () => {
    it('should create bookmark when not exists', async () => {
      const newBookmark = createMockBookmark();
      bookmarkRepository.findOne.mockResolvedValue(null);
      bookmarkRepository.create.mockResolvedValue(newBookmark);

      const result = await service.toggle('user-001', 'lesson-001', 'course-001');

      expect(result.added).toBe(true);
      expect(result.bookmark).toEqual(newBookmark);
      expect(bookmarkRepository.create).toHaveBeenCalledWith({
        userId: 'user-001',
        lessonId: 'lesson-001',
        courseId: 'course-001',
      });
    });

    it('should soft-delete bookmark when exists', async () => {
      const existing = createMockBookmark();
      bookmarkRepository.findOne.mockResolvedValue(existing);
      bookmarkRepository.softDelete.mockResolvedValue(undefined);

      const result = await service.toggle('user-001', 'lesson-001', 'course-001');

      expect(result.added).toBe(false);
      expect(result.bookmark).toBeNull();
      expect(bookmarkRepository.softDelete).toHaveBeenCalledWith('bookmark-001');
    });
  });

  describe('listByUser', () => {
    it('should return user bookmarks', async () => {
      const bookmarks = [createMockBookmark(), createMockBookmark({ id: 'bookmark-002' })];
      bookmarkRepository.findByUser.mockResolvedValue(bookmarks);

      const result = await service.listByUser('user-001');

      expect(result).toEqual(bookmarks);
      expect(bookmarkRepository.findByUser).toHaveBeenCalledWith('user-001');
    });
  });

  describe('listByUserAndCourse', () => {
    it('should filter by courseId', async () => {
      const bookmarks = [createMockBookmark()];
      bookmarkRepository.findByUserAndCourse.mockResolvedValue(bookmarks);

      const result = await service.listByUserAndCourse('user-001', 'course-001');

      expect(result).toEqual(bookmarks);
      expect(bookmarkRepository.findByUserAndCourse).toHaveBeenCalledWith(
        'user-001',
        'course-001',
      );
    });
  });
});
