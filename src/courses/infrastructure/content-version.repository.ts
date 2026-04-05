import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * Custom repository for ContentVersion entity.
 */
@Injectable()
export class ContentVersionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<any | null> {
    return this.prisma.contentVersion.findFirst({ where: { id } });
  }

  async findByLessonId(lessonId: string): Promise<any[]> {
    return this.prisma.contentVersion.findMany({
      where: { lessonId },
      orderBy: { versionNumber: 'desc' },
    });
  }

  async getLatestVersionNumber(lessonId: string): Promise<number> {
    const result = await this.prisma.contentVersion.aggregate({
      where: { lessonId },
      _max: { versionNumber: true },
    });
    return result._max.versionNumber ?? 0;
  }

  async create(data: any): Promise<any> {
    return this.prisma.contentVersion.create({ data });
  }
}
