import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class SurveyTemplateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<any[]> {
    return this.prisma.surveyTemplate.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<any | null> {
    return this.prisma.surveyTemplate.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByCourse(courseId: string): Promise<any | null> {
    return this.prisma.surveyTemplate.findFirst({
      where: { courseId, isActive: true, deletedAt: null },
    });
  }

  async create(data: {
    title: string;
    description?: string | null;
    courseId?: string | null;
    questions: Array<{ id: string; text: string; type: 'rating' | 'text'; required: boolean }>;
  }): Promise<any> {
    return this.prisma.surveyTemplate.create({ data });
  }

  async save(template: any): Promise<any> {
    return this.prisma.surveyTemplate.update({
      where: { id: template.id },
      data: template,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.surveyTemplate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
