import { Injectable, Logger, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

import { AnnouncementRepository } from '../infrastructure/announcement.repository';
import type { Announcement } from '../domain/entities/announcement.entity';
import type { CreateAnnouncementDto } from './dto/create-announcement.dto';
import type { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@Injectable()
export class AnnouncementsService {
  private readonly logger = new Logger(AnnouncementsService.name);

  constructor(
    private readonly announcementRepository: AnnouncementRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(
    courseId: string,
    authorId: string,
    dto: CreateAnnouncementDto,
  ): Promise<Announcement> {
    // Verify the user is the course instructor
    await this.verifyCourseOwnership(courseId, authorId);

    const announcement = await this.announcementRepository.create({
      courseId,
      authorId,
      title: dto.title,
      content: dto.content,
      publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : new Date(),
    });

    this.logger.log(
      `Announcement created: course=${courseId}, author=${authorId}, title="${dto.title}"`,
    );
    return announcement;
  }

  async findByCourse(courseId: string): Promise<Announcement[]> {
    return this.announcementRepository.findByCourse(courseId);
  }

  async update(
    announcementId: string,
    userId: string,
    dto: UpdateAnnouncementDto,
  ): Promise<Announcement> {
    const announcement = await this.announcementRepository.findById(announcementId);
    if (!announcement) {
      throw new NotFoundException('Anuncio no encontrado');
    }
    if (announcement.authorId !== userId) {
      throw new ForbiddenException('Solo el autor puede editar este anuncio');
    }

    if (dto.title !== undefined) announcement.title = dto.title;
    if (dto.content !== undefined) announcement.content = dto.content;
    if (dto.publishedAt !== undefined) {
      announcement.publishedAt = dto.publishedAt ? new Date(dto.publishedAt) : null;
    }

    return this.announcementRepository.save(announcement);
  }

  async remove(announcementId: string, userId: string): Promise<void> {
    const announcement = await this.announcementRepository.findById(announcementId);
    if (!announcement) {
      throw new NotFoundException('Anuncio no encontrado');
    }
    if (announcement.authorId !== userId) {
      throw new ForbiddenException('Solo el autor puede eliminar este anuncio');
    }

    await this.announcementRepository.softDelete(announcementId);
    this.logger.log(`Announcement deleted: id=${announcementId}`);
  }

  private async verifyCourseOwnership(courseId: string, userId: string): Promise<void> {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, deletedAt: null },
    });
    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }
    if (course.createdById !== userId) {
      throw new ForbiddenException('Solo el instructor del curso puede crear anuncios');
    }
  }
}
