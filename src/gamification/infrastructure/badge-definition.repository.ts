import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class BadgeDefinitionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<any[]> {
    return this.prisma.badgeDefinition.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<any | null> {
    return this.prisma.badgeDefinition.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findAllActive(): Promise<any[]> {
    return this.prisma.badgeDefinition.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  }
}
