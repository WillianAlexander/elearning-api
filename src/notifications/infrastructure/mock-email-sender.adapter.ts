import { Injectable, Logger } from '@nestjs/common';

import type {
  EmailSenderPort,
  EmailMessage,
} from '../domain/ports/email-sender.port';

/**
 * Mock adapter — logs emails to console in development.
 */
@Injectable()
export class MockEmailSenderAdapter implements EmailSenderPort {
  private readonly logger = new Logger(MockEmailSenderAdapter.name);

  async sendEmail(message: EmailMessage): Promise<void> {
    this.logger.log(
      `[MOCK] Email sent to=${message.to}, subject="${message.subject}"`,
    );
  }

  async sendBulk(
    messages: EmailMessage[],
  ): Promise<{ sent: number; failed: number }> {
    for (const msg of messages) {
      this.logger.log(
        `[MOCK] Bulk email to=${msg.to}, subject="${msg.subject}"`,
      );
    }
    return { sent: messages.length, failed: 0 };
  }
}
