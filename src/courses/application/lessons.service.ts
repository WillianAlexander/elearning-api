import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { LESSON_TYPE } from '@lms/shared';

import { LessonRepository } from '../infrastructure/lesson.repository';
import { ModuleRepository } from '../infrastructure/module.repository';
import { CoursesService } from './courses.service';
import type { CreateLessonDto } from './dto/create-lesson.dto';
import type { UpdateLessonDto } from './dto/update-lesson.dto';
import type { ReorderDto } from './dto/reorder.dto';
import type { AuthenticatedUser } from '../../auth/domain/types';
import type { Lesson } from '../domain/entities/lesson.entity';

/**
 * Service for lesson management within a module.
 * Handles CRUD and reordering operations.
 */
@Injectable()
export class LessonsService {
  private readonly logger = new Logger(LessonsService.name);

  constructor(
    private readonly lessonRepository: LessonRepository,
    private readonly moduleRepository: ModuleRepository,
    private readonly coursesService: CoursesService,
  ) {}

  /**
   * Resolve the parent course ID from a module and assert ownership.
   */
  private async assertOwnershipViaModule(moduleId: string, user: AuthenticatedUser): Promise<void> {
    const module = await this.moduleRepository.findById(moduleId);
    if (!module) {
      throw new NotFoundException(`Module with id ${moduleId} not found`);
    }
    await this.coursesService.assertCourseOwnership(module.courseId, user);
  }

  async create(moduleId: string, dto: CreateLessonDto, user: AuthenticatedUser): Promise<Lesson> {
    const module = await this.moduleRepository.findById(moduleId);
    if (!module) {
      throw new NotFoundException(`Module with id ${moduleId} not found`);
    }
    await this.coursesService.assertCourseOwnership(module.courseId, user);

    const orderIndex =
      dto.orderIndex ??
      (await this.lessonRepository.getMaxOrderIndex(moduleId)) + 1;

    const lesson = await this.lessonRepository.create({
      moduleId,
      title: dto.title,
      description: dto.description ?? null,
      type: dto.type ?? LESSON_TYPE.TEXT,
      orderIndex,
      estimatedDuration: dto.estimatedDuration ?? null,
    });

    this.logger.log(
      `Created lesson "${lesson.title}" in module ${moduleId} at index ${orderIndex}`,
    );
    return lesson;
  }

  async findById(id: string): Promise<Lesson> {
    const lesson = await this.lessonRepository.findById(id);
    if (!lesson) {
      throw new NotFoundException(`Lesson with id ${id} not found`);
    }
    return lesson;
  }

  async findByModuleId(moduleId: string): Promise<Lesson[]> {
    const module = await this.moduleRepository.findById(moduleId);
    if (!module) {
      throw new NotFoundException(`Module with id ${moduleId} not found`);
    }
    return this.lessonRepository.findByModuleId(moduleId);
  }

  async update(id: string, dto: UpdateLessonDto, user: AuthenticatedUser): Promise<Lesson> {
    const lesson = await this.findById(id);
    await this.assertOwnershipViaModule(lesson.moduleId, user);

    const updated = await this.lessonRepository.update(id, {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.type !== undefined && { type: dto.type }),
      ...(dto.estimatedDuration !== undefined && {
        estimatedDuration: dto.estimatedDuration,
      }),
    });

    if (!updated) {
      throw new NotFoundException(
        `Lesson with id ${id} not found after update`,
      );
    }

    this.logger.log(`Updated lesson: ${updated.title}`);
    return updated;
  }

  async reorder(
    moduleId: string,
    dto: ReorderDto,
    user: AuthenticatedUser,
  ): Promise<Lesson[]> {
    const module = await this.moduleRepository.findById(moduleId);
    if (!module) {
      throw new NotFoundException(`Module with id ${moduleId} not found`);
    }
    await this.coursesService.assertCourseOwnership(module.courseId, user);

    const lessons = await this.lessonRepository.findByIds(dto.orderedIds);
    const lessonMap = new Map(lessons.map((l) => [l.id, l]));

    const reordered: Lesson[] = dto.orderedIds
      .map((id, index) => {
        const lesson = lessonMap.get(id);
        if (lesson) {
          lesson.orderIndex = index;
        }
        return lesson;
      })
      .filter((l): l is Lesson => l !== undefined);

    await this.lessonRepository.saveMany(reordered);
    this.logger.log(
      `Reordered ${reordered.length} lessons in module ${moduleId}`,
    );
    return reordered;
  }

  async softDelete(id: string, user: AuthenticatedUser): Promise<void> {
    const lesson = await this.findById(id);
    await this.assertOwnershipViaModule(lesson.moduleId, user);
    await this.lessonRepository.softDelete(id);
    this.logger.log(`Soft-deleted lesson: ${id}`);
  }
}
