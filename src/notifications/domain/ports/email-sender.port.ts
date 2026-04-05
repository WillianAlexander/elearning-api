/**
 * Port for email sending — follows hexagonal architecture.
 * Adapters: MockEmailSenderAdapter (dev), SmtpEmailSenderAdapter (production).
 */

export const EMAIL_SENDER_PORT = Symbol('EMAIL_SENDER_PORT');

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

export interface EmailSenderPort {
  sendEmail(message: EmailMessage): Promise<void>;
  sendBulk(messages: EmailMessage[]): Promise<{ sent: number; failed: number }>;
}
