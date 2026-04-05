import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

import { RubricRepository } from '../infrastructure/rubric.repository';
import { RubricCriterionRepository } from '../infrastructure/rubric-criterion.repository';
import { RubricLevelRepository } from '../infrastructure/rubric-level.repository';
import type { Rubric } from '../domain/entities/rubric.entity';
import type { CreateRubricDto } from './dto/create-rubric.dto';
import type { UpdateRubricDto } from './dto/update-rubric.dto';

@Injectable()
export class RubricsService {
  private readonly logger = new Logger(RubricsService.name);

  constructor(
    private readonly rubricRepository: RubricRepository,
    private readonly criterionRepository: RubricCriterionRepository,
    private readonly levelRepository: RubricLevelRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(courseId: string, userId: string, dto: CreateRubricDto): Promise<Rubric> {
    await this.verifyCourseOwnership(courseId, userId);

    const rubric = await this.rubricRepository.create({
      courseId,
      title: dto.title,
      description: dto.description ?? null,
    });

    // Create criteria and levels if provided
    if (dto.criteria?.length) {
      for (const criterionDto of dto.criteria) {
        const criterion = await this.criterionRepository.save({
          rubricId: rubric.id,
          name: criterionDto.name,
          description: criterionDto.description ?? null,
          weight: criterionDto.weight,
          orderIndex: criterionDto.orderIndex,
        });

        if (criterionDto.levels?.length) {
          for (const levelDto of criterionDto.levels) {
            await this.levelRepository.save({
              criterionId: criterion.id,
              label: levelDto.label,
              description: levelDto.description ?? null,
              score: levelDto.score,
              orderIndex: levelDto.orderIndex,
            });
          }
        }
      }
    }

    this.logger.log(`Rubric created: course=${courseId}, title="${dto.title}"`);

    // Re-fetch with all relations
    const result = await this.rubricRepository.findById(rubric.id);
    return result!;
  }

  async findByCourse(courseId: string): Promise<Rubric[]> {
    return this.rubricRepository.findByCourse(courseId);
  }

  async findById(id: string): Promise<Rubric> {
    const rubric = await this.rubricRepository.findById(id);
    if (!rubric) {
      throw new NotFoundException('Rúbrica no encontrada');
    }
    return rubric;
  }

  async update(rubricId: string, userId: string, dto: UpdateRubricDto): Promise<Rubric> {
    const rubric = await this.findById(rubricId);
    await this.verifyCourseOwnership(rubric.courseId, userId);

    if (dto.title !== undefined) rubric.title = dto.title;
    if (dto.description !== undefined) rubric.description = dto.description;

    return this.rubricRepository.save(rubric);
  }

  async remove(rubricId: string, userId: string): Promise<void> {
    const rubric = await this.findById(rubricId);
    await this.verifyCourseOwnership(rubric.courseId, userId);

    await this.rubricRepository.softDelete(rubricId);
    this.logger.log(`Rubric deleted: id=${rubricId}`);
  }

  private async verifyCourseOwnership(courseId: string, userId: string): Promise<void> {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, deletedAt: null },
    });
    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }
    if (course.createdById !== userId) {
      throw new ForbiddenException('Solo el instructor del curso puede gestionar rúbricas');
    }
  }
}
