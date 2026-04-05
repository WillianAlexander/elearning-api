import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import type { TestingModule } from '@nestjs/testing';

import { LessonNotesService } from './lesson-notes.service';
import { LessonNoteRepository } from '../infrastructure/lesson-note.repository';

import type { LessonNote } from '../domain/entities/lesson-note.entity';

const createMockNote = (overrides: Partial<LessonNote> = {}): LessonNote =>
  ({
    id: 'note-001',
    userId: 'user-001',
    lessonId: 'lesson-001',
    content: 'My note content',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  }) as LessonNote;

describe('LessonNotesService', () => {
  let service: LessonNotesService;
  let noteRepository: jest.Mocked<LessonNoteRepository>;

  beforeEach(async () => {
    noteRepository = {
      findByUserAndLesson: jest.fn(),
      findByUser: jest.fn(),
      upsert: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<LessonNoteRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LessonNotesService,
        {
          provide: LessonNoteRepository,
          useValue: noteRepository,
        },
      ],
    }).compile();

    service = module.get<LessonNotesService>(LessonNotesService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getNote', () => {
    it('should return note for user+lesson', async () => {
      const note = createMockNote();
      noteRepository.findByUserAndLesson.mockResolvedValue(note);

      const result = await service.getNote('user-001', 'lesson-001');

      expect(result).toEqual(note);
      expect(noteRepository.findByUserAndLesson).toHaveBeenCalledWith(
        'user-001',
        'lesson-001',
      );
    });

    it('should return null when no note exists', async () => {
      noteRepository.findByUserAndLesson.mockResolvedValue(null);

      const result = await service.getNote('user-001', 'lesson-999');

      expect(result).toBeNull();
    });
  });

  describe('saveNote', () => {
    it('should create new note (upsert - no existing)', async () => {
      const note = createMockNote();
      noteRepository.upsert.mockResolvedValue(note);

      const result = await service.saveNote('user-001', 'lesson-001', 'My note content');

      expect(result).toEqual(note);
      expect(noteRepository.upsert).toHaveBeenCalledWith(
        'user-001',
        'lesson-001',
        'My note content',
      );
    });

    it('should update existing note (upsert)', async () => {
      const updatedNote = createMockNote({ content: 'Updated content' });
      noteRepository.upsert.mockResolvedValue(updatedNote);

      const result = await service.saveNote('user-001', 'lesson-001', 'Updated content');

      expect(result.content).toBe('Updated content');
    });
  });

  describe('deleteNote', () => {
    it('should soft-delete note', async () => {
      const note = createMockNote();
      noteRepository.findByUserAndLesson.mockResolvedValue(note);
      noteRepository.softDelete.mockResolvedValue(undefined);

      await service.deleteNote('user-001', 'lesson-001');

      expect(noteRepository.softDelete).toHaveBeenCalledWith('note-001');
    });

    it('should throw NotFoundException when note does not exist', async () => {
      noteRepository.findByUserAndLesson.mockResolvedValue(null);

      await expect(service.deleteNote('user-001', 'lesson-999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
