import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  ParseUUIDPipe,
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiProduces,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { USER_ROLE } from '@lms/shared';
import type { Response } from 'express';

import { EnrollmentsService } from '../application/enrollments.service';
import { CertificateService } from '../application/certificate.service';
import { CreateEnrollmentDto } from '../application/dto/create-enrollment.dto';
import { BulkEnrollDto } from '../application/dto/bulk-enroll.dto';
import { EnrollmentQueryDto } from '../application/dto/enrollment-query.dto';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/presentation/guards/roles.guard';
import { Roles } from '../../auth/presentation/decorators/roles.decorator';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/domain/types';

@ApiTags('Enrollments')
@Controller('enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EnrollmentsController {
  constructor(
    private readonly enrollmentsService: EnrollmentsService,
    private readonly certificateService: CertificateService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(USER_ROLE.COLABORADOR)
  @ApiOperation({ summary: 'Self-enroll in a published course (colaborador only)' })
  @ApiCreatedResponse({ description: 'Inscripcion creada exitosamente' })
  @ApiBadRequestResponse({ description: 'Datos de inscripcion invalidos o ya inscripto' })
  @ApiNotFoundResponse({ description: 'Curso no encontrado' })
  @ApiUnauthorizedResponse({ description: 'Token invalido o expirado' })
  @ApiForbiddenResponse({ description: 'Solo los colaboradores pueden auto-inscribirse' })
  async selfEnroll(@Body() dto: CreateEnrollmentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.enrollmentsService.selfEnroll(dto, user.id, user.role);
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  @Roles(USER_ROLE.ADMINISTRADOR)
  @ApiOperation({ summary: 'Bulk-enroll users in a course (admin)' })
  @ApiCreatedResponse({ description: 'Inscripciones masivas creadas exitosamente' })
  @ApiBadRequestResponse({ description: 'Datos de inscripcion masiva invalidos' })
  @ApiNotFoundResponse({ description: 'Curso o usuarios no encontrados' })
  @ApiUnauthorizedResponse({ description: 'Token invalido o expirado' })
  @ApiForbiddenResponse({
    description: 'Solo los administradores pueden realizar inscripciones masivas',
  })
  async bulkEnroll(@Body() dto: BulkEnrollDto, @CurrentUser() user: AuthenticatedUser) {
    return this.enrollmentsService.bulkEnroll(dto, user.id);
  }

  @Get('my')
  @ApiOperation({ summary: 'List my enrollments' })
  @ApiOkResponse({ description: 'Lista de inscripciones del usuario autenticado' })
  @ApiUnauthorizedResponse({ description: 'Token invalido o expirado' })
  async findMy(@CurrentUser() user: AuthenticatedUser) {
    return this.enrollmentsService.findMyEnrollments(user.id);
  }

  @Get()
  @Roles(USER_ROLE.ADMINISTRADOR, USER_ROLE.INSTRUCTOR)
  @ApiOperation({ summary: 'List all enrollments with filters (admin/instructor)' })
  @ApiOkResponse({ description: 'Lista paginada de inscripciones' })
  @ApiBadRequestResponse({ description: 'Parametros de consulta invalidos' })
  @ApiUnauthorizedResponse({ description: 'Token invalido o expirado' })
  @ApiForbiddenResponse({
    description: 'Solo administradores e instructores pueden listar todas las inscripciones',
  })
  async findAll(@Query() query: EnrollmentQueryDto) {
    return this.enrollmentsService.findPaginated(query);
  }

  @Get(':id/certificate')
  @ApiOperation({ summary: 'Download completion certificate as PDF' })
  @ApiProduces('application/pdf')
  @ApiOkResponse({ description: 'Certificado de completitud en formato PDF' })
  @ApiNotFoundResponse({ description: 'Inscripcion no encontrada o curso no completado' })
  @ApiUnauthorizedResponse({ description: 'Token invalido o expirado' })
  @ApiForbiddenResponse({
    description: 'Solo el usuario inscripto o un administrador puede descargar el certificado',
  })
  async downloadCertificate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    // Authorization: only the enrolled user or an admin can download
    const enrollment = await this.enrollmentsService.findById(id);
    if (enrollment.userId !== user.id && user.role !== USER_ROLE.ADMINISTRADOR) {
      throw new ForbiddenException('No tienes permiso para descargar este certificado');
    }

    const { buffer, fileName } = await this.certificateService.generateCertificate(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get enrollment by ID (own enrollment or admin/instructor)' })
  @ApiOkResponse({ description: 'Datos de la inscripcion' })
  @ApiNotFoundResponse({ description: 'Inscripcion no encontrada' })
  @ApiUnauthorizedResponse({ description: 'Token invalido o expirado' })
  @ApiForbiddenResponse({ description: 'No tienes permiso para ver esta inscripcion' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    const enrollment = await this.enrollmentsService.findById(id);
    if (
      enrollment.userId !== user.id &&
      user.role !== USER_ROLE.ADMINISTRADOR &&
      user.role !== USER_ROLE.INSTRUCTOR
    ) {
      throw new ForbiddenException('No tienes permiso para ver esta inscripción');
    }
    return enrollment;
  }

  @Patch(':id/drop')
  @ApiOperation({ summary: 'Drop (abandon) an enrollment' })
  @ApiOkResponse({ description: 'Inscripcion abandonada exitosamente' })
  @ApiNotFoundResponse({ description: 'Inscripcion no encontrada' })
  @ApiUnauthorizedResponse({ description: 'Token invalido o expirado' })
  @ApiForbiddenResponse({ description: 'No tienes permiso para abandonar esta inscripcion' })
  async drop(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    const isAdmin = user.role === USER_ROLE.ADMINISTRADOR;
    return this.enrollmentsService.drop(id, user.id, isAdmin);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(USER_ROLE.ADMINISTRADOR)
  @ApiOperation({ summary: 'Soft delete enrollment (admin only)' })
  @ApiNoContentResponse({ description: 'Inscripcion eliminada exitosamente' })
  @ApiNotFoundResponse({ description: 'Inscripcion no encontrada' })
  @ApiUnauthorizedResponse({ description: 'Token invalido o expirado' })
  @ApiForbiddenResponse({ description: 'Solo los administradores pueden eliminar inscripciones' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.enrollmentsService.softDelete(id);
  }
}
