import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * Custom repository for RubricEvaluation entity.
 */
@Injectable()
export class RubricEvaluationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEnrollment(enrollmentId: string): Promise<any[]> {
    return this.prisma.rubricEvaluation.findMany({
      where: { enrollmentId, deletedAt: null },
      include: {
        rubric: {
          where: { deletedAt: null },
        },
        evaluator: {
          where: { deletedAt: null },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByRubricAndEnrollment(rubricId: string, enrollmentId: string): Promise<any | null> {
    return this.prisma.rubricEvaluation.findFirst({
      where: { rubricId, enrollmentId, deletedAt: null },
      include: {
        rubric: {
          where: { deletedAt: null },
        },
        evaluator: {
          where: { deletedAt: null },
        },
      },
    });
  }

  async create(data: Partial<any>): Promise<any> {
    return this.prisma.rubricEvaluation.create({ data: data as any });
  }

  async save(evaluation: any): Promise<any> {
    return this.prisma.rubricEvaluation.update({
      where: { id: evaluation.id },
      data: evaluation,
    });
  }
}
