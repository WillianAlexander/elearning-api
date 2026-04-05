import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { USER_ROLE } from '@lms/shared';

import { CoursesService } from '../application/courses.service';
import { CreateCourseDto } from '../application/dto/create-course.dto';
import { UpdateCourseDto } from '../application/dto/update-course.dto';
import { CourseQueryDto } from '../application/dto/course-query.dto';
import { UpdateCompletionCriteriaDto } from '../application/dto/update-completion-criteria.dto';
import { RejectCourseDto } from '../application/dto/reject-course.dto';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/presentation/guards/roles.guard';
import { Roles } from '../../auth/presentation/decorators/roles.decorator';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/domain/types';

@ApiTags('Courses')
@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(USER_ROLE.INSTRUCTOR)
  @ApiOperation({ summary: 'Create a new course (instructor only)' })
  @ApiCreatedResponse({ description: 'Curso creado exitosamente' })
  @ApiBadRequestResponse({ description: 'Datos del curso invalidos' })
  @ApiUnauthorizedResponse({ description: 'Token invalido o expirado' })
  @ApiForbiddenResponse({ description: 'Solo los instructores pueden crear cursos' })
  async create(@Body() dto: CreateCourseDto, @CurrentUser() user: AuthenticatedUser) {
    return this.coursesService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List courses with pagination and filters' })
  @ApiOkResponse({ description: 'Lista paginada de cursos' })
  @ApiBadRequestResponse({ description: 'Parametros de consulta invalidos' })
  @ApiUnauthorizedResponse({ description: 'Token invalido o expirado' })
  async findAll(@Query() query: CourseQueryDto) {
    return this.coursesService.findPaginated(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course by ID with full structure' })
  @ApiOkResponse({ description: 'Datos completos del curso' })
  @ApiNotFoundResponse({ description: 'Curso no encontrado' })
  @ApiUnauthorizedResponse({ description: 'Token invalido o expirado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.findById(id);
  }

  @Put(':id')
  @Roles(USER_ROLE.INSTRUCTOR, USER_ROLE.ADMINISTRADOR)
  @ApiOperation({ summary: 'Update course metadata (owner only, admin bypasses ownership)' })
  @ApiOkResponse({ description: 'Curso actualizado exitosamente' })
  @ApiBadRequestResponse({ description: 'Datos de actualizacion invalidos' })
  @ApiNotFoundResponse({ description: 'Curso no encontrado' })
  @ApiUnauthorizedResponse({ description: 'Token invalido o expirado' })
  @ApiForbiddenResponse({
    description: 'Solo el dueno del curso o un administrador puede editarlo',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCourseDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.coursesService.update(id, dto, user);
  }

  @Patch(':id/request-review')
  @Roles(USER_ROLE.INSTRUCTOR)
  @ApiOperation({ summary: 'Submit a DRAFT course for admin review (owner only)' })
  @ApiOkResponse({ description: 'Curso enviado a revision exitosamente' })
  @ApiBadRequestResponse({ description: 'El curso no esta en estado DRAFT' })
  @ApiNotFoundResponse({ description: 'Curso no encontrado' })
  @ApiUnauthorizedResponse({ description: 'Token invalido o expirado' })
  @ApiForbiddenResponse({ description: 'Solo el instructor dueno puede solicitar revision' })
  async requestReview(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.coursesService.requestReview(id, user);
  }

  @Patch(':id/publish')
  @Roles(USER_ROLE.ADMINISTRADOR)
  @ApiOperation({ summary: 'Approve and publish a PENDING_REVIEW course (admin only)' })
  @ApiOkResponse({ description: 'Curso publicado exitosamente' })
  @ApiBadRequestResponse({ description: 'El curso no esta en estado PENDING_REVIEW' })
  @ApiNotFoundResponse({ description: 'Curso no encontrado' })
  @ApiUnauthorizedResponse({ description: 'Token invalido o expirado' })
  @ApiForbiddenResponse({ description: 'Solo los administradores pueden publicar cursos' })
  async publish(@Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.publish(id);
  }

  @Patch(':id/reject')
  @Roles(USER_ROLE.ADMINISTRADOR)
  @ApiOperation({ summary: 'Reject a PENDING_REVIEW course back to DRAFT (admin only)' })
  @ApiOkResponse({ description: 'Curso rechazado y vuelto a DRAFT exitosamente' })
  @ApiBadRequestResponse({ description: 'El curso no esta en estado PENDING_REVIEW' })
  @ApiNotFoundResponse({ description: 'Curso no encontrado' })
  @ApiUnauthorizedResponse({ description: 'Token invalido o expirado' })
  @ApiForbiddenResponse({ description: 'Solo los administradores pueden rechazar cursos' })
  async reject(@Param('id', ParseUUIDPipe) id: string, @Body() dto: RejectCourseDto) {
    return this.coursesService.reject(id, dto.reason);
  }

  @Patch(':id/archive')
  @Roles(USER_ROLE.ADMINISTRADOR)
  @ApiOperation({ summary: 'Archive a PUBLISHED course (admin only)' })
  @ApiOkResponse({ description: 'Curso archivado exitosamente' })
  @ApiBadRequestResponse({ description: 'El curso no esta en estado PUBLISHED' })
  @ApiNotFoundResponse({ description: 'Curso no encontrado' })
  @ApiUnauthorizedResponse({ description: 'Token invalido o expirado' })
  @ApiForbiddenResponse({ description: 'Solo los administradores pueden archivar cursos' })
  async archive(@Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.archive(id);
  }

  @Patch(':id/completion-criteria')
  @Roles(USER_ROLE.INSTRUCTOR)
  @ApiOperation({ summary: 'Update course completion criteria (owner only)' })
  @ApiOkResponse({ description: 'Criterios de completitud actualizados exitosamente' })
  @ApiBadRequestResponse({ description: 'Criterios de completitud invalidos' })
  @ApiNotFoundResponse({ description: 'Curso no encontrado' })
  @ApiUnauthorizedResponse({ description: 'Token invalido o expirado' })
  @ApiForbiddenResponse({ description: 'Solo el instructor dueno puede actualizar los criterios' })
  async updateCompletionCriteria(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCompletionCriteriaDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.coursesService.updateCompletionCriteria(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(USER_ROLE.INSTRUCTOR, USER_ROLE.ADMINISTRADOR)
  @ApiOperation({ summary: 'Soft delete a course (instructor: own DRAFT only, admin: any)' })
  @ApiNoContentResponse({ description: 'Curso eliminado exitosamente' })
  @ApiNotFoundResponse({ description: 'Curso no encontrado' })
  @ApiUnauthorizedResponse({ description: 'Token invalido o expirado' })
  @ApiForbiddenResponse({ description: 'Sin permiso para eliminar este curso' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.coursesService.softDelete(id, user);
  }
}
