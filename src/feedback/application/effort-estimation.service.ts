import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

const WORDS_PER_MINUTE = 200;
const DEFAULT_VIDEO_MINUTES = 5;
const MINUTES_PER_QUIZ_QUESTION = 1.5;

/**
 * EffortEstimationService — auto-calculates lesson duration from content blocks.
 * Rules:
 *   - Text blocks: word count / 200 (avg reading speed) = minutes
 *   - Video blocks: parse duration if available, else default 5 min
 *   - Quiz blocks: questions count * 1.5 min
 *   - Other blocks: 1 min default
 */
@Injectable()
export class EffortEstimationService {
  private readonly logger = new Logger(EffortEstimationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Recalculate estimated duration for a lesson based on its content blocks.
   * Returns the estimated minutes.
   */
  async recalculateForLesson(lessonId: string): Promise<number> {
    const blocks = await this.prisma.contentBlock.findMany({
      where: { lessonId, deletedAt: null },
    });

    let totalMinutes = 0;

    for (const block of blocks) {
      totalMinutes += this.estimateBlockMinutes(block);
    }

    // Minimum 1 minute
    const estimated = Math.max(1, Math.round(totalMinutes));

    await this.prisma.lesson.update({
      where: { id: lessonId },
      data: { estimatedDuration: estimated },
    });

    this.logger.debug(
      `Effort estimation updated: lesson=${lessonId}, duration=${estimated}min (${blocks.length} blocks)`,
    );

    return estimated;
  }

  private estimateBlockMinutes(block: any): number {
    const content = block.content as Record<string, unknown>;

    switch (block.type) {
      case 'text': {
        const text = (content['text'] as string) ?? (content['body'] as string) ?? '';
        const wordCount = text.split(/\s+/).filter(Boolean).length;
        return wordCount / WORDS_PER_MINUTE;
      }

      case 'video': {
        const duration = content['duration'] as number | undefined;
        if (duration && duration > 0) {
          // Duration stored in seconds
          return duration / 60;
        }
        return DEFAULT_VIDEO_MINUTES;
      }

      case 'quiz': {
        const questions = content['questions'] as unknown[] | undefined;
        const questionCount = questions?.length ?? 0;
        return questionCount * MINUTES_PER_QUIZ_QUESTION;
      }

      default:
        return 1;
    }
  }
}
