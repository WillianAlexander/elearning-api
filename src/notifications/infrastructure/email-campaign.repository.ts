import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class EmailCampaignRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByCourse(courseId: string): Promise<any[]> {
    return this.prisma.emailCampaign.findMany({
      where: { courseId, deletedAt: null },
      include: { sender: true },
      orderBy: { sentAt: 'desc' },
    });
  }

  async create(data: any): Promise<any> {
    return this.prisma.emailCampaign.create({ data });
  }
}
