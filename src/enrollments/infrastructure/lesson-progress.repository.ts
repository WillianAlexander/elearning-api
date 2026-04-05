import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class LessonProgressRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEnrollment(enrollmentId: string): Promise<any[]> {
    return this.prisma.lessonProgress.findMany({
      where: { enrollmentId, deletedAt: null },
      include: { lesson: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findByEnrollmentAndLesson(enrollmentId: string, lessonId: string): Promise<any | null> {
    return this.prisma.lessonProgress.findFirst({
      where: { enrollmentId, lessonId, deletedAt: null },
    });
  }

  async countCompletedByEnrollment(enrollmentId: string): Promise<number> {
    return this.prisma.lessonProgress.count({
      where: { enrollmentId, completed: true, deletedAt: null },
    });
  }

  async create(data: any): Promise<any> {
    return this.prisma.lessonProgress.create({ data });
  }

  async save(progress: any): Promise<any> {
    return this.prisma.lessonProgress.update({
      where: { id: progress.id },
      data: progress,
    });
  }
}
