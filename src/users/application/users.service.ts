import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';

import { USER_ROLE } from '@lms/shared';
import type { UserRole } from '@lms/shared';

import { UserRepository } from '../infrastructure/user.repository';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { UserQueryDto } from './dto/user-query.dto';
import type { User } from '../domain/entities/user.entity';

/**
 * Service for user management operations.
 * Handles CRUD, role updates, activation/deactivation.
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly userRepository: UserRepository) {}

  async findPaginated(query: UserQueryDto) {
    return this.userRepository.findPaginated({
      role: query.role,
      area: query.area,
      isActive: query.isActive,
      search: query.search,
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async create(dto: CreateUserDto): Promise<User> {
    // Check for duplicate email
    const existingByEmail = await this.userRepository.findByEmail(dto.email);
    if (existingByEmail) {
      throw new ConflictException(
        `User with email ${dto.email} already exists`,
      );
    }

    const user = await this.userRepository.create({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role ?? 'colaborador',
      area: dto.area ?? '',
      cargo: dto.cargo ?? '',
      azureAdId: dto.azureAdId,
      isActive: true,
    });

    this.logger.log(`Created user: ${user.email}`);
    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    if (user.azureAdId) {
      if (
        dto.email !== undefined ||
        dto.firstName !== undefined ||
        dto.lastName !== undefined
      ) {
        throw new BadRequestException(
          'No se pueden modificar email, nombre o apellido de usuarios provisionados via Azure AD',
        );
      }
    }

    if (dto.email && dto.email !== user.email) {
      const existingByEmail = await this.userRepository.findByEmail(dto.email);
      if (existingByEmail) {
        throw new ConflictException(
          `User with email ${dto.email} already exists`,
        );
      }
    }

    const updated = await this.userRepository.update(id, {
      ...(dto.email !== undefined && { email: dto.email }),
      ...(dto.firstName !== undefined && { firstName: dto.firstName }),
      ...(dto.lastName !== undefined && { lastName: dto.lastName }),
      ...(dto.role !== undefined && { role: dto.role }),
      ...(dto.area !== undefined && { area: dto.area, areaOverridden: true }),
      ...(dto.cargo !== undefined && { cargo: dto.cargo, cargoOverridden: true }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    });

    if (!updated) {
      throw new NotFoundException(`User with id ${id} not found after update`);
    }

    this.logger.log(`Updated user: ${updated.email}`);
    return updated;
  }

  async updateRole(id: string, role: UserRole): Promise<User> {
    const user = await this.findById(id);

    if (role === USER_ROLE.COLABORADOR && !user.azureAdId) {
      throw new BadRequestException(
        'No se puede asignar rol colaborador a usuarios creados manualmente. Solo usuarios de Azure AD pueden ser colaboradores.',
      );
    }

    const updated = await this.userRepository.update(id, { role });
    if (!updated) {
      throw new NotFoundException(`User with id ${id} not found after update`);
    }

    this.logger.log(`Updated role for ${user.email}: ${user.role} → ${role}`);
    return updated;
  }

  async deactivate(id: string): Promise<User> {
    const user = await this.findById(id);

    const updated = await this.userRepository.update(id, { isActive: false });
    if (!updated) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    this.logger.log(`Deactivated user: ${user.email}`);
    return updated;
  }

  async reactivate(id: string): Promise<User> {
    const user = await this.findById(id);

    const updated = await this.userRepository.update(id, { isActive: true });
    if (!updated) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    this.logger.log(`Reactivated user: ${user.email}`);
    return updated;
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, { lastLoginAt: new Date() });
  }
}
