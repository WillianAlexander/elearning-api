import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * Custom repository for Category entity.
 * Supports nested tree structure via parent/children relations.
 */
@Injectable()
export class CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<any | null> {
    return this.prisma.category.findFirst({
      where: { id, deletedAt: null },
      include: { children: true, parent: true },
    });
  }

  async findByName(name: string): Promise<any | null> {
    return this.prisma.category.findFirst({ where: { name, deletedAt: null } });
  }

  /**
   * Get all root categories (no parent) with their children tree.
   */
  async findTree(): Promise<any[]> {
    return this.prisma.category.findMany({
      where: { parentId: null, deletedAt: null },
      include: {
        children: {
          where: { deletedAt: null },
          include: {
            children: { where: { deletedAt: null } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findAll(): Promise<any[]> {
    return this.prisma.category.findMany({
      where: { deletedAt: null },
      include: { children: { where: { deletedAt: null } } },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: any): Promise<any> {
    return this.prisma.category.create({ data });
  }

  async update(id: string, data: any): Promise<any | null> {
    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
