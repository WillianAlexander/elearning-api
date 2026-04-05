import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { CertificateVerificationService } from '../application/certificate-verification.service';

/**
 * Public controller — NO auth required.
 * Allows anyone with a verification code to validate a certificate.
 */
@ApiTags('Certificate Verification')
@Controller('certificates/verify')
export class CertificateVerifyController {
  constructor(
    private readonly certVerifyService: CertificateVerificationService,
  ) {}

  @Get(':code')
  @ApiOperation({ summary: 'Verify a certificate by verification code (public, no auth)' })
  async verify(@Param('code', ParseUUIDPipe) code: string) {
    const result = await this.certVerifyService.verify(code);
    if (!result) {
      throw new NotFoundException('Código de verificación no válido');
    }
    return result;
  }
}
