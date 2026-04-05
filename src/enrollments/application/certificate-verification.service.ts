import { Injectable, Logger } from '@nestjs/common';

import { EnrollmentRepository } from '../infrastructure/enrollment.repository';

interface CertificateVerificationResult {
  valid: boolean;
  userName: string;
  courseTitle: string;
  completedAt: Date | null;
  verificationCode: string;
}

@Injectable()
export class CertificateVerificationService {
  private readonly logger = new Logger(CertificateVerificationService.name);

  constructor(private readonly enrollmentRepository: EnrollmentRepository) {}

  async verify(code: string): Promise<CertificateVerificationResult | null> {
    const enrollment = await this.enrollmentRepository.findByVerificationCode(code);

    if (!enrollment) {
      this.logger.warn(`Certificate verification failed: code=${code}`);
      return null;
    }

    const userName = enrollment.user
      ? `${enrollment.user.firstName} ${enrollment.user.lastName}`
      : 'N/A';

    const courseTitle = enrollment.course?.title ?? 'N/A';

    this.logger.log(
      `Certificate verified: code=${code}, user="${userName}", course="${courseTitle}"`,
    );

    return {
      valid: true,
      userName,
      courseTitle,
      completedAt: enrollment.completedAt ?? null,
      verificationCode: code,
    };
  }
}
