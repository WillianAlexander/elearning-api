import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class CourseReviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByCourse(courseId: string): Promise<any[]> {
    return this.prisma.courseReview.findMany({
      where: { courseId, deletedAt: null },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUserAndCourse(userId: string, courseId: string): Promise<any | null> {
    return this.prisma.courseReview.findFirst({
      where: { userId, courseId, deletedAt: null },
    });
  }

  async findById(id: string): Promise<any | null> {
    return this.prisma.courseReview.findFirst({
      where: { id, deletedAt: null },
      include: { user: true },
    });
  }

  async create(data: {
    userId: string;
    courseId: string;
    rating: number;
    comment?: string | null;
  }): Promise<any> {
    return this.prisma.courseReview.create({ data });
  }

  async save(review: any): Promise<any> {
    return this.prisma.courseReview.update({
      where: { id: review.id },
      data: review,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.courseReview.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getAverageRating(courseId: string): Promise<{ avg: number; count: number }> {
    const result = await this.prisma.courseReview.aggregate({
      where: { courseId, deletedAt: null },
      _avg: { rating: true },
      _count: { id: true },
    });
    return {
      avg: result._avg.rating ?? 0,
      count: result._count.id ?? 0,
    };
  }
}
