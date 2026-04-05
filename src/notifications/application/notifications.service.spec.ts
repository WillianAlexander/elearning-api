import { Test } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

import type { TestingModule } from '@nestjs/testing';

import { NotificationsService } from './notifications.service';
import { NotificationRepository } from '../infrastructure/notification.repository';

import type { Notification, NotificationType } from '../domain/entities/notification.entity';

const createMockNotification = (
  overrides: Partial<Notification> = {},
): Notification =>
  ({
    id: 'notif-001',
    userId: 'user-001',
    type: 'system' as NotificationType,
    title: 'Test Notification',
    message: 'This is a test notification',
    data: null,
    readAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  }) as Notification;

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationRepository: jest.Mocked<NotificationRepository>;

  beforeEach(async () => {
    notificationRepository = {
      create: jest.fn(),
      findByUser: jest.fn(),
      findById: jest.fn(),
      getUnreadCount: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
    } as unknown as jest.Mocked<NotificationRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: NotificationRepository,
          useValue: notificationRepository,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should create notification', async () => {
      const notification = createMockNotification();
      notificationRepository.create.mockResolvedValue(notification);

      const result = await service.create(
        'user-001',
        'system',
        'Test Notification',
        'This is a test notification',
      );

      expect(result).toEqual(notification);
      expect(notificationRepository.create).toHaveBeenCalledWith({
        userId: 'user-001',
        type: 'system',
        title: 'Test Notification',
        message: 'This is a test notification',
        data: undefined,
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread notifications', async () => {
      notificationRepository.getUnreadCount.mockResolvedValue(5);

      const result = await service.getUnreadCount('user-001');

      expect(result).toEqual({ count: 5 });
      expect(notificationRepository.getUnreadCount).toHaveBeenCalledWith('user-001');
    });
  });

  describe('markAsRead', () => {
    it('should set readAt on notification', async () => {
      const notification = createMockNotification();
      notificationRepository.findById.mockResolvedValue(notification);
      notificationRepository.markAsRead.mockResolvedValue(undefined);

      await service.markAsRead('notif-001', 'user-001');

      expect(notificationRepository.markAsRead).toHaveBeenCalledWith('notif-001');
    });

    it('should throw NotFoundException if notification not found', async () => {
      notificationRepository.findById.mockResolvedValue(null);

      await expect(service.markAsRead('notif-999', 'user-001')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if not owner', async () => {
      const notification = createMockNotification({ userId: 'other-user' });
      notificationRepository.findById.mockResolvedValue(notification);

      await expect(service.markAsRead('notif-001', 'user-001')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all user notifications as read', async () => {
      notificationRepository.markAllAsRead.mockResolvedValue(undefined);

      await service.markAllAsRead('user-001');

      expect(notificationRepository.markAllAsRead).toHaveBeenCalledWith('user-001');
    });
  });
});
