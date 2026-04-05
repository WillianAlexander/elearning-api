import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * Custom repository for MediaFile entity.
 */
@Injectable()
export class MediaFileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<any | null> {
    return this.prisma.mediaFile.findFirst({ where: { id, deletedAt: null } });
  }

  async create(data: any): Promise<any> {
    return this.prisma.mediaFile.create({ data });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.mediaFile.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
