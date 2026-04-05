import { Test } from '@nestjs/testing';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { USER_ROLE } from '@lms/shared';

import type { TestingModule } from '@nestjs/testing';

import { AuthController } from './auth.controller';
import { AuthService } from '../application/auth.service';
import type { AuthenticatedUser } from '../domain/types';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<
    Pick<
      AuthService,
      | 'validateTokenAndGetUser'
      | 'getUserById'
      | 'validateGoogleTokenAndGetUser'
    >
  >;

  const mockUser: AuthenticatedUser = {
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

  beforeEach(async () => {
    authService = {
      validateTokenAndGetUser: jest.fn(),
      getUserById: jest.fn(),
      validateGoogleTokenAndGetUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
        {
          provide: JwtService,
          useValue: { verify: jest.fn(), sign: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('login', () => {
    it('should return user on successful login', async () => {
      authService.validateTokenAndGetUser.mockResolvedValue(mockUser);

      const result = await controller.login('mock-token-admin');

      expect(result.user).toEqual(mockUser);
      expect(authService.validateTokenAndGetUser).toHaveBeenCalledWith(
        'mock-token-admin',
      );
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      authService.validateTokenAndGetUser.mockRejectedValue(
        new UnauthorizedException('Invalid token'),
      );

      await expect(controller.login('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('loginWithGoogle', () => {
    it('should return user and accessToken on successful Google login', async () => {
      authService.validateGoogleTokenAndGetUser.mockResolvedValue({
        user: mockUser,
        accessToken: 'jwt-token-123',
      });

      const result = await controller.loginWithGoogle(
        'mock-google-token-admin',
      );

      expect(result.user).toEqual(mockUser);
      expect(result.accessToken).toBe('jwt-token-123');
      expect(
        authService.validateGoogleTokenAndGetUser,
      ).toHaveBeenCalledWith('mock-google-token-admin');
    });

    it('should throw ForbiddenException for unregistered user', async () => {
      authService.validateGoogleTokenAndGetUser.mockRejectedValue(
        new ForbiddenException(
          'Usuario no registrado. Contacte al administrador.',
        ),
      );

      await expect(
        controller.loginWithGoogle('mock-google-token-unknown'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getProfile', () => {
    it('should return the current user', () => {
      const result = controller.getProfile(mockUser);

      expect(result.user).toEqual(mockUser);
    });
  });

  describe('logout', () => {
    it('should return success message', () => {
      const result = controller.logout(mockUser);

      expect(result.message).toContain('admin@cooperativa.com');
      expect(result.message).toContain('logged out');
    });
  });
});
