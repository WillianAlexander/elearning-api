import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { USER_ROLE } from '@lms/shared';

import type { ExecutionContext } from '@nestjs/common';

import { RolesGuard } from './roles.guard';
import type { AuthenticatedUser } from '../../domain/types';

const createMockContext = (user?: AuthenticatedUser): ExecutionContext => {
  const request = { user };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
  } as unknown as ExecutionContext;
};

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  const adminUser: AuthenticatedUser = {
    id: 'user-1',
    azureAdId: 'azure-1',
    email: 'admin@cooperativa.com',
    name: 'Admin User',
    firstName: 'Admin',
    lastName: 'User',
    cedula: '0102030405',
    role: USER_ROLE.ADMINISTRADOR,
    area: 'TI',
    cargo: 'Jefe',
    isActive: true,
  };

  const colaboradorUser: AuthenticatedUser = {
    id: 'user-2',
    azureAdId: 'azure-2',
    email: 'colab@cooperativa.com',
    name: 'Colaborador User',
    firstName: 'Colaborador',
    lastName: 'User',
    cedula: '0102030406',
    role: USER_ROLE.COLABORADOR,
    area: 'Operaciones',
    cargo: 'Cajero',
    isActive: true,
  };

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;
    guard = new RolesGuard(reflector);
  });

  it('should allow access when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockContext(colaboradorUser);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when empty roles array', () => {
    reflector.getAllAndOverride.mockReturnValue([]);
    const context = createMockContext(colaboradorUser);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user has required role', () => {
    reflector.getAllAndOverride.mockReturnValue([USER_ROLE.ADMINISTRADOR]);
    const context = createMockContext(adminUser);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access when user does not have required role', () => {
    reflector.getAllAndOverride.mockReturnValue([USER_ROLE.ADMINISTRADOR]);
    const context = createMockContext(colaboradorUser);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow access when user has any of the required roles', () => {
    reflector.getAllAndOverride.mockReturnValue([
      USER_ROLE.ADMINISTRADOR,
      USER_ROLE.INSTRUCTOR,
    ]);
    const context = createMockContext(adminUser);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException when no user on request', () => {
    reflector.getAllAndOverride.mockReturnValue([USER_ROLE.ADMINISTRADOR]);
    const context = createMockContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
