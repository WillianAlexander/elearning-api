import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class UserBadgeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUser(userId: string): Promise<any[]> {
    return this.prisma.userBadge.findMany({
      where: { userId, deletedAt: null },
      include: { badgeDefinition: true },
      orderBy: { earnedAt: 'desc' },
    });
  }

  async findByUserAndBadge(userId: string, badgeDefinitionId: string): Promise<any | null> {
    return this.prisma.userBadge.findFirst({
      where: { userId, badgeDefinitionId, deletedAt: null },
    });
  }

  async create(data: { userId: string; badgeDefinitionId: string }): Promise<any> {
    return this.prisma.userBadge.create({
      data: { ...data, earnedAt: new Date() },
    });
  }

  async countByUser(userId: string): Promise<number> {
    return this.prisma.userBadge.count({
      where: { userId, deletedAt: null },
    });
  }
}
