import { Injectable, Logger } from '@nestjs/common';

import { BookmarkRepository } from '../infrastructure/bookmark.repository';
import type { Bookmark } from '../domain/entities/bookmark.entity';

@Injectable()
export class BookmarksService {
  private readonly logger = new Logger(BookmarksService.name);

  constructor(private readonly bookmarkRepository: BookmarkRepository) {}

  /**
   * Toggle a bookmark: creates if not exists, soft-deletes if exists.
   * Returns the bookmark and whether it was added or removed.
   */
  async toggle(
    userId: string,
    lessonId: string,
    courseId: string,
  ): Promise<{ bookmark: Bookmark | null; added: boolean }> {
    const existing = await this.bookmarkRepository.findOne(userId, lessonId);

    if (existing) {
      await this.bookmarkRepository.softDelete(existing.id);
      this.logger.log(`Bookmark removed: user=${userId}, lesson=${lessonId}`);
      return { bookmark: null, added: false };
    }

    const bookmark = await this.bookmarkRepository.create({ userId, lessonId, courseId });
    this.logger.log(`Bookmark added: user=${userId}, lesson=${lessonId}`);
    return { bookmark, added: true };
  }

  async listByUser(userId: string): Promise<Bookmark[]> {
    return this.bookmarkRepository.findByUser(userId);
  }

  async listByUserAndCourse(userId: string, courseId: string): Promise<Bookmark[]> {
    return this.bookmarkRepository.findByUserAndCourse(userId, courseId);
  }

  async isBookmarked(userId: string, lessonId: string): Promise<boolean> {
    return this.bookmarkRepository.exists(userId, lessonId);
  }
}
