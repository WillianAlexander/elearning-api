import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class QuizAttemptRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any): Promise<any> {
    return this.prisma.quizAttempt.create({ data });
  }

  async findByEnrollmentAndBlock(enrollmentId: string, contentBlockId: string): Promise<any[]> {
    return this.prisma.quizAttempt.findMany({
      where: { enrollmentId, contentBlockId, deletedAt: null },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async findById(id: string): Promise<any | null> {
    return this.prisma.quizAttempt.findFirst({ where: { id, deletedAt: null } });
  }

  async countByEnrollmentAndBlock(enrollmentId: string, contentBlockId: string): Promise<number> {
    return this.prisma.quizAttempt.count({
      where: { enrollmentId, contentBlockId, deletedAt: null },
    });
  }

  async bestScoreByEnrollmentAndBlock(
    enrollmentId: string,
    contentBlockId: string,
  ): Promise<number> {
    const result = await this.prisma.quizAttempt.aggregate({
      where: { enrollmentId, contentBlockId, deletedAt: null },
      _max: { score: true },
    });
    return result._max.score ?? 0;
  }

  async hasPassedQuiz(enrollmentId: string, contentBlockId: string): Promise<boolean> {
    const count = await this.prisma.quizAttempt.count({
      where: { enrollmentId, contentBlockId, passed: true, deletedAt: null },
    });
    return count > 0;
  }

  async findAllPassedByEnrollmentAndLesson(
    enrollmentId: string,
    contentBlockIds: string[],
  ): Promise<string[]> {
    if (contentBlockIds.length === 0) return [];

    const results = await this.prisma.quizAttempt.findMany({
      where: {
        enrollmentId,
        contentBlockId: { in: contentBlockIds },
        passed: true,
        deletedAt: null,
      },
      select: { contentBlockId: true },
      distinct: true,
    });

    return results.map((r) => r.contentBlockId);
  }
}
