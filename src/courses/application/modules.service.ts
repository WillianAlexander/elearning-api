import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';

import { ModuleRepository } from '../infrastructure/module.repository';
import { CourseRepository } from '../infrastructure/course.repository';
import { CoursesService } from './courses.service';
import type { CreateModuleDto } from './dto/create-module.dto';
import type { UpdateModuleDto } from './dto/update-module.dto';
import type { ReorderDto } from './dto/reorder.dto';
import type { AuthenticatedUser } from '../../auth/domain/types';
import type { CourseModule } from '../domain/entities/course-module.entity';

/**
 * Service for module management within a course.
 * Handles CRUD and reordering operations.
 */
@Injectable()
export class ModulesService {
  private readonly logger = new Logger(ModulesService.name);

  constructor(
    private readonly moduleRepository: ModuleRepository,
    private readonly courseRepository: CourseRepository,
    private readonly coursesService: CoursesService,
  ) {}

  async create(courseId: string, dto: CreateModuleDto, user: AuthenticatedUser): Promise<CourseModule> {
    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new NotFoundException(`Course with id ${courseId} not found`);
    }
    await this.coursesService.assertCourseOwnership(courseId, user);

    const orderIndex =
      dto.orderIndex ??
      (await this.moduleRepository.getMaxOrderIndex(courseId)) + 1;

    const module = await this.moduleRepository.create({
      courseId,
      title: dto.title,
      description: dto.description ?? null,
      orderIndex,
    });

    this.logger.log(
      `Created module "${module.title}" in course ${courseId} at index ${orderIndex}`,
    );
    return module;
  }

  async findById(id: string): Promise<CourseModule> {
    const module = await this.moduleRepository.findById(id);
    if (!module) {
      throw new NotFoundException(`Module with id ${id} not found`);
    }
    return module;
  }

  async findByCourseId(courseId: string): Promise<CourseModule[]> {
    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new NotFoundException(`Course with id ${courseId} not found`);
    }
    return this.moduleRepository.findByCourseId(courseId);
  }

  async update(id: string, dto: UpdateModuleDto, user: AuthenticatedUser): Promise<CourseModule> {
    const module = await this.findById(id);
    await this.coursesService.assertCourseOwnership(module.courseId, user);

    const updated = await this.moduleRepository.update(id, {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.prerequisiteModuleId !== undefined && { prerequisiteModuleId: dto.prerequisiteModuleId }),
    });

    if (!updated) {
      throw new NotFoundException(
        `Module with id ${id} not found after update`,
      );
    }

    this.logger.log(`Updated module: ${updated.title}`);
    return updated;
  }

  async reorder(
    courseId: string,
    dto: ReorderDto,
    user: AuthenticatedUser,
  ): Promise<CourseModule[]> {
    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new NotFoundException(`Course with id ${courseId} not found`);
    }
    await this.coursesService.assertCourseOwnership(courseId, user);

    const modules = await this.moduleRepository.findByIds(dto.orderedIds);

    // Map modules by ID for O(1) lookup
    const moduleMap = new Map(modules.map((m) => [m.id, m]));

    // Assign new orderIndex based on array position
    const reordered: CourseModule[] = dto.orderedIds
      .map((id, index) => {
        const mod = moduleMap.get(id);
        if (mod) {
          mod.orderIndex = index;
        }
        return mod;
      })
      .filter((m): m is CourseModule => m !== undefined);

    const saved = await this.moduleRepository.saveMany(reordered);
    this.logger.log(
      `Reordered ${saved.length} modules in course ${courseId}`,
    );
    return reordered;
  }

  async softDelete(id: string, user: AuthenticatedUser): Promise<void> {
    const module = await this.findById(id);
    await this.coursesService.assertCourseOwnership(module.courseId, user);
    await this.moduleRepository.softDelete(id);
    this.logger.log(`Soft-deleted module: ${id}`);
  }
}
