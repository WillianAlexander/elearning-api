import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * Custom repository for CourseModule entity.
 */
@Injectable()
export class ModuleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<any | null> {
    return this.prisma.courseModule.findFirst({
      where: { id, deletedAt: null },
      include: { lessons: true },
    });
  }

  async findByCourseId(courseId: string): Promise<any[]> {
    return this.prisma.courseModule.findMany({
      where: { courseId, deletedAt: null },
      include: { lessons: { where: { deletedAt: null } } },
      orderBy: { orderIndex: 'asc' },
    });
  }

  async getMaxOrderIndex(courseId: string): Promise<number> {
    const result = await this.prisma.courseModule.aggregate({
      where: { courseId, deletedAt: null },
      _max: { orderIndex: true },
    });
    return result._max.orderIndex ?? -1;
  }

  async create(data: any): Promise<any> {
    return this.prisma.courseModule.create({ data });
  }

  async update(id: string, data: any): Promise<any | null> {
    return this.prisma.courseModule.update({
      where: { id },
      data,
    });
  }

  async save(module: any): Promise<any> {
    return this.prisma.courseModule.update({
      where: { id: module.id },
      data: module,
    });
  }

  async saveMany(modules: any[]): Promise<any[]> {
    return this.prisma.courseModule.createManyAndReturn({ data: modules });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.courseModule.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findByIds(ids: string[]): Promise<any[]> {
    if (ids.length === 0) return [];
    return this.prisma.courseModule.findMany({
      where: { id: { in: ids }, deletedAt: null },
    });
  }
}
