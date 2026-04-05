import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { USER_ROLE } from '@lms/shared';

import type { TestingModule } from '@nestjs/testing';

import { RbacService } from './rbac.service';
import { Permission } from '../domain/entities/permission.entity';
import { RolePermission } from '../domain/entities/role-permission.entity';

describe('RbacService', () => {
  let service: RbacService;
  let permissionRepository: {
    createQueryBuilder: jest.Mock;
  };
  let rolePermissionRepository: {
    find: jest.Mock;
  };

  const mockPermissions: Permission[] = [
    {
      id: 'perm-1',
      name: 'courses:create',
      description: 'Create courses',
      module: 'courses',
      action: 'create',
    },
    {
      id: 'perm-2',
      name: 'courses:edit',
      description: 'Edit courses',
      module: 'courses',
      action: 'edit',
    },
    {
      id: 'perm-3',
      name: 'users:manage',
      description: 'Manage users',
      module: 'users',
      action: 'manage',
    },
  ];

  beforeEach(async () => {
    const queryBuilderMock = {
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(mockPermissions),
    };

    permissionRepository = {
      createQueryBuilder: jest.fn(() => queryBuilderMock),
    };

    rolePermissionRepository = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RbacService,
        {
          provide: getRepositoryToken(Permission),
          useValue: permissionRepository,
        },
        {
          provide: getRepositoryToken(RolePermission),
          useValue: rolePermissionRepository,
        },
      ],
    }).compile();

    service = module.get<RbacService>(RbacService);
  });

  describe('hasPermission', () => {
    it('should return true when role has the permission', async () => {
      rolePermissionRepository.find.mockResolvedValue([
        { id: 'rp-1', role: USER_ROLE.ADMINISTRADOR, permissionId: 'perm-1' },
        { id: 'rp-2', role: USER_ROLE.ADMINISTRADOR, permissionId: 'perm-2' },
        { id: 'rp-3', role: USER_ROLE.ADMINISTRADOR, permissionId: 'perm-3' },
      ]);

      const result = await service.hasPermission(
        USER_ROLE.ADMINISTRADOR,
        'courses:create',
      );

      expect(result).toBe(true);
    });

    it('should return false when role does not have the permission', async () => {
      rolePermissionRepository.find.mockResolvedValue([
        { id: 'rp-1', role: USER_ROLE.COLABORADOR, permissionId: 'perm-1' },
      ]);

      const queryBuilderMock = {
        where: jest.fn().mockReturnThis(),
        getMany: jest
          .fn()
          .mockResolvedValue([mockPermissions[0]]),
      };
      permissionRepository.createQueryBuilder.mockReturnValue(queryBuilderMock);

      const result = await service.hasPermission(
        USER_ROLE.COLABORADOR,
        'users:manage',
      );

      expect(result).toBe(false);
    });

    it('should return false when role has no permissions', async () => {
      rolePermissionRepository.find.mockResolvedValue([]);

      const result = await service.hasPermission(
        USER_ROLE.COLABORADOR,
        'courses:create',
      );

      expect(result).toBe(false);
    });
  });

  describe('hasPermissions', () => {
    it('should return true when role has all required permissions', async () => {
      rolePermissionRepository.find.mockResolvedValue([
        { id: 'rp-1', role: USER_ROLE.ADMINISTRADOR, permissionId: 'perm-1' },
        { id: 'rp-2', role: USER_ROLE.ADMINISTRADOR, permissionId: 'perm-2' },
        { id: 'rp-3', role: USER_ROLE.ADMINISTRADOR, permissionId: 'perm-3' },
      ]);

      const result = await service.hasPermissions(USER_ROLE.ADMINISTRADOR, [
        'courses:create',
        'courses:edit',
      ]);

      expect(result).toBe(true);
    });

    it('should return false when role is missing one required permission', async () => {
      rolePermissionRepository.find.mockResolvedValue([
        { id: 'rp-1', role: USER_ROLE.INSTRUCTOR, permissionId: 'perm-1' },
      ]);

      const queryBuilderMock = {
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockPermissions[0]]),
      };
      permissionRepository.createQueryBuilder.mockReturnValue(queryBuilderMock);

      const result = await service.hasPermissions(USER_ROLE.INSTRUCTOR, [
        'courses:create',
        'users:manage',
      ]);

      expect(result).toBe(false);
    });
  });

  describe('caching', () => {
    it('should cache permissions after first query', async () => {
      rolePermissionRepository.find.mockResolvedValue([
        { id: 'rp-1', role: USER_ROLE.ADMINISTRADOR, permissionId: 'perm-1' },
      ]);

      // First call - hits DB
      await service.hasPermission(USER_ROLE.ADMINISTRADOR, 'courses:create');
      // Second call - should use cache
      await service.hasPermission(USER_ROLE.ADMINISTRADOR, 'courses:create');

      // Should only query the DB once
      expect(rolePermissionRepository.find).toHaveBeenCalledTimes(1);
    });

    it('should clear cache when clearCache is called', async () => {
      rolePermissionRepository.find.mockResolvedValue([
        { id: 'rp-1', role: USER_ROLE.ADMINISTRADOR, permissionId: 'perm-1' },
      ]);

      // First call
      await service.hasPermission(USER_ROLE.ADMINISTRADOR, 'courses:create');

      // Clear cache
      service.clearCache();

      // Second call - should hit DB again
      await service.hasPermission(USER_ROLE.ADMINISTRADOR, 'courses:create');

      expect(rolePermissionRepository.find).toHaveBeenCalledTimes(2);
    });
  });
});
