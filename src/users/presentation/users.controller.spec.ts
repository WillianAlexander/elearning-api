import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { USER_ROLE } from '@lms/shared';

import type { TestingModule } from '@nestjs/testing';

import { UsersController } from './users.controller';
import { UsersService } from '../application/users.service';
import { User } from '../domain/entities/user.entity';
import { AuthService } from '../../auth/application/auth.service';

const createMockUser = (overrides: Partial<User> = {}): User => {
  const user = new User();
  user.id = 'user-uuid-001';
  user.cedula = '0102030405';
  user.email = 'jperez@cooperativa.com';
  user.firstName = 'Juan';
  user.lastName = 'Perez';
  user.role = USER_ROLE.COLABORADOR;
  user.area = 'Operaciones';
  user.cargo = 'Cajero';
  user.isActive = true;
  Object.assign(user, overrides);
  return user;
};

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    usersService = {
      findPaginated: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateRole: jest.fn(),
      deactivate: jest.fn(),
      reactivate: jest.fn(),
      findByEmail: jest.fn(),
      updateLastLogin: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: usersService },
        {
          provide: AuthService,
          useValue: { validateTokenAndGetUser: jest.fn() },
        },
        {
          provide: JwtService,
          useValue: { verify: jest.fn(), sign: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const mockResult = {
        items: [createMockUser()],
        totalItems: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };

      usersService.findPaginated.mockResolvedValue(mockResult);

      const result = await controller.findAll({ page: 1, pageSize: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.totalItems).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a user by ID', async () => {
      const mockUser = createMockUser();
      usersService.findById.mockResolvedValue(mockUser);

      const result = await controller.findOne('user-uuid-001');

      expect(result.email).toBe('jperez@cooperativa.com');
    });

    it('should throw NotFoundException for non-existent user', async () => {
      usersService.findById.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updated = createMockUser({ area: 'TI' });
      usersService.update.mockResolvedValue(updated);

      const result = await controller.update('user-uuid-001', { area: 'TI' });

      expect(result.area).toBe('TI');
    });
  });

  describe('updateRole', () => {
    it('should update user role', async () => {
      const updated = createMockUser({ role: USER_ROLE.INSTRUCTOR });
      usersService.updateRole.mockResolvedValue(updated);

      const result = await controller.updateRole('user-uuid-001', {
        role: USER_ROLE.INSTRUCTOR,
      });

      expect(result.role).toBe(USER_ROLE.INSTRUCTOR);
    });
  });

  describe('create', () => {
    it('should create a user with admin-allowed role', async () => {
      const created = createMockUser({ role: USER_ROLE.INSTRUCTOR });
      usersService.create.mockResolvedValue(created);

      const result = await controller.create({
        email: 'nuevo@cooperativa.com',
        firstName: 'Nuevo',
        lastName: 'Usuario',
        role: USER_ROLE.INSTRUCTOR,
      });

      expect(result.role).toBe(USER_ROLE.INSTRUCTOR);
      expect(usersService.create).toHaveBeenCalledWith({
        email: 'nuevo@cooperativa.com',
        firstName: 'Nuevo',
        lastName: 'Usuario',
        role: USER_ROLE.INSTRUCTOR,
      });
    });
  });

  describe('deactivate', () => {
    it('should deactivate a user', async () => {
      const deactivated = createMockUser({ isActive: false });
      usersService.deactivate.mockResolvedValue(deactivated);

      const result = await controller.deactivate('user-uuid-001');

      expect(result.isActive).toBe(false);
    });
  });

  describe('reactivate', () => {
    it('should reactivate a user', async () => {
      const reactivated = createMockUser({ isActive: true });
      usersService.reactivate.mockResolvedValue(reactivated);

      const result = await controller.reactivate('user-uuid-001');

      expect(result.isActive).toBe(true);
    });
  });
});
