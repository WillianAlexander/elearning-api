import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';

import { NotificationRepository } from '../infrastructure/notification.repository';
import type { Notification, NotificationType } from '../domain/entities/notification.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly notificationRepository: NotificationRepository) {}

  /**
   * Create a notification for a user.
   */
  async create(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, unknown>,
  ): Promise<Notification> {
    const notification = await this.notificationRepository.create({
      userId,
      type,
      title,
      message,
      data,
    });
    this.logger.log(
      `Notification created: user=${userId}, type=${type}, title="${title}"`,
    );
    return notification;
  }

  /**
   * Get paginated notifications for a user.
   */
  async findByUser(userId: string, page = 1, pageSize = 20) {
    return this.notificationRepository.findByUser(userId, page, pageSize);
  }

  /**
   * Get unread notification count for a user.
   */
  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.notificationRepository.getUnreadCount(userId);
    return { count };
  }

  /**
   * Mark a single notification as read.
   */
  async markAsRead(id: string, userId: string): Promise<void> {
    const notification = await this.notificationRepository.findById(id);
    if (!notification) {
      throw new NotFoundException('Notificación no encontrada');
    }
    if (notification.userId !== userId) {
      throw new ForbiddenException('No puedes marcar esta notificación como leída');
    }

    await this.notificationRepository.markAsRead(id);
    this.logger.log(`Notification marked as read: id=${id}`);
  }

  /**
   * Mark all notifications as read for a user.
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.markAllAsRead(userId);
    this.logger.log(`All notifications marked as read: user=${userId}`);
  }
}
