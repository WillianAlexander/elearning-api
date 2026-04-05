import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * Custom repository for Lesson entity.
 */
@Injectable()
export class LessonRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<any | null> {
    return this.prisma.lesson.findFirst({
      where: { id, deletedAt: null },
      include: { blocks: true },
    });
  }

  async findByModuleId(moduleId: string): Promise<any[]> {
    return this.prisma.lesson.findMany({
      where: { moduleId, deletedAt: null },
      include: { blocks: { where: { deletedAt: null } } },
      orderBy: { orderIndex: 'asc' },
    });
  }

  async getMaxOrderIndex(moduleId: string): Promise<number> {
    const result = await this.prisma.lesson.aggregate({
      where: { moduleId, deletedAt: null },
      _max: { orderIndex: true },
    });
    return result._max.orderIndex ?? -1;
  }

  async create(data: any): Promise<any> {
    return this.prisma.lesson.create({ data });
  }

  async update(id: string, data: any): Promise<any | null> {
    return this.prisma.lesson.update({
      where: { id },
      data,
    });
  }

  async save(lesson: any): Promise<any> {
    return this.prisma.lesson.update({
      where: { id: lesson.id },
      data: lesson,
    });
  }

  async saveMany(lessons: any[]): Promise<any[]> {
    return this.prisma.lesson.createManyAndReturn({ data: lessons });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.lesson.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findByIds(ids: string[]): Promise<any[]> {
    if (ids.length === 0) return [];
    return this.prisma.lesson.findMany({
      where: { id: { in: ids }, deletedAt: null },
    });
  }
}
