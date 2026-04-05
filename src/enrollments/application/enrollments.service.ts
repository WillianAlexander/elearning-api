import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ENROLLMENT_STATUS, COURSE_STATUS, USER_ROLE } from '@lms/shared';

import { CoursesService } from '@/courses/application/courses.service';

import { EnrollmentRepository } from '../infrastructure/enrollment.repository';
import type { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import type { BulkEnrollDto } from './dto/bulk-enroll.dto';
import type { EnrollmentQueryDto } from './dto/enrollment-query.dto';
import type { Enrollment } from '../domain/entities/enrollment.entity';

interface BulkEnrollResult {
  enrolled: string[];
  skipped: string[];
  total: number;
}

@Injectable()
export class EnrollmentsService {
  private readonly logger = new Logger(EnrollmentsService.name);

  constructor(
    private readonly enrollmentRepository: EnrollmentRepository,
    private readonly coursesService: CoursesService,
  ) {}

  async selfEnroll(
    dto: CreateEnrollmentDto,
    userId: string,
    userRole: string,
  ): Promise<Enrollment> {
    // Only COLABORADOR can self-enroll
    if (userRole === USER_ROLE.ADMINISTRADOR || userRole === USER_ROLE.INSTRUCTOR) {
      throw new ForbiddenException('Solo los colaboradores pueden inscribirse en cursos');
    }

    // CoursesService.findById throws NotFoundException if not found
    const course = await this.coursesService.findById(dto.courseId);

    if (course.status !== COURSE_STATUS.PUBLISHED) {
      throw new BadRequestException('Only published courses accept enrollments');
    }

    const existing = await this.enrollmentRepository.findByUserAndCourse(userId, dto.courseId);
    if (existing) {
      throw new BadRequestException('Already enrolled in this course');
    }

    const enrollment = await this.enrollmentRepository.create({
      userId,
      courseId: dto.courseId,
      status: ENROLLMENT_STATUS.ACTIVE,
      enrolledAt: new Date(),
      enrolledById: null,
    });

    this.logger.log(`User ${userId} enrolled in course ${dto.courseId}`);
    return enrollment;
  }

  async bulkEnroll(dto: BulkEnrollDto, adminId: string): Promise<BulkEnrollResult> {
    // CoursesService.findById throws NotFoundException if not found
    const course = await this.coursesService.findById(dto.courseId);

    if (course.status !== COURSE_STATUS.PUBLISHED) {
      throw new BadRequestException('Only published courses accept enrollments');
    }

    const enrolled: string[] = [];
    const skipped: string[] = [];

    // Use transaction to ensure atomicity — all enrollments succeed or none do
    await this.enrollmentRepository.transaction(async (manager) => {
      const enrollmentRepo = manager.getRepository(this.enrollmentRepository.getEntityTarget());

      for (const userId of dto.userIds) {
        const existing = await enrollmentRepo.findOne({
          where: { userId, courseId: dto.courseId },
        });

        if (existing) {
          skipped.push(userId);
          continue;
        }

        const enrollment = enrollmentRepo.create({
          userId,
          courseId: dto.courseId,
          status: ENROLLMENT_STATUS.ACTIVE,
          enrolledAt: new Date(),
          enrolledById: adminId,
        });
        await enrollmentRepo.save(enrollment);
        enrolled.push(userId);
      }
    });

    this.logger.log(
      `Bulk enroll course ${dto.courseId}: ${enrolled.length} enrolled, ${skipped.length} skipped`,
    );

    return { enrolled, skipped, total: dto.userIds.length };
  }

  async findMyEnrollments(userId: string) {
    return this.enrollmentRepository.findByUser(userId);
  }

  async findPaginated(query: EnrollmentQueryDto) {
    return this.enrollmentRepository.findPaginated({
      userId: query.userId,
      courseId: query.courseId,
      status: query.status,
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  async findById(id: string): Promise<Enrollment> {
    const enrollment = await this.enrollmentRepository.findById(id);
    if (!enrollment) {
      throw new NotFoundException(`Enrollment ${id} not found`);
    }
    return enrollment;
  }

  async drop(id: string, userId: string, isAdmin: boolean): Promise<Enrollment> {
    const enrollment = await this.findById(id);

    if (!isAdmin && enrollment.userId !== userId) {
      throw new ForbiddenException("Cannot drop another user's enrollment");
    }

    if (enrollment.status !== ENROLLMENT_STATUS.ACTIVE) {
      throw new BadRequestException(`Cannot drop enrollment with status "${enrollment.status}"`);
    }

    enrollment.status = ENROLLMENT_STATUS.DROPPED;
    enrollment.droppedAt = new Date();

    const saved = await this.enrollmentRepository.save(enrollment);
    this.logger.log(`Enrollment ${id} dropped`);
    return saved;
  }

  async softDelete(id: string): Promise<void> {
    await this.findById(id);
    await this.enrollmentRepository.softDelete(id);
    this.logger.log(`Soft-deleted enrollment ${id}`);
  }

  async updateProgress(enrollment: Enrollment, percentage: number): Promise<Enrollment> {
    enrollment.progressPercentage = percentage;

    if (percentage >= 100 && enrollment.status === ENROLLMENT_STATUS.ACTIVE) {
      enrollment.status = ENROLLMENT_STATUS.COMPLETED;
      enrollment.completedAt = new Date();
      enrollment.verificationCode = randomUUID();
      this.logger.log(`Enrollment ${enrollment.id} auto-completed, verification code generated`);
    }

    return this.enrollmentRepository.save(enrollment);
  }
}
