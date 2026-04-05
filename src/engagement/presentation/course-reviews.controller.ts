import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { CourseReviewsService } from '../application/course-reviews.service';
import { CreateReviewDto } from '../application/dto/create-review.dto';
import { UpdateReviewDto } from '../application/dto/update-review.dto';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/presentation/guards/roles.guard';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/domain';

@ApiTags('Course Reviews')
@Controller('courses/:courseId/reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CourseReviewsController {
  constructor(private readonly reviewsService: CourseReviewsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a review for a completed course' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(user.id, courseId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all reviews for a course' })
  async list(
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ) {
    return this.reviewsService.findByCourse(courseId);
  }

  @Put(':reviewId')
  @ApiOperation({ summary: 'Update your review' })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(reviewId, user.id, dto);
  }

  @Delete(':reviewId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete your review' })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
  ) {
    await this.reviewsService.remove(reviewId, user.id);
  }
}
