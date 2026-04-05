import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ENROLLMENT_STATUS } from '@lms/shared';

import { EnrollmentRepository } from '../infrastructure/enrollment.repository';
import {
  PDF_GENERATOR_PORT,
  type PdfGeneratorPort,
} from '../domain/ports/pdf-generator.port';

interface CertificateResult {
  buffer: Buffer;
  fileName: string;
}

@Injectable()
export class CertificateService {
  constructor(
    private readonly enrollmentRepository: EnrollmentRepository,
    @Inject(PDF_GENERATOR_PORT)
    private readonly pdfGenerator: PdfGeneratorPort,
  ) {}

  async generateCertificate(enrollmentId: string): Promise<CertificateResult> {
    const enrollment =
      await this.enrollmentRepository.findByIdWithCertificateData(enrollmentId);

    if (!enrollment) {
      throw new NotFoundException('Inscripcion no encontrada');
    }

    if (enrollment.status !== ENROLLMENT_STATUS.COMPLETED) {
      throw new BadRequestException(
        'Solo se pueden generar certificados para cursos completados',
      );
    }

    const user = enrollment.user!;
    const course = enrollment.course!;
    const instructor = course.createdBy;

    const completedAt = enrollment.completedAt
      ? new Date(enrollment.completedAt).toLocaleDateString('es-EC', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '';

    const durationText = course.estimatedDuration
      ? `${course.estimatedDuration} minutos`
      : '';

    const html = this.renderTemplate({
      studentName: `${user.firstName} ${user.lastName}`,
      cedula: user.cedula ?? '',
      area: user.area,
      cargo: user.cargo,
      courseTitle: course.title,
      duration: durationText,
      completedAt,
      instructorName: instructor
        ? `${instructor.firstName} ${instructor.lastName}`
        : '',
    });

    const buffer = await this.pdfGenerator.generatePdf(html);

    const safeTitle = course.title
      .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);

    const fileName = `Certificado_${safeTitle}.pdf`;

    return { buffer, fileName };
  }

  private renderTemplate(data: {
    studentName: string;
    cedula: string;
    area: string;
    cargo: string;
    courseTitle: string;
    duration: string;
    completedAt: string;
    instructorName: string;
  }): string {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    @page { size: A4 landscape; margin: 0; }

    body {
      width: 297mm;
      height: 210mm;
      font-family: 'Georgia', 'Times New Roman', serif;
      color: #1a1a2e;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f0f0f0;
    }

    .certificate {
      width: 277mm;
      height: 190mm;
      background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
      border: 3px solid #1a365d;
      border-radius: 8px;
      padding: 20mm 25mm;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }

    .certificate::before {
      content: '';
      position: absolute;
      top: 4mm;
      left: 4mm;
      right: 4mm;
      bottom: 4mm;
      border: 1px solid #bee3f8;
      border-radius: 4px;
      pointer-events: none;
    }

    .org-name {
      font-size: 14pt;
      font-weight: bold;
      color: #2b6cb0;
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-bottom: 6mm;
    }

    .title {
      font-size: 28pt;
      font-weight: bold;
      color: #1a365d;
      margin-bottom: 8mm;
      letter-spacing: 2px;
    }

    .subtitle {
      font-size: 12pt;
      color: #4a5568;
      margin-bottom: 6mm;
    }

    .student-name {
      font-size: 24pt;
      font-weight: bold;
      color: #2d3748;
      margin-bottom: 3mm;
      border-bottom: 2px solid #2b6cb0;
      padding-bottom: 2mm;
      display: inline-block;
    }

    .student-info {
      font-size: 10pt;
      color: #718096;
      margin-bottom: 8mm;
    }

    .course-label {
      font-size: 11pt;
      color: #4a5568;
      margin-bottom: 2mm;
    }

    .course-title {
      font-size: 16pt;
      font-weight: bold;
      color: #1a365d;
      margin-bottom: 3mm;
    }

    .course-details {
      font-size: 10pt;
      color: #718096;
      margin-bottom: 10mm;
    }

    .footer {
      display: flex;
      justify-content: space-between;
      width: 100%;
      margin-top: auto;
      padding-top: 5mm;
    }

    .footer-item {
      text-align: center;
      font-size: 9pt;
      color: #4a5568;
    }

    .footer-item .label {
      border-top: 1px solid #a0aec0;
      padding-top: 2mm;
      margin-top: 8mm;
      min-width: 50mm;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="org-name">Cooperativa de Ahorro y Credito</div>
    <div class="title">Certificado de Finalizacion</div>
    <div class="subtitle">Se otorga el presente certificado a</div>
    <div class="student-name">${this.escapeHtml(data.studentName)}</div>
    <div class="student-info">
      ${data.cedula ? `C.I. ${this.escapeHtml(data.cedula)} &mdash; ` : ''}${this.escapeHtml(data.area)}${data.cargo ? ` &mdash; ${this.escapeHtml(data.cargo)}` : ''}
    </div>
    <div class="course-label">Por haber completado satisfactoriamente el curso</div>
    <div class="course-title">${this.escapeHtml(data.courseTitle)}</div>
    <div class="course-details">
      ${data.duration ? `Duracion: ${this.escapeHtml(data.duration)}` : ''}
      ${data.duration && data.completedAt ? ' &mdash; ' : ''}
      ${data.completedAt ? `Fecha de finalizacion: ${this.escapeHtml(data.completedAt)}` : ''}
    </div>
    <div class="footer">
      <div class="footer-item">
        <div class="label">${this.escapeHtml(data.instructorName || 'Instructor')}</div>
        <div>Instructor</div>
      </div>
      <div class="footer-item">
        <div class="label">Departamento de Talento Humano</div>
        <div>Coordinacion</div>
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
