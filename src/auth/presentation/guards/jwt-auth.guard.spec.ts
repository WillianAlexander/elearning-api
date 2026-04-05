import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { USER_ROLE } from '@lms/shared';

import type { ExecutionContext } from '@nestjs/common';

import { JwtAuthGuard } from './jwt-auth.guard';
import type { AuthService } from '../../application/auth.service';
import type { AuthenticatedUser } from '../../domain/types';

const createMockContext = (
  authHeader?: string,
): { context: ExecutionContext; request: Record<string, unknown> } => {
  const request: Record<string, unknown> = {
    headers: { authorization: authHeader },
  };

  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;

  return { context, request };
};

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let authService: jest.Mocked<
    Pick<AuthService, 'validateTokenAndGetUser' | 'getUserById'>
  >;
  let jwtService: jest.Mocked<Pick<JwtService, 'verify'>>;

  const mockAuthenticatedUser: AuthenticatedUser = {
    id: 'user-1',
    azureAdId: 'azure-1',
    email: 'test@cooperativa.com',
    name: 'Test User',
    firstName: 'Test',
    lastName: 'User',
    cedula: '0102030405',
    role: USER_ROLE.COLABORADOR,
    area: 'TI',
    cargo: 'Dev',
    isActive: true,
  };

  beforeEach(() => {
    authService = {
      validateTokenAndGetUser: jest.fn(),
      getUserById: jest.fn(),
    };
    jwtService = {
      verify: jest.fn(),
    };
    guard = new JwtAuthGuard(
      authService as unknown as AuthService,
      jwtService as unknown as JwtService,
    );
  });

  it('should allow access with valid local JWT token', async () => {
    jwtService.verify.mockReturnValue({
      sub: 'user-1',
      email: 'test@cooperativa.com',
      role: USER_ROLE.COLABORADOR,
    });
    authService.getUserById.mockResolvedValue(mockAuthenticatedUser);
    const { context, request } = createMockContext('Bearer local-jwt-token');

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request['user']).toEqual(mockAuthenticatedUser);
    expect(jwtService.verify).toHaveBeenCalledWith('local-jwt-token');
    expect(authService.getUserById).toHaveBeenCalledWith('user-1');
  });

  it('should fall back to Azure AD validation when local JWT fails', async () => {
    jwtService.verify.mockImplementation(() => {
      throw new Error('invalid token');
    });
    authService.validateTokenAndGetUser.mockResolvedValue(
      mockAuthenticatedUser,
    );
    const { context, request } = createMockContext('Bearer azure-ad-token');

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request['user']).toEqual(mockAuthenticatedUser);
    expect(authService.validateTokenAndGetUser).toHaveBeenCalledWith(
      'azure-ad-token',
    );
  });

  it('should throw UnauthorizedException when no authorization header', async () => {
    const { context } = createMockContext(undefined);

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException when token type is not Bearer', async () => {
    const { context } = createMockContext('Basic some-token');

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException when both validation strategies fail', async () => {
    jwtService.verify.mockImplementation(() => {
      throw new Error('invalid token');
    });
    authService.validateTokenAndGetUser.mockRejectedValue(
      new UnauthorizedException('Invalid token'),
    );
    const { context } = createMockContext('Bearer invalid-token');

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
