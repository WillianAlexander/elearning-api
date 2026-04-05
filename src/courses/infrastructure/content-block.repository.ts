import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * Custom repository for ContentBlock entity.
 */
@Injectable()
export class ContentBlockRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<any | null> {
    return this.prisma.contentBlock.findFirst({ where: { id, deletedAt: null } });
  }

  async findByLessonId(lessonId: string): Promise<any[]> {
    return this.prisma.contentBlock.findMany({
      where: { lessonId, deletedAt: null },
      orderBy: { orderIndex: 'asc' },
    });
  }

  async getMaxOrderIndex(lessonId: string): Promise<number> {
    const result = await this.prisma.contentBlock.aggregate({
      where: { lessonId, deletedAt: null },
      _max: { orderIndex: true },
    });
    return result._max.orderIndex ?? -1;
  }

  async create(data: any): Promise<any> {
    return this.prisma.contentBlock.create({ data });
  }

  async update(id: string, data: any): Promise<any | null> {
    return this.prisma.contentBlock.update({
      where: { id },
      data,
    });
  }

  async save(block: any): Promise<any> {
    return this.prisma.contentBlock.update({
      where: { id: block.id },
      data: block,
    });
  }

  async saveMany(blocks: any[]): Promise<any[]> {
    return this.prisma.contentBlock.createManyAndReturn({ data: blocks });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.contentBlock.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findByIds(ids: string[]): Promise<any[]> {
    if (ids.length === 0) return [];
    return this.prisma.contentBlock.findMany({
      where: { id: { in: ids }, deletedAt: null },
    });
  }
}
