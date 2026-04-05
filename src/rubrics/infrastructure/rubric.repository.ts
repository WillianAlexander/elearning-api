import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * Custom repository for Rubric entity.
 */
@Injectable()
export class RubricRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByCourse(courseId: string): Promise<any[]> {
    return this.prisma.rubric.findMany({
      where: { courseId, deletedAt: null },
      include: {
        criteria: {
          where: { deletedAt: null },
          include: {
            levels: {
              where: { deletedAt: null },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<any | null> {
    return this.prisma.rubric.findFirst({
      where: { id, deletedAt: null },
      include: {
        criteria: {
          where: { deletedAt: null },
          include: {
            levels: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });
  }

  async create(data: {
    courseId: string;
    title: string;
    description?: string | null;
  }): Promise<any> {
    return this.prisma.rubric.create({ data });
  }

  async save(rubric: any): Promise<any> {
    return this.prisma.rubric.update({
      where: { id: rubric.id },
      data: rubric,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.rubric.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
