import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

import { ENROLLMENT_STATUS } from '@lms/shared';

import { SurveyTemplateRepository } from '../infrastructure/survey-template.repository';
import { SurveyResponseRepository } from '../infrastructure/survey-response.repository';
import type { SurveyTemplate } from '../domain/entities/survey-template.entity';
import type { SurveyResponse } from '../domain/entities/survey-response.entity';
import type { CreateSurveyTemplateDto } from './dto/create-survey-template.dto';
import type { SubmitSurveyResponseDto } from './dto/submit-survey-response.dto';

@Injectable()
export class SurveysService {
  private readonly logger = new Logger(SurveysService.name);

  constructor(
    private readonly templateRepository: SurveyTemplateRepository,
    private readonly responseRepository: SurveyResponseRepository,
    private readonly prisma: PrismaService,
  ) {}

  // ── Template CRUD (admin) ──

  async createTemplate(dto: CreateSurveyTemplateDto): Promise<SurveyTemplate> {
    const template = await this.templateRepository.create({
      title: dto.title,
      description: dto.description ?? null,
      courseId: dto.courseId ?? null,
      questions: dto.questions,
    });

    this.logger.log(`Survey template created: title="${dto.title}"`);
    return template;
  }

  async listTemplates(): Promise<SurveyTemplate[]> {
    return this.templateRepository.findAll();
  }

  async getTemplate(id: string): Promise<SurveyTemplate> {
    const template = await this.templateRepository.findById(id);
    if (!template) {
      throw new NotFoundException('Plantilla de encuesta no encontrada');
    }
    return template;
  }

  async getTemplateByCourse(courseId: string): Promise<SurveyTemplate | null> {
    return this.templateRepository.findByCourse(courseId);
  }

  // ── Responses (users) ──

  async submitResponse(userId: string, dto: SubmitSurveyResponseDto): Promise<SurveyResponse> {
    // Verify template exists
    const template = await this.templateRepository.findById(dto.templateId);
    if (!template) {
      throw new NotFoundException('Plantilla de encuesta no encontrada');
    }

    // Verify enrollment belongs to user and is completed
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { id: dto.enrollmentId, deletedAt: null },
    });
    if (!enrollment) {
      throw new NotFoundException('Inscripcion no encontrada');
    }
    if (enrollment.userId !== userId) {
      throw new ForbiddenException('Esta inscripcion no te pertenece');
    }
    if (enrollment.status !== ENROLLMENT_STATUS.COMPLETED) {
      throw new ForbiddenException('Solo puedes responder encuestas de cursos completados');
    }

    // Check no duplicate response
    const existing = await this.responseRepository.findByUserAndTemplate(userId, dto.templateId);
    if (existing) {
      throw new ConflictException('Ya has respondido esta encuesta');
    }

    const response = await this.responseRepository.create({
      templateId: dto.templateId,
      enrollmentId: dto.enrollmentId,
      userId,
      answers: dto.answers,
    });

    this.logger.log(`Survey response submitted: user=${userId}, template=${dto.templateId}`);
    return response;
  }

  async getResponsesByTemplate(templateId: string): Promise<SurveyResponse[]> {
    return this.responseRepository.findByTemplate(templateId);
  }

  async getResponsesByEnrollment(
    enrollmentId: string,
    user: { id: string; role: string },
  ): Promise<SurveyResponse[]> {
    // Verify the enrollment belongs to the requesting user (or user is admin/instructor)
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { id: enrollmentId, deletedAt: null },
    });
    if (!enrollment) {
      throw new NotFoundException('Inscripción no encontrada');
    }
    if (
      enrollment.userId !== user.id &&
      user.role !== 'administrador' &&
      user.role !== 'instructor'
    ) {
      throw new ForbiddenException('No tienes permiso para ver estas respuestas');
    }
    return this.responseRepository.findByEnrollment(enrollmentId);
  }
}
