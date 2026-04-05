import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { LessonNoteRepository } from '../infrastructure/lesson-note.repository';
import type { LessonNote } from '../domain/entities/lesson-note.entity';

@Injectable()
export class LessonNotesService {
  private readonly logger = new Logger(LessonNotesService.name);

  constructor(private readonly noteRepository: LessonNoteRepository) {}

  async getNote(userId: string, lessonId: string): Promise<LessonNote | null> {
    return this.noteRepository.findByUserAndLesson(userId, lessonId);
  }

  async saveNote(userId: string, lessonId: string, content: string): Promise<LessonNote> {
    const note = await this.noteRepository.upsert(userId, lessonId, content);
    this.logger.log(`Note saved: user=${userId}, lesson=${lessonId}`);
    return note;
  }

  async deleteNote(userId: string, lessonId: string): Promise<void> {
    const note = await this.noteRepository.findByUserAndLesson(userId, lessonId);
    if (!note) {
      throw new NotFoundException('Note not found');
    }

    await this.noteRepository.softDelete(note.id);
    this.logger.log(`Note deleted: user=${userId}, lesson=${lessonId}`);
  }

  async listByUser(userId: string): Promise<LessonNote[]> {
    return this.noteRepository.findByUser(userId);
  }
}
