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

import { USER_ROLE } from '@lms/shared';

import { RubricsService } from '../application/rubrics.service';
import { RubricEvaluationsService } from '../application/rubric-evaluations.service';
import { CreateRubricDto } from '../application/dto/create-rubric.dto';
import { UpdateRubricDto } from '../application/dto/update-rubric.dto';
import { CreateRubricEvaluationDto } from '../application/dto/create-rubric-evaluation.dto';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/presentation/guards/roles.guard';
import { Roles } from '../../auth/presentation/decorators/roles.decorator';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/domain';

@ApiTags('Rubrics')
@Controller('courses/:courseId/rubrics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RubricsController {
  constructor(
    private readonly rubricsService: RubricsService,
    private readonly evaluationsService: RubricEvaluationsService,
  ) {}

  // ── Rubric CRUD ──

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(USER_ROLE.INSTRUCTOR, USER_ROLE.ADMINISTRADOR)
  @ApiOperation({ summary: 'Create a rubric (instructor only)' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: CreateRubricDto,
  ) {
    return this.rubricsService.create(courseId, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List rubrics for a course' })
  async list(
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ) {
    return this.rubricsService.findByCourse(courseId);
  }

  @Get(':rubricId')
  @ApiOperation({ summary: 'Get a rubric by ID' })
  async findOne(
    @Param('rubricId', ParseUUIDPipe) rubricId: string,
  ) {
    return this.rubricsService.findById(rubricId);
  }

  @Put(':rubricId')
  @Roles(USER_ROLE.INSTRUCTOR, USER_ROLE.ADMINISTRADOR)
  @ApiOperation({ summary: 'Update a rubric (instructor only)' })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('rubricId', ParseUUIDPipe) rubricId: string,
    @Body() dto: UpdateRubricDto,
  ) {
    return this.rubricsService.update(rubricId, user.id, dto);
  }

  @Delete(':rubricId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(USER_ROLE.INSTRUCTOR, USER_ROLE.ADMINISTRADOR)
  @ApiOperation({ summary: 'Delete a rubric (instructor only)' })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('rubricId', ParseUUIDPipe) rubricId: string,
  ) {
    await this.rubricsService.remove(rubricId, user.id);
  }

  // ── Rubric Evaluations ──

  @Post(':rubricId/evaluate')
  @HttpCode(HttpStatus.CREATED)
  @Roles(USER_ROLE.INSTRUCTOR, USER_ROLE.ADMINISTRADOR)
  @ApiOperation({ summary: 'Evaluate an enrollment using a rubric (instructor only)' })
  async evaluate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('rubricId', ParseUUIDPipe) rubricId: string,
    @Body() dto: CreateRubricEvaluationDto,
  ) {
    return this.evaluationsService.evaluate(rubricId, user.id, dto);
  }

  @Get(':rubricId/evaluations/:enrollmentId')
  @ApiOperation({ summary: 'Get evaluation for a specific enrollment and rubric' })
  async getEvaluation(
    @Param('rubricId', ParseUUIDPipe) rubricId: string,
    @Param('enrollmentId', ParseUUIDPipe) enrollmentId: string,
  ) {
    return this.evaluationsService.findByRubricAndEnrollment(
      rubricId,
      enrollmentId,
    );
  }
}

@ApiTags('Rubric Evaluations')
@Controller('rubrics/enrollment')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RubricEnrollmentController {
  constructor(
    private readonly evaluationsService: RubricEvaluationsService,
  ) {}

  @Get(':enrollmentId')
  @ApiOperation({ summary: 'Get all rubric evaluations for an enrollment' })
  async getByEnrollment(
    @Param('enrollmentId', ParseUUIDPipe) enrollmentId: string,
  ) {
    return this.evaluationsService.findByEnrollment(enrollmentId);
  }
}
