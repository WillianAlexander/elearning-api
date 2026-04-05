import { Injectable, Logger, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import sanitizeHtml from 'sanitize-html';

import { ENROLLMENT_STATUS } from '@lms/shared';

import { EMAIL_SENDER_PORT } from '../domain/ports/email-sender.port';
import type { EmailSenderPort } from '../domain/ports/email-sender.port';
import { EmailCampaignRepository } from '../infrastructure/email-campaign.repository';
import type { EmailCampaign } from '../domain/entities/email-campaign.entity';
import type { SendBulkEmailDto } from './dto/send-bulk-email.dto';

@Injectable()
export class BulkEmailService {
  private readonly logger = new Logger(BulkEmailService.name);

  constructor(
    @Inject(EMAIL_SENDER_PORT)
    private readonly emailSender: EmailSenderPort,
    private readonly campaignRepository: EmailCampaignRepository,
    private readonly prisma: PrismaService,
  ) {}

  async sendBulkEmail(
    courseId: string,
    userId: string,
    dto: SendBulkEmailDto,
  ): Promise<EmailCampaign> {
    // Verify course exists and user is instructor
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, deletedAt: null },
    });
    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }
    if (course.createdById !== userId) {
      throw new ForbiddenException('Solo el instructor del curso puede enviar emails masivos');
    }

    // Get all active and completed enrollments with user relations
    const activeEnrollments = await this.prisma.enrollment.findMany({
      where: { courseId, status: ENROLLMENT_STATUS.ACTIVE, deletedAt: null },
      include: { user: { where: { deletedAt: null } } },
    });

    const completedEnrollments = await this.prisma.enrollment.findMany({
      where: { courseId, status: ENROLLMENT_STATUS.COMPLETED, deletedAt: null },
      include: { user: { where: { deletedAt: null } } },
    });

    const allEnrollments = [...activeEnrollments, ...completedEnrollments];

    // Sanitize HTML body — prevent phishing forms and script injection
    const safeBody = sanitizeHtml(dto.body, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        img: ['src', 'alt', 'width', 'height'],
      },
      disallowedTagsMode: 'discard',
    });

    // Build email messages
    const messages = allEnrollments
      .filter((e) => e.user?.email)
      .map((enrollment) => ({
        to: enrollment.user!.email,
        subject: dto.subject,
        body: safeBody,
      }));

    // Send emails
    const result = await this.emailSender.sendBulk(messages);

    // Save campaign record
    const campaign = await this.campaignRepository.create({
      courseId,
      subject: dto.subject,
      body: dto.body,
      sentBy: userId,
      recipientCount: result.sent,
      failedCount: result.failed,
      sentAt: new Date(),
    });

    this.logger.log(
      `Bulk email sent: course=${courseId}, sent=${result.sent}, failed=${result.failed}`,
    );

    return campaign;
  }

  async getCampaignHistory(courseId: string): Promise<EmailCampaign[]> {
    return this.campaignRepository.findByCourse(courseId);
  }
}
