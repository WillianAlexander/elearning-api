import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * Custom repository for RubricCriterion entity.
 */
@Injectable()
export class RubricCriterionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByRubric(rubricId: string): Promise<any[]> {
    return this.prisma.rubricCriterion.findMany({
      where: { rubricId, deletedAt: null },
      include: {
        levels: {
          where: { deletedAt: null },
        },
      },
      orderBy: { orderIndex: 'asc' },
    });
  }

  async save(criterion: Partial<any>): Promise<any> {
    if (criterion.id) {
      return this.prisma.rubricCriterion.update({
        where: { id: criterion.id },
        data: criterion,
      });
    }
    return this.prisma.rubricCriterion.create({ data: criterion as any });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.rubricCriterion.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
