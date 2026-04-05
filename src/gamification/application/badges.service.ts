import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

import { ENROLLMENT_STATUS } from '@lms/shared';

import { BadgeDefinitionRepository } from '../infrastructure/badge-definition.repository';
import { UserBadgeRepository } from '../infrastructure/user-badge.repository';
import type { BadgeDefinition, BadgeCriteria } from '../domain/entities/badge-definition.entity';
import type { UserBadge } from '../domain/entities/user-badge.entity';

@Injectable()
export class BadgesService {
  private readonly logger = new Logger(BadgesService.name);

  constructor(
    private readonly badgeDefinitionRepository: BadgeDefinitionRepository,
    private readonly userBadgeRepository: UserBadgeRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get all active badge definitions.
   */
  async getAllDefinitions(): Promise<BadgeDefinition[]> {
    return this.badgeDefinitionRepository.findAllActive();
  }

  /**
   * Get all badges earned by a user.
   */
  async getUserBadges(userId: string): Promise<UserBadge[]> {
    return this.userBadgeRepository.findByUser(userId);
  }

  /**
   * Evaluate all badge criteria for a user and award any earned badges.
   * Returns newly awarded badges.
   */
  async evaluateBadges(userId: string): Promise<UserBadge[]> {
    const definitions = await this.badgeDefinitionRepository.findAllActive();
    const newlyAwarded: UserBadge[] = [];

    for (const definition of definitions) {
      // Check if already earned
      const existing = await this.userBadgeRepository.findByUserAndBadge(userId, definition.id);
      if (existing) continue;

      const earned = await this.checkCriteria(userId, definition.criteria);
      if (earned) {
        const badge = await this.userBadgeRepository.create({
          userId,
          badgeDefinitionId: definition.id,
        });
        newlyAwarded.push(badge);
        this.logger.log(`Badge awarded: user=${userId}, badge="${definition.name}"`);
      }
    }

    return newlyAwarded;
  }

  private async checkCriteria(userId: string, criteria: BadgeCriteria): Promise<boolean> {
    switch (criteria.type) {
      case 'course_completed':
        return this.hasCompletedAnyCourse(userId);
      case 'courses_completed':
        return this.hasCompletedNCourses(userId, criteria.count);
      case 'quiz_score':
        return this.hasQuizScore(userId, criteria.minScore);
      case 'streak_days':
        return this.hasStreak(userId, criteria.days);
      default:
        return false;
    }
  }

  private async hasCompletedAnyCourse(userId: string): Promise<boolean> {
    const count = await this.prisma.enrollment.count({
      where: { userId, status: ENROLLMENT_STATUS.COMPLETED, deletedAt: null },
    });
    return count > 0;
  }

  private async hasCompletedNCourses(userId: string, requiredCount: number): Promise<boolean> {
    const count = await this.prisma.enrollment.count({
      where: { userId, status: ENROLLMENT_STATUS.COMPLETED, deletedAt: null },
    });
    return count >= requiredCount;
  }

  private async hasQuizScore(userId: string, minScore: number): Promise<boolean> {
    // Check quiz_attempts for this user with score >= minScore
    const result = await this.prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM quiz_attempts
      WHERE user_id = ${userId} AND score >= ${minScore} AND deleted_at IS NULL
    `;
    const count = Number(result?.[0]?.count ?? 0);
    return count > 0;
  }

  private async hasStreak(userId: string, days: number): Promise<boolean> {
    // Get the last N days of activity and check for consecutive streak
    const activities = await this.prisma.dailyActivitySummary.findMany({
      where: { userId, deletedAt: null },
      orderBy: { activityDate: 'desc' },
      take: days + 5, // fetch a few extra for safety
    });

    if (activities.length < days) return false;

    // Check for N consecutive days
    let streak = 1;
    for (let i = 1; i < activities.length; i++) {
      const prev = new Date(activities[i - 1]!.activityDate);
      const curr = new Date(activities[i]!.activityDate);
      const diffMs = prev.getTime() - curr.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        streak++;
        if (streak >= days) return true;
      } else {
        streak = 1;
      }
    }

    return streak >= days;
  }
}
