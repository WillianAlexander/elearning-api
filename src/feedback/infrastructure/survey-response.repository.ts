import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class SurveyResponseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByTemplate(templateId: string): Promise<any[]> {
    return this.prisma.surveyResponse.findMany({
      where: { templateId, deletedAt: null },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUserAndTemplate(userId: string, templateId: string): Promise<any | null> {
    return this.prisma.surveyResponse.findFirst({
      where: { userId, templateId, deletedAt: null },
    });
  }

  async findByEnrollment(enrollmentId: string): Promise<any[]> {
    return this.prisma.surveyResponse.findMany({
      where: { enrollmentId, deletedAt: null },
      include: { template: true },
    });
  }

  async create(data: {
    templateId: string;
    enrollmentId: string;
    userId: string;
    answers: Array<{ questionId: string; value: string | number }>;
  }): Promise<any> {
    return this.prisma.surveyResponse.create({ data });
  }
}
