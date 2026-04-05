import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { COURSE_STATUS, DIFFICULTY_LEVEL, USER_ROLE } from '@lms/shared';

import { CourseRepository } from '../infrastructure/course.repository';
import { TagRepository } from '../infrastructure/tag.repository';
import type { CreateCourseDto } from './dto/create-course.dto';
import type { UpdateCourseDto } from './dto/update-course.dto';
import type { CourseQueryDto } from './dto/course-query.dto';
import type { UpdateCompletionCriteriaDto } from './dto/update-completion-criteria.dto';
import type { AuthenticatedUser } from '../../auth/domain/types';
import type { Course } from '../domain/entities/course.entity';
import type { CompletionCriteria } from '../domain/entities/course.entity';

/**
 * Service for course management operations.
 * Handles CRUD, publish/archive lifecycle, slug generation, tags.
 */
@Injectable()
export class CoursesService {
  private readonly logger = new Logger(CoursesService.name);

  constructor(
    private readonly courseRepository: CourseRepository,
    private readonly tagRepository: TagRepository,
  ) {}

  async create(dto: CreateCourseDto, instructorId: string): Promise<Course> {
    const slug = await this.generateUniqueSlug(dto.title);

    let tags;
    if (dto.tagNames && dto.tagNames.length > 0) {
      tags = await Promise.all(
        dto.tagNames.map((name) => this.tagRepository.findOrCreate(name.trim())),
      );
    } else if (dto.tagIds && dto.tagIds.length > 0) {
      tags = await this.tagRepository.findByIds(dto.tagIds);
    }

    const course = await this.courseRepository.create({
      title: dto.title,
      slug,
      description: dto.description ?? null,
      thumbnailUrl: dto.thumbnailUrl ?? null,
      estimatedDuration: dto.estimatedDuration ?? null,
      difficultyLevel: dto.difficultyLevel ?? DIFFICULTY_LEVEL.BEGINNER,
      status: COURSE_STATUS.DRAFT,
      categoryId: dto.categoryId ?? null,
      createdById: instructorId,
      tags,
    });

    this.logger.log(`Created course: ${course.title} (${course.slug})`);
    return course;
  }

  async findById(id: string): Promise<Course> {
    const course = await this.courseRepository.findById(id);
    if (!course) {
      throw new NotFoundException(`Course with id ${id} not found`);
    }
    return course;
  }

