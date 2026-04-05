import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

import { RubricEvaluationRepository } from '../infrastructure/rubric-evaluation.repository';
import { RubricRepository } from '../infrastructure/rubric.repository';
import type { RubricEvaluation } from '../domain/entities/rubric-evaluation.entity';
import type { CreateRubricEvaluationDto } from './dto/create-rubric-evaluation.dto';

@Injectable()
export class RubricEvaluationsService {
  private readonly logger = new Logger(RubricEvaluationsService.name);

  constructor(
    private readonly evaluationRepository: RubricEvaluationRepository,
    private readonly rubricRepository: RubricRepository,
    private readonly prisma: PrismaService,
  ) {}

  async evaluate(
    rubricId: string,
    evaluatorId: string,
    dto: CreateRubricEvaluationDto,
  ): Promise<RubricEvaluation> {
    const rubric = await this.rubricRepository.findById(rubricId);
    if (!rubric) {
      throw new NotFoundException('Rúbrica no encontrada');
    }

    // Verify evaluator is the course instructor
    await this.verifyCourseOwnership(rubric.courseId, evaluatorId);

    // Validate scores match rubric criteria
    const criteria = rubric.criteria ?? [];
    if (dto.scores.length !== criteria.length) {
      throw new BadRequestException(
        `Se esperaban ${criteria.length} criterios, se recibieron ${dto.scores.length}`,
      );
    }

    // Calculate total and max scores
    let totalScore = 0;
    let maxScore = 0;
    for (const scoreEntry of dto.scores) {
      const criterion = criteria.find((c) => c.id === scoreEntry.criterionId);
      if (!criterion) {
        throw new BadRequestException(`Criterio no encontrado: ${scoreEntry.criterionId}`);
      }
      const level = criterion.levels?.find((l) => l.id === scoreEntry.levelId);
      if (!level) {
        throw new BadRequestException(`Nivel no encontrado: ${scoreEntry.levelId}`);
      }
      totalScore += level.score * criterion.weight;
      const maxLevel = criterion.levels?.reduce((max, l) => (l.score > max.score ? l : max));
      maxScore += (maxLevel?.score ?? 0) * criterion.weight;
    }

    // Check if evaluation already exists (update) or create new
    const existing = await this.evaluationRepository.findByRubricAndEnrollment(
      rubricId,
      dto.enrollmentId,
    );

    if (existing) {
      existing.scores = dto.scores;
      existing.totalScore = totalScore;
      existing.maxScore = maxScore;
      existing.feedback = dto.feedback ?? null;
      const updated = await this.evaluationRepository.save(existing);
      this.logger.log(
        `Rubric evaluation updated: rubric=${rubricId}, enrollment=${dto.enrollmentId}`,
      );
      return updated;
    }

    const evaluation = await this.evaluationRepository.create({
      rubricId,
      evaluatorId,
      enrollmentId: dto.enrollmentId,
      scores: dto.scores,
      totalScore,
      maxScore,
      feedback: dto.feedback ?? null,
    });

    this.logger.log(
      `Rubric evaluation created: rubric=${rubricId}, enrollment=${dto.enrollmentId}`,
    );
    return evaluation;
  }

  async findByEnrollment(enrollmentId: string): Promise<RubricEvaluation[]> {
    return this.evaluationRepository.findByEnrollment(enrollmentId);
  }

  async findByRubricAndEnrollment(
    rubricId: string,
    enrollmentId: string,
  ): Promise<RubricEvaluation | null> {
    return this.evaluationRepository.findByRubricAndEnrollment(rubricId, enrollmentId);
  }

  private async verifyCourseOwnership(courseId: string, userId: string): Promise<void> {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, deletedAt: null },
    });
    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }
    if (course.createdById !== userId) {
      throw new ForbiddenException('Solo el instructor del curso puede evaluar con rúbricas');
    }
  }
}
