import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { ENROLLMENT_STATUS } from '@lms/shared';

import { CertificateService } from './certificate.service';
import { EnrollmentRepository } from '../infrastructure/enrollment.repository';
import { PDF_GENERATOR_PORT } from '../domain/ports/pdf-generator.port';
import type { PdfGeneratorPort } from '../domain/ports/pdf-generator.port';
import type { Enrollment } from '../domain/entities/enrollment.entity';

/* ------------------------------------------------------------------ */
/*  Mock factories                                                     */
/* ------------------------------------------------------------------ */

const createMockEnrollment = (
  overrides: Partial<Enrollment> = {},
): Enrollment =>
  ({
    id: 'enrollment-001',
    userId: 'user-001',
    courseId: 'course-001',
    status: ENROLLMENT_STATUS.COMPLETED,
    enrolledAt: new Date('2026-01-15'),
    completedAt: new Date('2026-02-20'),
    progressPercentage: 100,
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-02-20'),
    deletedAt: null,
    user: {
      id: 'user-001',
      firstName: 'Juan',
      lastName: 'Perez',
      cedula: '1234567890',
      area: 'Tecnologia',
      cargo: 'Desarrollador',
      email: 'juan@example.com',
    },
    course: {
      id: 'course-001',
      title: 'Curso de Prueba',
      estimatedDuration: 120,
      createdBy: {
        id: 'instructor-001',
        firstName: 'Maria',
        lastName: 'Garcia',
      },
    },
    ...overrides,
  }) as unknown as Enrollment;

/* ------------------------------------------------------------------ */
/*  Test suite                                                         */
/* ------------------------------------------------------------------ */

describe('CertificateService', () => {
  let service: CertificateService;
  let enrollmentRepo: jest.Mocked<EnrollmentRepository>;
  let pdfGenerator: jest.Mocked<PdfGeneratorPort>;

  beforeEach(async () => {
    enrollmentRepo = {
      findByIdWithCertificateData: jest.fn(),
    } as unknown as jest.Mocked<EnrollmentRepository>;

    pdfGenerator = {
      generatePdf: jest.fn().mockResolvedValue(Buffer.from('fake-pdf')),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificateService,
        { provide: EnrollmentRepository, useValue: enrollmentRepo },
        { provide: PDF_GENERATOR_PORT, useValue: pdfGenerator },
      ],
    }).compile();

    service = module.get(CertificateService);
  });

  it('should throw NotFoundException when enrollment does not exist', async () => {
    enrollmentRepo.findByIdWithCertificateData.mockResolvedValue(null);

    await expect(
      service.generateCertificate('non-existent'),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException when enrollment is not completed', async () => {
    enrollmentRepo.findByIdWithCertificateData.mockResolvedValue(
      createMockEnrollment({ status: ENROLLMENT_STATUS.ACTIVE }),
    );

    await expect(
      service.generateCertificate('enrollment-001'),
    ).rejects.toThrow(BadRequestException);
  });

  it('should generate certificate for completed enrollment', async () => {
    enrollmentRepo.findByIdWithCertificateData.mockResolvedValue(
      createMockEnrollment(),
    );

    const result = await service.generateCertificate('enrollment-001');

    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.fileName).toMatch(/^Certificado_.*\.pdf$/);
    expect(pdfGenerator.generatePdf).toHaveBeenCalledTimes(1);

    // Verify the HTML contains the student name and course title
    const htmlArg = pdfGenerator.generatePdf.mock.calls[0]![0]!;
    expect(htmlArg).toContain('Juan Perez');
    expect(htmlArg).toContain('Curso de Prueba');
    expect(htmlArg).toContain('Maria Garcia');
  });

  it('should handle enrollment without instructor gracefully', async () => {
    const enrollment = createMockEnrollment();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (enrollment.course as any).createdBy = undefined;
    enrollmentRepo.findByIdWithCertificateData.mockResolvedValue(enrollment);

    const result = await service.generateCertificate('enrollment-001');

    expect(result.buffer).toBeInstanceOf(Buffer);
    const htmlArg = pdfGenerator.generatePdf.mock.calls[0]![0]!;
    expect(htmlArg).toContain('Instructor');
  });
});
