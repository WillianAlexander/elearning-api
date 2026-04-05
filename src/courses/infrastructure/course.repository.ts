import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

interface CourseFilterOptions {
  status?: string;
  categoryId?: string;
  instructorId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

interface PaginatedCourses {
  items: any[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Custom repository for Course entity.
 * Encapsulates complex query logic using Prisma.
 */
@Injectable()
export class CourseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<any | null> {
    return this.prisma.course.findFirst({
      where: { id, deletedAt: null },
      include: {
        modules: {
          where: { deletedAt: null },
          include: {
            lessons: {
              where: { deletedAt: null },
              include: { blocks: true },
              orderBy: { orderIndex: 'asc' },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
        category: true,
        tags: true,
        createdBy: true,
      },
    });
  }

  async findBySlug(slug: string): Promise<any | null> {
    return this.prisma.course.findFirst({ where: { slug, deletedAt: null } });
  }

  async findPaginated(options: CourseFilterOptions): Promise<PaginatedCourses> {
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: any = {
      deletedAt: null,
    };

    if (options.status) {
      where.status = options.status;
    }

    if (options.categoryId) {
      where.categoryId = options.categoryId;
    }

    if (options.instructorId) {
      where.createdById = options.instructorId;
    }

    if (options.search) {
      where.OR = [
        { title: { contains: options.search, mode: 'insensitive' } },
        { description: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        where,
        include: {
          category: true,
          tags: true,
          createdBy: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.course.count({ where }),
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
    const { tags, ...courseData } = data;
    const course = await this.prisma.course.create({
      data: {
        ...courseData,
        ...(tags &&
          tags.length > 0 && {
            tags: {
              connect: tags.map((t: any) => ({ id: t.id })),
            },
          }),
      },
      include: { tags: true, category: true },
    });
    return course;
  }

  async update(id: string, data: any): Promise<any | null> {
    return this.prisma.course.update({
      where: { id },
      data,
    });
  }

  async save(course: any): Promise<any> {
    return this.prisma.course.update({
      where: { id: course.id },
      data: course,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.course.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
