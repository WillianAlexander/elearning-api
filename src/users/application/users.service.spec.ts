import { Test } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { USER_ROLE } from '@lms/shared';

import type { TestingModule } from '@nestjs/testing';

import { UsersService } from './users.service';
import { UserRepository } from '../infrastructure/user.repository';
import { User } from '../domain/entities/user.entity';

import type { CreateUserDto } from './dto/create-user.dto';

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
  user.lastLoginAt = null;
  user.azureAdId = null;
  Object.assign(user, overrides);
  return user;
};

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: jest.Mocked<UserRepository>;

  beforeEach(async () => {
    userRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByAzureAdId: jest.fn(),
      findPaginated: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
      findAllActive: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UserRepository,
          useValue: userRepo,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findById', () => {
    it('should return a user when found', async () => {
      const mockUser = createMockUser();
      userRepo.findById.mockResolvedValue(mockUser);

      const result = await service.findById('user-uuid-001');

      expect(result).toEqual(mockUser);
      expect(userRepo.findById).toHaveBeenCalledWith('user-uuid-001');
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepo.findById.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const dto: CreateUserDto = {
        email: 'jperez@cooperativa.com',
        firstName: 'Juan',
        lastName: 'Perez',
      };

      userRepo.findByEmail.mockResolvedValue(null);
      const createdUser = createMockUser();
      userRepo.create.mockResolvedValue(createdUser);

      const result = await service.create(dto);

      expect(result).toEqual(createdUser);
      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'jperez@cooperativa.com',
          firstName: 'Juan',
          lastName: 'Perez',
          role: 'colaborador',
          isActive: true,
        }),
      );
    });

    it('should throw ConflictException when email already exists', async () => {
      const dto: CreateUserDto = {
        email: 'jperez@cooperativa.com',
        firstName: 'New',
        lastName: 'User',
      };

      userRepo.findByEmail.mockResolvedValue(createMockUser());

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      const existing = createMockUser();
      const updated = createMockUser({ area: 'TI', cargo: 'Desarrollador' });

      userRepo.findById.mockResolvedValue(existing);
      userRepo.update.mockResolvedValue(updated);

      const result = await service.update('user-uuid-001', {
        area: 'TI',
        cargo: 'Desarrollador',
      });

      expect(result.area).toBe('TI');
      expect(result.cargo).toBe('Desarrollador');
    });

    it('should set areaOverridden and cargoOverridden when area or cargo is provided', async () => {
      const existing = createMockUser();
      const updated = createMockUser({ area: 'TI', cargo: 'Desarrollador' });

      userRepo.findById.mockResolvedValue(existing);
      userRepo.update.mockResolvedValue(updated);

      await service.update('user-uuid-001', { area: 'TI', cargo: 'Desarrollador' });

      expect(userRepo.update).toHaveBeenCalledWith(
        'user-uuid-001',
        expect.objectContaining({
          area: 'TI',
          areaOverridden: true,
          cargo: 'Desarrollador',
          cargoOverridden: true,
        }),
      );
    });

    it('should throw ConflictException when updating email to existing one', async () => {
      const existing = createMockUser();
      const anotherUser = createMockUser({
        id: 'user-uuid-002',
        email: 'other@cooperativa.com',
      });

      userRepo.findById.mockResolvedValue(existing);
      userRepo.findByEmail.mockResolvedValue(anotherUser);

      await expect(
        service.update('user-uuid-001', { email: 'other@cooperativa.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException when trying to update email of an Azure AD user', async () => {
      const azureUser = createMockUser({ azureAdId: 'azure-oid-001' });

      userRepo.findById.mockResolvedValue(azureUser);

      await expect(
        service.update('user-uuid-001', { email: 'new@cooperativa.com' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when trying to update firstName of an Azure AD user', async () => {
      const azureUser = createMockUser({ azureAdId: 'azure-oid-001' });

      userRepo.findById.mockResolvedValue(azureUser);

      await expect(
        service.update('user-uuid-001', { firstName: 'OtroNombre' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when trying to update lastName of an Azure AD user', async () => {
      const azureUser = createMockUser({ azureAdId: 'azure-oid-001' });

      userRepo.findById.mockResolvedValue(azureUser);

      await expect(
        service.update('user-uuid-001', { lastName: 'OtroApellido' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow updating area and cargo for an Azure AD user', async () => {
      const azureUser = createMockUser({ azureAdId: 'azure-oid-001' });
      const updated = createMockUser({
        azureAdId: 'azure-oid-001',
        area: 'TI',
        cargo: 'Desarrollador',
      });

      userRepo.findById.mockResolvedValue(azureUser);
      userRepo.update.mockResolvedValue(updated);

      const result = await service.update('user-uuid-001', {
        area: 'TI',
        cargo: 'Desarrollador',
      });

      expect(result.area).toBe('TI');
      expect(result.cargo).toBe('Desarrollador');
    });
  });

  describe('updateRole', () => {
    it('should update user role to instructor', async () => {
      const existing = createMockUser();
      const updated = createMockUser({ role: USER_ROLE.INSTRUCTOR });

      userRepo.findById.mockResolvedValue(existing);
      userRepo.update.mockResolvedValue(updated);

      const result = await service.updateRole(
        'user-uuid-001',
        USER_ROLE.INSTRUCTOR,
      );

      expect(result.role).toBe(USER_ROLE.INSTRUCTOR);
    });

    it('should throw BadRequestException when assigning colaborador role to a non-Azure AD user', async () => {
      const manualUser = createMockUser({ azureAdId: null });

      userRepo.findById.mockResolvedValue(manualUser);

      await expect(
        service.updateRole('user-uuid-001', USER_ROLE.COLABORADOR),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow assigning colaborador role to an Azure AD user', async () => {
      const azureUser = createMockUser({
        azureAdId: 'azure-oid-001',
        role: USER_ROLE.INSTRUCTOR,
      });
      const updated = createMockUser({
        azureAdId: 'azure-oid-001',
        role: USER_ROLE.COLABORADOR,
      });

      userRepo.findById.mockResolvedValue(azureUser);
      userRepo.update.mockResolvedValue(updated);

      const result = await service.updateRole('user-uuid-001', USER_ROLE.COLABORADOR);

      expect(result.role).toBe(USER_ROLE.COLABORADOR);
    });
  });

  describe('deactivate', () => {
    it('should deactivate a user', async () => {
      const existing = createMockUser();
      const deactivated = createMockUser({ isActive: false });

      userRepo.findById.mockResolvedValue(existing);
      userRepo.update.mockResolvedValue(deactivated);

      const result = await service.deactivate('user-uuid-001');

      expect(result.isActive).toBe(false);
    });
  });

  describe('reactivate', () => {
    it('should reactivate a user', async () => {
      const existing = createMockUser({ isActive: false });
      const reactivated = createMockUser({ isActive: true });

      userRepo.findById.mockResolvedValue(existing);
      userRepo.update.mockResolvedValue(reactivated);

      const result = await service.reactivate('user-uuid-001');

      expect(result.isActive).toBe(true);
      expect(userRepo.update).toHaveBeenCalledWith('user-uuid-001', {
        isActive: true,
      });
    });
  });

  describe('findPaginated', () => {
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

      userRepo.findPaginated.mockResolvedValue(mockResult);

      const result = await service.findPaginated({ page: 1, pageSize: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.totalItems).toBe(1);
    });

    it('should pass filter parameters to repository', async () => {
      const mockResult = {
        items: [],
        totalItems: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      };

      userRepo.findPaginated.mockResolvedValue(mockResult);

      await service.findPaginated({
        page: 1,
        pageSize: 10,
        role: USER_ROLE.INSTRUCTOR,
        area: 'TI',
        isActive: true,
        search: 'juan',
      });

      expect(userRepo.findPaginated).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
        role: USER_ROLE.INSTRUCTOR,
        area: 'TI',
        isActive: true,
        search: 'juan',
      });
    });
  });
});
