import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * Custom repository for Tag entity.
 */
@Injectable()
export class TagRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<any | null> {
    return this.prisma.tag.findFirst({ where: { id, deletedAt: null } });
  }

  async findByIds(ids: string[]): Promise<any[]> {
    if (ids.length === 0) return [];
    return this.prisma.tag.findMany({
      where: { id: { in: ids }, deletedAt: null },
    });
  }

  async findByName(name: string): Promise<any | null> {
    return this.prisma.tag.findFirst({ where: { name, deletedAt: null } });
  }

  async findAll(): Promise<any[]> {
    return this.prisma.tag.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async findOrCreate(name: string): Promise<any> {
    const existing = await this.findByName(name);
    if (existing) return existing;
    return this.prisma.tag.create({ data: { name } });
  }

  async create(data: any): Promise<any> {
    return this.prisma.tag.create({ data });
  }
}
