import { Injectable, Logger } from '@nestjs/common';

import { DailyActivitySummaryRepository } from '../infrastructure/daily-activity-summary.repository';
import type { DailyActivitySummary } from '../domain/entities/daily-activity-summary.entity';

@Injectable()
export class DailyActivityService {
  private readonly logger = new Logger(DailyActivityService.name);

  constructor(
    private readonly activityRepository: DailyActivitySummaryRepository,
  ) {}

  /**
   * Get heatmap data for a user over a date range.
   * Returns array of { date, count } for frontend rendering.
   */
  async getHeatmap(
    userId: string,
    months: number = 6,
  ): Promise<Array<{ date: string; count: number }>> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const startStr = startDate.toISOString().split('T')[0]!;
    const endStr = endDate.toISOString().split('T')[0]!;

    const summaries = await this.activityRepository.findByUserInRange(
      userId,
      startStr,
      endStr,
    );

    return summaries.map((s) => ({
      date: s.activityDate,
      count: s.totalActions,
    }));
  }

  /**
   * Increment a specific activity counter for today.
   * Called by other services when actions happen.
   */
  async trackAction(
    userId: string,
    field: 'lessonsCompleted' | 'quizzesSubmitted' | 'notesCreated',
  ): Promise<DailyActivitySummary> {
    const today = new Date().toISOString().split('T')[0]!;

    this.logger.debug(
      `Tracking activity: user=${userId}, field=${field}, date=${today}`,
    );

    return this.activityRepository.upsertActivity(userId, today, field);
  }
}
