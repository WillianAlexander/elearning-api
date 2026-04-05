import { Test } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';

import type { TestingModule } from '@nestjs/testing';

import { BulkEmailService } from './bulk-email.service';
import { EMAIL_SENDER_PORT } from '../domain/ports/email-sender.port';
import { EmailCampaignRepository } from '../infrastructure/email-campaign.repository';
import { Course } from '../../courses/domain/entities/course.entity';
import { Enrollment } from '../../enrollments/domain/entities/enrollment.entity';

import type { EmailSenderPort } from '../domain/ports/email-sender.port';
import type { EmailCampaign } from '../domain/entities/email-campaign.entity';

const createMockCampaign = (overrides: Partial<EmailCampaign> = {}): EmailCampaign =>
  ({
    id: 'campaign-001',
    courseId: 'course-001',
    subject: 'Test Subject',
    body: 'Test Body',
    sentBy: 'user-001',
    recipientCount: 2,
    failedCount: 0,
    sentAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  }) as EmailCampaign;

describe('BulkEmailService', () => {
  let service: BulkEmailService;
  let emailSender: jest.Mocked<EmailSenderPort>;
  let campaignRepository: jest.Mocked<EmailCampaignRepository>;
  let courseRepository: {
    findOne: jest.Mock;
  };
  let enrollmentRepository: {
    find: jest.Mock;
  };

  beforeEach(async () => {
    emailSender = {
      sendEmail: jest.fn(),
      sendBulk: jest.fn(),
    } as jest.Mocked<EmailSenderPort>;

    campaignRepository = {
      create: jest.fn(),
      findByCourse: jest.fn(),
    } as unknown as jest.Mocked<EmailCampaignRepository>;

    courseRepository = {
      findOne: jest.fn(),
    };

    enrollmentRepository = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BulkEmailService,
        {
          provide: EMAIL_SENDER_PORT,
          useValue: emailSender,
        },
        {
          provide: EmailCampaignRepository,
          useValue: campaignRepository,
        },
        {
          provide: getRepositoryToken(Course),
          useValue: courseRepository,
        },
        {
          provide: getRepositoryToken(Enrollment),
          useValue: enrollmentRepository,
        },
      ],
    }).compile();

    service = module.get<BulkEmailService>(BulkEmailService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('sendBulkEmail', () => {
    it('should send emails to all enrolled users', async () => {
      const campaign = createMockCampaign();

      courseRepository.findOne.mockResolvedValue({
        id: 'course-001',
        createdById: 'user-001',
      });

      // Active enrollments
      enrollmentRepository.find
        .mockResolvedValueOnce([
          { id: 'enr-001', user: { email: 'student1@test.com' } },
          { id: 'enr-002', user: { email: 'student2@test.com' } },
        ])
        // Completed enrollments
        .mockResolvedValueOnce([
          { id: 'enr-003', user: { email: 'student3@test.com' } },
        ]);

      emailSender.sendBulk.mockResolvedValue({ sent: 3, failed: 0 });
      campaignRepository.create.mockResolvedValue(campaign);

      const result = await service.sendBulkEmail('course-001', 'user-001', {
        subject: 'Test Subject',
        body: 'Test Body',
      });

      expect(result).toEqual(campaign);
      expect(emailSender.sendBulk).toHaveBeenCalledWith([
        { to: 'student1@test.com', subject: 'Test Subject', body: 'Test Body' },
        { to: 'student2@test.com', subject: 'Test Subject', body: 'Test Body' },
        { to: 'student3@test.com', subject: 'Test Subject', body: 'Test Body' },
      ]);
    });

    it('should create email campaign record', async () => {
      courseRepository.findOne.mockResolvedValue({
        id: 'course-001',
        createdById: 'user-001',
      });

      enrollmentRepository.find
        .mockResolvedValueOnce([{ id: 'enr-001', user: { email: 'student1@test.com' } }])
        .mockResolvedValueOnce([]);

      emailSender.sendBulk.mockResolvedValue({ sent: 1, failed: 0 });
      campaignRepository.create.mockResolvedValue(createMockCampaign());

      await service.sendBulkEmail('course-001', 'user-001', {
        subject: 'Subject',
        body: 'Body',
      });

      expect(campaignRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          courseId: 'course-001',
          subject: 'Subject',
          body: 'Body',
          sentBy: 'user-001',
          recipientCount: 1,
          failedCount: 0,
        }),
      );
    });

    it('should throw NotFoundException if course does not exist', async () => {
      courseRepository.findOne.mockResolvedValue(null);

      await expect(
        service.sendBulkEmail('course-999', 'user-001', {
          subject: 'Subject',
          body: 'Body',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not course instructor', async () => {
      courseRepository.findOne.mockResolvedValue({
        id: 'course-001',
        createdById: 'other-user',
      });

      await expect(
        service.sendBulkEmail('course-001', 'user-001', {
          subject: 'Subject',
          body: 'Body',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
