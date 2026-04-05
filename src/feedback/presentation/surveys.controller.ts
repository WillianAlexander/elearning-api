import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { USER_ROLE } from '@lms/shared';

import { SurveysService } from '../application/surveys.service';
import { CreateSurveyTemplateDto } from '../application/dto/create-survey-template.dto';
import { SubmitSurveyResponseDto } from '../application/dto/submit-survey-response.dto';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/presentation/guards/roles.guard';
import { Roles } from '../../auth/presentation/decorators/roles.decorator';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/domain';

@ApiTags('Surveys')
@Controller('surveys')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SurveysController {
  constructor(private readonly surveysService: SurveysService) {}

  // ── Template endpoints (admin) ──

  @Post('templates')
  @HttpCode(HttpStatus.CREATED)
  @Roles(USER_ROLE.ADMINISTRADOR)
  @ApiOperation({ summary: 'Create a survey template (admin)' })
  async createTemplate(@Body() dto: CreateSurveyTemplateDto) {
    return this.surveysService.createTemplate(dto);
  }

  @Get('templates')
  @Roles(USER_ROLE.ADMINISTRADOR)
  @ApiOperation({ summary: 'List all survey templates (admin)' })
  async listTemplates() {
    return this.surveysService.listTemplates();
  }

  @Get('templates/:templateId')
  @ApiOperation({ summary: 'Get a survey template by ID' })
  async getTemplate(
    @Param('templateId', ParseUUIDPipe) templateId: string,
  ) {
    return this.surveysService.getTemplate(templateId);
  }

  @Get('templates/course/:courseId')
  @ApiOperation({ summary: 'Get active survey template for a course' })
  async getTemplateByCourse(
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ) {
    return this.surveysService.getTemplateByCourse(courseId);
  }

  // ── Response endpoints (users) ──

  @Post('responses')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a survey response (completed course users)' })
  async submitResponse(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubmitSurveyResponseDto,
  ) {
    return this.surveysService.submitResponse(user.id, dto);
  }

  @Get('responses/template/:templateId')
  @Roles(USER_ROLE.ADMINISTRADOR, USER_ROLE.INSTRUCTOR)
  @ApiOperation({ summary: 'Get all responses for a template (admin/instructor)' })
  async getResponsesByTemplate(
    @Param('templateId', ParseUUIDPipe) templateId: string,
  ) {
    return this.surveysService.getResponsesByTemplate(templateId);
  }

  @Get('responses/enrollment/:enrollmentId')
  @ApiOperation({ summary: 'Get survey responses for an enrollment (own or admin/instructor)' })
  async getResponsesByEnrollment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('enrollmentId', ParseUUIDPipe) enrollmentId: string,
  ) {
    return this.surveysService.getResponsesByEnrollment(enrollmentId, user);
  }
}
