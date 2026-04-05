import { Injectable, NotFoundException, Logger } from '@nestjs/common';

import { ContentBlockRepository } from '../infrastructure/content-block.repository';
import { ContentVersionRepository } from '../infrastructure/content-version.repository';
import { LessonRepository } from '../infrastructure/lesson.repository';
import { ModuleRepository } from '../infrastructure/module.repository';
import { CoursesService } from './courses.service';
import type { CreateContentBlockDto } from './dto/create-content-block.dto';
import type { UpdateContentBlockDto } from './dto/update-content-block.dto';
import type { ReorderDto } from './dto/reorder.dto';
import type { AuthenticatedUser } from '../../auth/domain/types';

import type { ContentBlock } from '../domain/entities/content-block.entity';
import type { ContentVersion } from '../domain/entities/content-version.entity';

/**
 * Service for content block management within a lesson.
 * Handles CRUD, reordering, and content version snapshots.
 */
@Injectable()
export class ContentBlocksService {
  private readonly logger = new Logger(ContentBlocksService.name);

  constructor(
    private readonly blockRepository: ContentBlockRepository,
    private readonly versionRepository: ContentVersionRepository,
    private readonly lessonRepository: LessonRepository,
    private readonly moduleRepository: ModuleRepository,
    private readonly coursesService: CoursesService,
  ) {}

  /**
   * Resolve the parent course from a lesson (lesson -> module -> course) and assert ownership.
   */
  private async assertOwnershipViaLesson(lessonId: string, user: AuthenticatedUser): Promise<void> {
    const lesson = await this.lessonRepository.findById(lessonId);
    if (!lesson) {
      throw new NotFoundException(`Lesson with id ${lessonId} not found`);
    }
    const module = await this.moduleRepository.findById(lesson.moduleId);
    if (!module) {
      throw new NotFoundException(`Module with id ${lesson.moduleId} not found`);
    }
    await this.coursesService.assertCourseOwnership(module.courseId, user);
  }

  async create(
    lessonId: string,
    dto: CreateContentBlockDto,
    user: AuthenticatedUser,
  ): Promise<ContentBlock> {
    const lesson = await this.lessonRepository.findById(lessonId);
    if (!lesson) {
      throw new NotFoundException(`Lesson with id ${lessonId} not found`);
    }
    await this.assertOwnershipViaLesson(lessonId, user);

    const orderIndex =
      dto.orderIndex ?? (await this.blockRepository.getMaxOrderIndex(lessonId)) + 1;

    const block = await this.blockRepository.create({
      lessonId,
      type: dto.type,
      content: dto.content,
      orderIndex,
    });

    this.logger.log(`Created ${block.type} block in lesson ${lessonId} at index ${orderIndex}`);
    return block;
  }

  async findById(id: string): Promise<ContentBlock> {
    const block = await this.blockRepository.findById(id);
    if (!block) {
      throw new NotFoundException(`Content block with id ${id} not found`);
    }
    return block;
  }

  async findByLessonId(lessonId: string): Promise<ContentBlock[]> {
    const lesson = await this.lessonRepository.findById(lessonId);
    if (!lesson) {
      throw new NotFoundException(`Lesson with id ${lessonId} not found`);
    }
    return this.blockRepository.findByLessonId(lessonId);
  }

  async update(
    id: string,
    dto: UpdateContentBlockDto,
    user: AuthenticatedUser,
  ): Promise<ContentBlock> {
    const block = await this.findById(id);
    await this.assertOwnershipViaLesson(block.lessonId, user);

    const updated = await this.blockRepository.update(id, {
      ...(dto.type !== undefined && { type: dto.type }),
      ...(dto.content !== undefined && { content: dto.content }),
    } as any);

    if (!updated) {
      throw new NotFoundException(`Content block with id ${id} not found after update`);
    }

    this.logger.log(`Updated content block: ${id}`);
    return updated;
  }

  async reorder(
    lessonId: string,
    dto: ReorderDto,
    user: AuthenticatedUser,
  ): Promise<ContentBlock[]> {
    const lesson = await this.lessonRepository.findById(lessonId);
    if (!lesson) {
      throw new NotFoundException(`Lesson with id ${lessonId} not found`);
    }
    await this.assertOwnershipViaLesson(lessonId, user);

    const blocks = await this.blockRepository.findByIds(dto.orderedIds);
    const blockMap = new Map(blocks.map((b) => [b.id, b]));

    const reordered: ContentBlock[] = dto.orderedIds
      .map((id, index) => {
        const block = blockMap.get(id);
        if (block) {
          block.orderIndex = index;
        }
        return block;
      })
      .filter((b): b is ContentBlock => b !== undefined);

    await this.blockRepository.saveMany(reordered);
    this.logger.log(`Reordered ${reordered.length} blocks in lesson ${lessonId}`);
    return reordered;
  }

  /**
   * Create a version snapshot of all current blocks in a lesson.
   * Increments version number automatically.
   */
  async createVersion(
    lessonId: string,
    userId: string,
    user: AuthenticatedUser,
  ): Promise<ContentVersion> {
    const lesson = await this.lessonRepository.findById(lessonId);
    if (!lesson) {
      throw new NotFoundException(`Lesson with id ${lessonId} not found`);
    }
    await this.assertOwnershipViaLesson(lessonId, user);

    const blocks = await this.blockRepository.findByLessonId(lessonId);
    const latestVersion = await this.versionRepository.getLatestVersionNumber(lessonId);

    const snapshot = blocks.map((block) => ({
      type: block.type,
      content: block.content,
      orderIndex: block.orderIndex,
    }));

    const version = await this.versionRepository.create({
      lessonId,
      versionNumber: latestVersion + 1,
      blocks: snapshot,
      createdById: userId,
    });

    this.logger.log(`Created version ${version.versionNumber} for lesson ${lessonId}`);
    return version;
  }

  /**
   * List all content versions for a lesson (newest first).
   */
  async listVersions(lessonId: string): Promise<ContentVersion[]> {
    const lesson = await this.lessonRepository.findById(lessonId);
    if (!lesson) {
      throw new NotFoundException(`Lesson with id ${lessonId} not found`);
    }
    return this.versionRepository.findByLessonId(lessonId);
  }

  async softDelete(id: string, user: AuthenticatedUser): Promise<void> {
    const block = await this.findById(id);
    await this.assertOwnershipViaLesson(block.lessonId, user);
    await this.blockRepository.softDelete(id);
    this.logger.log(`Soft-deleted content block: ${id}`);
  }
}
