import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class BookmarkRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUser(userId: string): Promise<any[]> {
    return this.prisma.bookmark.findMany({
      where: { userId, deletedAt: null },
      include: { lesson: true, course: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUserAndCourse(userId: string, courseId: string): Promise<any[]> {
    return this.prisma.bookmark.findMany({
      where: { userId, courseId, deletedAt: null },
      include: { lesson: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, lessonId: string): Promise<any | null> {
    return this.prisma.bookmark.findFirst({
      where: { userId, lessonId, deletedAt: null },
    });
  }

  async create(data: { userId: string; lessonId: string; courseId: string }): Promise<any> {
    return this.prisma.bookmark.create({ data });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.bookmark.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async exists(userId: string, lessonId: string): Promise<boolean> {
    const count = await this.prisma.bookmark.count({
      where: { userId, lessonId, deletedAt: null },
    });
    return count > 0;
  }
}
