import { Injectable, Logger } from '@nestjs/common';

import { VideoWatchLogRepository } from '../infrastructure/video-watch-log.repository';
import type { VideoWatchLog } from '../domain/entities/video-watch-log.entity';
import type { VideoHeartbeatDto } from './dto/video-heartbeat.dto';

@Injectable()
export class VideoWatchService {
  private readonly logger = new Logger(VideoWatchService.name);

  constructor(
    private readonly watchLogRepository: VideoWatchLogRepository,
  ) {}

  /**
   * Process a video heartbeat — upserts the watch log for this user+block.
   */
  async processHeartbeat(
    userId: string,
    dto: VideoHeartbeatDto,
  ): Promise<VideoWatchLog> {
    const log = await this.watchLogRepository.upsert({
      userId,
      lessonId: dto.lessonId,
      contentBlockId: dto.contentBlockId,
      watchedSeconds: dto.watchedSeconds,
      totalDurationSeconds: dto.totalDuration,
      lastPosition: dto.position,
    });

    this.logger.debug(
      `Video heartbeat: user=${userId}, lesson=${dto.lessonId}, watched=${dto.watchedSeconds}s`,
    );

    return log;
  }

  /**
   * Get watch logs for a user on a specific lesson.
   */
  async getByLesson(userId: string, lessonId: string): Promise<VideoWatchLog[]> {
    return this.watchLogRepository.findByUserAndLesson(userId, lessonId);
  }
}
