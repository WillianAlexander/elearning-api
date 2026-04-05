import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

interface EnrollmentFilterOptions {
  userId?: string;
  courseId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

interface PaginatedEnrollments {
  items: any[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

@Injectable()
export class EnrollmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<any | null> {
    return this.prisma.enrollment.findFirst({
      where: { id, deletedAt: null },
      include: { course: true, user: true },
    });
  }

  async findByUserAndCourse(userId: string, courseId: string): Promise<any | null> {
    return this.prisma.enrollment.findFirst({
      where: { userId, courseId, deletedAt: null },
    });
  }

  async findActiveByUserAndCourse(userId: string, courseId: string): Promise<any | null> {
    return this.prisma.enrollment.findFirst({
      where: { userId, courseId, status: 'active', deletedAt: null },
    });
  }

  async findByUser(userId: string, status?: string): Promise<any[]> {
    const where: any = { userId, deletedAt: null };
    if (status) {
      where.status = status;
    }
    return this.prisma.enrollment.findMany({
      where,
      include: { course: true },
      orderBy: { enrolledAt: 'desc' },
    });
  }

  async findPaginated(options: EnrollmentFilterOptions): Promise<PaginatedEnrollments> {
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: any = { deletedAt: null };
    if (options.userId) where.userId = options.userId;
    if (options.courseId) where.courseId = options.courseId;
    if (options.status) where.status = options.status;

    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.enrollment.findMany({
        where,
        include: { course: true, user: true },
        orderBy: { enrolledAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.enrollment.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / pageSize);

    return {
      items,
      totalItems,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async create(data: any): Promise<any> {
    return this.prisma.enrollment.create({ data });
  }

  async save(enrollment: any): Promise<any> {
    return this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: enrollment,
    });
  }

  async findByIdWithCertificateData(id: string): Promise<any | null> {
    return this.prisma.enrollment.findFirst({
      where: { id, deletedAt: null },
      include: { user: true, course: { include: { createdBy: true } } },
    });
  }

  async findByVerificationCode(code: string): Promise<any | null> {
    return this.prisma.enrollment.findFirst({
      where: { verificationCode: code, deletedAt: null },
      include: { user: true, course: true },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.enrollment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Execute a callback within a database transaction.
   */
  async transaction<T>(callback: (tx: PrismaService) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(callback);
  }
}
