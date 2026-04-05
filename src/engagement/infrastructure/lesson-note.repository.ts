import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class LessonNoteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserAndLesson(userId: string, lessonId: string): Promise<any | null> {
    return this.prisma.lessonNote.findFirst({
      where: { userId, lessonId, deletedAt: null },
    });
  }

  async findByUser(userId: string): Promise<any[]> {
    return this.prisma.lessonNote.findMany({
      where: { userId, deletedAt: null },
      include: { lesson: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async upsert(userId: string, lessonId: string, content: string): Promise<any> {
    const existing = await this.findByUserAndLesson(userId, lessonId);

    if (existing) {
      return this.prisma.lessonNote.update({
        where: { id: existing.id },
        data: { content },
      });
    }

    return this.prisma.lessonNote.create({
      data: { userId, lessonId, content },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.lessonNote.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
