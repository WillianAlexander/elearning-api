import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AnnouncementRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByCourse(courseId: string): Promise<any[]> {
    return this.prisma.announcement.findMany({
      where: { courseId, deletedAt: null },
      include: { author: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<any | null> {
    return this.prisma.announcement.findFirst({
      where: { id, deletedAt: null },
      include: { author: true },
    });
  }

  async create(data: {
    courseId: string;
    authorId: string;
    title: string;
    content: string;
    publishedAt?: Date | null;
  }): Promise<any> {
    return this.prisma.announcement.create({ data });
  }

  async save(announcement: any): Promise<any> {
    return this.prisma.announcement.update({
      where: { id: announcement.id },
      data: announcement,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.announcement.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
