import {
  Injectable,
  Logger,
  ForbiddenException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

import { ENROLLMENT_STATUS } from '@lms/shared';

import { CourseReviewRepository } from '../infrastructure/course-review.repository';
import type { CourseReview } from '../domain/entities/course-review.entity';
import type { CreateReviewDto } from './dto/create-review.dto';
import type { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class CourseReviewsService {
  private readonly logger = new Logger(CourseReviewsService.name);

  constructor(
    private readonly reviewRepository: CourseReviewRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(userId: string, courseId: string, dto: CreateReviewDto): Promise<CourseReview> {
    // Check user has completed the course
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { userId, courseId, status: ENROLLMENT_STATUS.COMPLETED, deletedAt: null },
    });

    if (!enrollment) {
      throw new ForbiddenException('Solo puedes dejar una reseña en cursos que hayas completado');
    }

    // Check no existing review
    const existing = await this.reviewRepository.findByUserAndCourse(userId, courseId);
    if (existing) {
      throw new ConflictException('Ya has dejado una reseña para este curso');
    }

    const review = await this.reviewRepository.create({
      userId,
      courseId,
      rating: dto.rating,
      comment: dto.comment ?? null,
    });

    // Recalculate denormalized rating
    await this.recalculateRating(courseId);

    this.logger.log(`Review created: user=${userId}, course=${courseId}, rating=${dto.rating}`);
    return review;
  }

  async findByCourse(courseId: string): Promise<CourseReview[]> {
    return this.reviewRepository.findByCourse(courseId);
  }

  async update(reviewId: string, userId: string, dto: UpdateReviewDto): Promise<CourseReview> {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundException('Reseña no encontrada');
    }
    if (review.userId !== userId) {
      throw new ForbiddenException('No puedes editar la reseña de otro usuario');
    }

    if (dto.rating !== undefined) {
      review.rating = dto.rating;
    }
    if (dto.comment !== undefined) {
      review.comment = dto.comment;
    }

    const saved = await this.reviewRepository.save(review);

    // Recalculate denormalized rating
    await this.recalculateRating(review.courseId);

    return saved;
  }

  async remove(reviewId: string, userId: string): Promise<void> {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundException('Reseña no encontrada');
    }
    if (review.userId !== userId) {
      throw new ForbiddenException('No puedes eliminar la reseña de otro usuario');
    }

    await this.reviewRepository.softDelete(reviewId);
    await this.recalculateRating(review.courseId);

    this.logger.log(`Review deleted: id=${reviewId}, course=${review.courseId}`);
  }

  private async recalculateRating(courseId: string): Promise<void> {
    const { avg, count } = await this.reviewRepository.getAverageRating(courseId);

    await this.prisma.course.update({
      where: { id: courseId },
      data: {
        avgRating: Math.round(avg * 100) / 100,
        reviewCount: count,
      },
    });
  }
}
