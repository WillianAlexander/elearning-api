import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class DailyActivitySummaryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserAndDate(userId: string, activityDate: Date): Promise<any | null> {
    return this.prisma.dailyActivitySummary.findFirst({
      where: { userId, activityDate, deletedAt: null },
    });
  }

  async findByUserInRange(userId: string, startDate: Date, endDate: Date): Promise<any[]> {
    return this.prisma.dailyActivitySummary.findMany({
      where: {
        userId,
        activityDate: { gte: startDate, lte: endDate },
        deletedAt: null,
      },
      orderBy: { activityDate: 'asc' },
    });
  }

  async upsertActivity(
    userId: string,
    activityDate: Date,
    field: 'lessonsCompleted' | 'quizzesSubmitted' | 'notesCreated',
    increment: number = 1,
  ): Promise<any> {
    let summary = await this.findByUserAndDate(userId, activityDate);

    if (!summary) {
      return this.prisma.dailyActivitySummary.create({
        data: {
          userId,
          activityDate,
          lessonsCompleted: field === 'lessonsCompleted' ? increment : 0,
          quizzesSubmitted: field === 'quizzesSubmitted' ? increment : 0,
          notesCreated: field === 'notesCreated' ? increment : 0,
          totalActions: increment,
        },
      });
    } else {
      return this.prisma.dailyActivitySummary.update({
        where: { id: summary.id },
        data: {
          [field]: { increment },
          totalActions: { increment },
        },
      });
    }
  }
}
