import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

import type { UserRole } from '@lms/shared';
import { Prisma } from '@prisma/client';

interface UserFilterOptions {
  role?: UserRole;
  area?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

interface PaginatedUsers {
  items: any[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Custom repository for User entity.
 * Encapsulates complex query logic using Prisma.
 */
@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<any | null> {
    return this.prisma.user.findFirst({ where: { id, deletedAt: null } });
  }

  async findByEmail(email: string): Promise<any | null> {
    return this.prisma.user.findFirst({ where: { email, deletedAt: null } });
  }

  async findByAzureAdId(azureAdId: string): Promise<any | null> {
    return this.prisma.user.findFirst({ where: { azureAdId, deletedAt: null } });
  }

  async findPaginated(options: UserFilterOptions): Promise<PaginatedUsers> {
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    };

    if (options.role) {
      where.role = options.role;
    }

    if (options.area) {
      where.area = options.area;
    }

    if (options.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    if (options.search) {
      where.OR = [
        { firstName: { contains: options.search, mode: 'insensitive' } },
        { lastName: { contains: options.search, mode: 'insensitive' } },
        { email: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        skip,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
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

  async create(data: Prisma.UserCreateInput): Promise<any> {
    return this.prisma.user.create({ data });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<any | null> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async save(user: any): Promise<any> {
    return this.prisma.user.update({
      where: { id: user.id },
      data: user,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findAllActive(): Promise<any[]> {
    return this.prisma.user.findMany({
      where: { isActive: true, deletedAt: null },
    });
  }
}
