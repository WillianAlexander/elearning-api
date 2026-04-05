import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Ports
import { EMAIL_SENDER_PORT } from './domain/ports/email-sender.port';

// Adapters
import { MockEmailSenderAdapter } from './infrastructure/mock-email-sender.adapter';
import { SmtpEmailSenderAdapter } from './infrastructure/smtp-email-sender.adapter';

// Repositories
import { NotificationRepository } from './infrastructure/notification.repository';
import { EmailCampaignRepository } from './infrastructure/email-campaign.repository';

// Services
import { NotificationsService } from './application/notifications.service';
import { BulkEmailService } from './application/bulk-email.service';

// Controllers
import { NotificationsController } from './presentation/notifications.controller';
import { BulkEmailController } from './presentation/bulk-email.controller';

// Auth module (for guards)
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [NotificationsController, BulkEmailController],
  providers: [
    // Repositories
    NotificationRepository,
    EmailCampaignRepository,

    // Port → Adapter (use SMTP if configured, otherwise mock)
    {
      provide: EMAIL_SENDER_PORT,
      useFactory: (configService: ConfigService) => {
        const smtpHost = configService.get<string>('SMTP_HOST');
        if (smtpHost) {
          return new SmtpEmailSenderAdapter(configService);
        }
        return new MockEmailSenderAdapter();
      },
      inject: [ConfigService],
    },

    // Services
    NotificationsService,
    BulkEmailService,
  ],
  exports: [NotificationsService, BulkEmailService, EMAIL_SENDER_PORT],
})
export class NotificationsModule {}
