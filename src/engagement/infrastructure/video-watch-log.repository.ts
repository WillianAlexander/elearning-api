import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class VideoWatchLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserAndBlock(
    userId: string,
    lessonId: string,
    contentBlockId: string,
  ): Promise<any | null> {
    return this.prisma.videoWatchLog.findFirst({
      where: { userId, lessonId, contentBlockId, deletedAt: null },
    });
  }

  async findByUserAndLesson(userId: string, lessonId: string): Promise<any[]> {
    return this.prisma.videoWatchLog.findMany({
      where: { userId, lessonId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async upsert(data: {
    userId: string;
    lessonId: string;
    contentBlockId: string;
    watchedSeconds: number;
    totalDurationSeconds: number;
    lastPosition: number;
  }): Promise<any> {
    let log = await this.findByUserAndBlock(data.userId, data.lessonId, data.contentBlockId);

    if (!log) {
      return this.prisma.videoWatchLog.create({ data });
    } else {
      return this.prisma.videoWatchLog.update({
        where: { id: log.id },
        data: {
          watchedSeconds: data.watchedSeconds,
          totalDurationSeconds: data.totalDurationSeconds,
          lastPosition: data.lastPosition,
        },
      });
    }
  }
}
