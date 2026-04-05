import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

import type {
  EmailSenderPort,
  EmailMessage,
} from '../domain/ports/email-sender.port';

/**
 * SMTP adapter — sends real emails via nodemailer.
 */
@Injectable()
export class SmtpEmailSenderAdapter implements EmailSenderPort {
  private readonly logger = new Logger(SmtpEmailSenderAdapter.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: false,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
    this.from =
      this.configService.get<string>('SMTP_FROM') ??
      'LMS Capacitacion <noreply@lms.coacgualaquiza.fin.ec>';
  }

  async sendEmail(message: EmailMessage): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: message.to,
      subject: message.subject,
      html: message.body,
    });
    this.logger.log(`Email sent to=${message.to}, subject="${message.subject}"`);
  }

  async sendBulk(
    messages: EmailMessage[],
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const msg of messages) {
      try {
        await this.sendEmail(msg);
        sent++;
      } catch (error) {
        failed++;
        this.logger.error(
          `Failed to send email to=${msg.to}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return { sent, failed };
  }
}
