import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { LessonProgressService } from '../application/lesson-progress.service';
import { UpdateLessonProgressDto } from '../application/dto/update-lesson-progress.dto';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/presentation/guards/roles.guard';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/domain/types';

@ApiTags('Lesson Progress')
@Controller('enrollments/:enrollmentId/progress')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LessonProgressController {
  constructor(private readonly progressService: LessonProgressService) {}

  @Get()
  @ApiOperation({ summary: 'Get progress for all lessons in an enrollment' })
  async findAll(
    @Param('enrollmentId', ParseUUIDPipe) enrollmentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.progressService.findByEnrollment(enrollmentId, user.id);
  }

  @Put(':lessonId')
  @ApiOperation({ summary: 'Update lesson progress / bookmark' })
  async update(
    @Param('enrollmentId', ParseUUIDPipe) enrollmentId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() dto: UpdateLessonProgressDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.progressService.updateProgress(
      enrollmentId,
      lessonId,
      user.id,
      dto,
    );
  }

  @Post(':lessonId/complete')
  @ApiOperation({ summary: 'Mark a lesson as completed' })
  async complete(
    @Param('enrollmentId', ParseUUIDPipe) enrollmentId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.progressService.completeLesson(
      enrollmentId,
      lessonId,
      user.id,
    );
  }
}