  async findPaginated(query: CourseQueryDto) {
    return this.courseRepository.findPaginated({
      status: query.status,
      categoryId: query.categoryId,
      instructorId: query.instructorId ?? query.createdById,
      search: query.search,
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  async update(id: string, dto: UpdateCourseDto, user: AuthenticatedUser): Promise<Course> {
    const course = await this.findById(id);
    this.assertOwnership(course, user);

    let tags;
    if (dto.tagNames !== undefined && dto.tagNames.length > 0) {
      tags = await Promise.all(
        dto.tagNames.map((name) => this.tagRepository.findOrCreate(name.trim())),
      );
    } else if (dto.tagIds !== undefined) {
      tags = dto.tagIds.length > 0 ? await this.tagRepository.findByIds(dto.tagIds) : [];
    }

    // Build update data excluding tag fields (handled separately)
    const { tagIds, tagNames, ...updateData } = dto;

    if (tags !== undefined) {
      // For ManyToMany, we need to save the entity with new tags
      course.tags = tags;
      Object.assign(course, updateData);
      const saved = await this.courseRepository.save(course);
      this.logger.log(`Updated course: ${saved.title}`);
      return saved;
    }

    const updated = await this.courseRepository.update(id, updateData);
    if (!updated) {
      throw new NotFoundException(`Course with id ${id} not found after update`);
    }

    this.logger.log(`Updated course: ${updated.title}`);
    return updated;
  }

  async requestReview(id: string, user: AuthenticatedUser): Promise<Course> {
    const course = await this.findById(id);
    this.assertOwnership(course, user);

    if (course.status !== COURSE_STATUS.DRAFT) {
      throw new BadRequestException(
        `Cannot request review for course with status "${course.status}". Only DRAFT courses can be submitted for review.`,
      );
    }

    course.status = COURSE_STATUS.PENDING_REVIEW;
    course.rejectionReason = null;

    const saved = await this.courseRepository.save(course);
    this.logger.log(`Course submitted for review: ${saved.title}`);
    return saved;
  }

  async publish(id: string): Promise<Course> {
    const course = await this.findById(id);

    if (course.status !== COURSE_STATUS.PENDING_REVIEW) {
      throw new BadRequestException(
        `Cannot publish course with status "${course.status}". Only PENDING_REVIEW courses can be published.`,
      );
    }

    course.status = COURSE_STATUS.PUBLISHED;
    course.publishedAt = new Date();
    course.rejectionReason = null;

    const saved = await this.courseRepository.save(course);
    this.logger.log(`Published course: ${saved.title}`);
    return saved;
  }

  async reject(id: string, reason: string): Promise<Course> {
    const course = await this.findById(id);

    if (course.status !== COURSE_STATUS.PENDING_REVIEW) {
      throw new BadRequestException(
        `Cannot reject course with status "${course.status}". Only PENDING_REVIEW courses can be rejected.`,
      );
    }

    course.status = COURSE_STATUS.DRAFT;
    course.rejectionReason = reason;

    const saved = await this.courseRepository.save(course);
    this.logger.log(`Rejected course: ${saved.title} — Reason: ${reason}`);
    return saved;
  }

  async archive(id: string): Promise<Course> {
    const course = await this.findById(id);

    if (course.status !== COURSE_STATUS.PUBLISHED) {
      throw new BadRequestException(
        `Cannot archive course with status "${course.status}". Only PUBLISHED courses can be archived.`,
      );
    }

    course.status = COURSE_STATUS.ARCHIVED;

    const saved = await this.courseRepository.save(course);
    this.logger.log(`Archived course: ${saved.title}`);
    return saved;
  }

  async softDelete(id: string, user?: { id: string; role: string }): Promise<void> {
    const course = await this.findById(id);

    if (user && user.role !== USER_ROLE.ADMINISTRADOR) {
      // Instructors can only delete their own DRAFT courses
      if (course.createdById !== user.id) {
        throw new ForbiddenException('You can only delete your own courses');
      }
      if (course.status !== COURSE_STATUS.DRAFT) {
        throw new BadRequestException(
          'Instructors can only delete courses in DRAFT status. Contact an administrator for other statuses.',
        );
      }
    }

    await this.courseRepository.softDelete(id);
    this.logger.log(`Soft-deleted course: ${id}`);
  }

  /**
   * Verify that the authenticated user owns the given course.
   * Throws ForbiddenException if the user is not the course creator.
   */
  private assertOwnership(course: Course, user: AuthenticatedUser): void {
    if (user.role !== USER_ROLE.ADMINISTRADOR && course.createdById !== user.id) {
      throw new ForbiddenException('You can only modify your own courses');
    }
  }

  /**
   * Public ownership check for use by child-resource services (modules, lessons, content-blocks).
   * Loads the course and verifies the user is the owner.
   */
  async assertCourseOwnership(courseId: string, user: AuthenticatedUser): Promise<void> {
    const course = await this.findById(courseId);
    this.assertOwnership(course, user);
  }

  /**
   * Generate a URL-friendly slug from the title.
   * Appends a counter suffix if the slug already exists.
   */
  private async generateUniqueSlug(title: string): Promise<string> {
    const baseSlug = this.slugify(title);
    let slug = baseSlug;
    let counter = 1;

    while (await this.courseRepository.findBySlug(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  async updateCompletionCriteria(
    courseId: string,
    dto: UpdateCompletionCriteriaDto,
    user: AuthenticatedUser,
  ): Promise<Course> {
    const course = await this.findById(courseId);
    this.assertOwnership(course, user);

    const currentCriteria = course.completionCriteria ?? {
      requireAllLessons: true,
      requireQuizPass: false,
      minQuizScore: 0,
    };

    const updatedCriteria: CompletionCriteria = {
      requireAllLessons: dto.requireAllLessons ?? currentCriteria.requireAllLessons,
      requireQuizPass: dto.requireQuizPass ?? currentCriteria.requireQuizPass,
      minQuizScore: dto.minQuizScore ?? currentCriteria.minQuizScore,
    };

    course.completionCriteria = updatedCriteria;
    const saved = await this.courseRepository.save(course);

    this.logger.log(
      `Updated completion criteria for course ${courseId}: ${JSON.stringify(updatedCriteria)}`,
    );

    return saved;
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric
      .replace(/\s+/g, '-') // Replace spaces with dashes
      .replace(/-+/g, '-') // Collapse multiple dashes
      .replace(/^-|-$/g, ''); // Trim leading/trailing dashes
  }
}
