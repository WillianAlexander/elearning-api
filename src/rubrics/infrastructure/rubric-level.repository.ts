import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * Custom repository for RubricLevel entity.
 */
@Injectable()
export class RubricLevelRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(level: Partial<any>): Promise<any> {
    if (level.id) {
      return this.prisma.rubricLevel.update({
        where: { id: level.id },
        data: level,
      });
    }
    return this.prisma.rubricLevel.create({ data: level as any });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.rubricLevel.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
