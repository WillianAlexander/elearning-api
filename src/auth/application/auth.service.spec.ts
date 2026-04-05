import { Test } from '@nestjs/testing';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { USER_ROLE } from '@lms/shared';

import type { TestingModule } from '@nestjs/testing';

import { AuthService } from './auth.service';
import { TOKEN_VALIDATION_PORT, GOOGLE_TOKEN_VALIDATION_PORT } from '../domain/ports';
import { TOKEN_VALIDATION_STATUS } from '../domain/types';
import { User } from '../../users/domain/entities/user.entity';

import type { TokenValidationPort, GoogleTokenValidationPort } from '../domain/ports';
import type { TokenValidationResult } from '../domain/types';

const createMockUser = (overrides: Partial<User> = {}): User => {
  const user = new User();
  user.id = 'test-uuid-001';
  user.cedula = '0102030405';
  user.email = 'admin@cooperativa.com';
  user.firstName = 'Admin';
  user.lastName = 'User';
  user.role = USER_ROLE.ADMINISTRADOR;
  user.area = 'TI';
  user.cargo = 'Jefe de Tecnologia';
  user.isActive = true;
  user.azureAdId = 'azure-ad-admin-001';
  user.lastLoginAt = null;
  user.areaOverridden = false;
  user.cargoOverridden = false;
  Object.assign(user, overrides);
  return user;
};

describe('AuthService', () => {
  let service: AuthService;
  let tokenValidator: jest.Mocked<TokenValidationPort>;
  let googleTokenValidator: jest.Mocked<GoogleTokenValidationPort>;
  let jwtService: jest.Mocked<Pick<JwtService, 'sign'>>;
  let userRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
  };

  beforeEach(async () => {
    tokenValidator = {
      validate: jest.fn(),
    };

    googleTokenValidator = {
      validate: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    userRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: TOKEN_VALIDATION_PORT,
          useValue: tokenValidator,
        },
        {
          provide: GOOGLE_TOKEN_VALIDATION_PORT,
          useValue: googleTokenValidator,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('validateTokenAndGetUser', () => {
    it('should throw UnauthorizedException for invalid token', async () => {
      const validationResult: TokenValidationResult = {
        isValid: false,
        status: TOKEN_VALIDATION_STATUS.INVALID,
        error: 'Token not recognized',
      };
      tokenValidator.validate.mockResolvedValue(validationResult);

      await expect(service.validateTokenAndGetUser('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for expired token', async () => {
      const validationResult: TokenValidationResult = {
        isValid: false,
        status: TOKEN_VALIDATION_STATUS.EXPIRED,
        error: 'Token has expired',
      };
      tokenValidator.validate.mockResolvedValue(validationResult);

      await expect(service.validateTokenAndGetUser('expired-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return authenticated user for valid token with existing user', async () => {
      const mockUser = createMockUser();
      const validationResult: TokenValidationResult = {
        isValid: true,
        status: TOKEN_VALIDATION_STATUS.VALID,
        payload: {
          sub: 'azure-ad-admin-001',
          email: 'admin@cooperativa.com',
          name: 'Admin User',
          groups: ['LMS-Administradores'],
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 28800,
        },
      };

      tokenValidator.validate.mockResolvedValue(validationResult);
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateTokenAndGetUser('mock-token-admin');

      expect(result.email).toBe('admin@cooperativa.com');
      expect(result.role).toBe(USER_ROLE.ADMINISTRADOR);
      expect(result.isActive).toBe(true);
      // Should use targeted update instead of full save
      expect(userRepository.update).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({ lastLoginAt: expect.any(Date) }),
      );
    });

    it('should auto-provision a new user when none exists', async () => {
      const validationResult: TokenValidationResult = {
        isValid: true,
        status: TOKEN_VALIDATION_STATUS.VALID,
        payload: {
          sub: 'azure-ad-new-001',
          email: 'newuser@cooperativa.com',
          name: 'New User',
          groups: [],
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 28800,
        },
      };

      tokenValidator.validate.mockResolvedValue(validationResult);
      // No user found by azureAdId or email
      userRepository.findOne.mockResolvedValue(null);

      const newUser = createMockUser({
        id: 'new-uuid',
        email: 'newuser@cooperativa.com',
        firstName: 'New',
        lastName: 'User',
        role: USER_ROLE.COLABORADOR,
        azureAdId: 'azure-ad-new-001',
      });
      userRepository.create.mockReturnValue(newUser);
      userRepository.save.mockResolvedValue(newUser);

      const result = await service.validateTokenAndGetUser('mock-token-new');

      expect(userRepository.create).toHaveBeenCalled();
      expect(result.email).toBe('newuser@cooperativa.com');
      expect(result.role).toBe(USER_ROLE.COLABORADOR);
    });

    it('should link Azure AD ID when user found by email but not by azureAdId', async () => {
      const existingUser = createMockUser({
        azureAdId: null,
      });
      const validationResult: TokenValidationResult = {
        isValid: true,
        status: TOKEN_VALIDATION_STATUS.VALID,
        payload: {
          sub: 'azure-ad-admin-001',
          email: 'admin@cooperativa.com',
          name: 'Admin User',
          groups: ['LMS-Administradores'],
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 28800,
        },
      };

      tokenValidator.validate.mockResolvedValue(validationResult);
      // First call (findByAzureAdId) returns null, second call (findByEmail) returns user
      userRepository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(existingUser);
      userRepository.save.mockResolvedValue({
        ...existingUser,
        azureAdId: 'azure-ad-admin-001',
      });

      const result = await service.validateTokenAndGetUser('mock-token-admin');

      expect(result.email).toBe('admin@cooperativa.com');
      // save should have been called to update the azureAdId
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should sync area from JWT department when not overridden', async () => {
      const mockUser = createMockUser({ area: 'Old Area', areaOverridden: false });
      const validationResult: TokenValidationResult = {
        isValid: true,
        status: TOKEN_VALIDATION_STATUS.VALID,
        payload: {
          sub: 'azure-ad-admin-001',
          email: 'admin@cooperativa.com',
          name: 'Admin User',
          groups: ['LMS-Administradores'],
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 28800,
          department: 'Tecnologia',
        },
      };

      tokenValidator.validate.mockResolvedValue(validationResult);
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateTokenAndGetUser('mock-token-admin');

      expect(result.area).toBe('Tecnologia');
      // Should include area in the targeted update
      expect(userRepository.update).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({ area: 'Tecnologia', lastLoginAt: expect.any(Date) }),
      );
    });

    it('should NOT sync area when areaOverridden is true', async () => {
      const mockUser = createMockUser({ area: 'Manual Area', areaOverridden: true });
      const validationResult: TokenValidationResult = {
        isValid: true,
        status: TOKEN_VALIDATION_STATUS.VALID,
        payload: {
          sub: 'azure-ad-admin-001',
          email: 'admin@cooperativa.com',
          name: 'Admin User',
          groups: ['LMS-Administradores'],
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 28800,
          department: 'New Department',
        },
      };

      tokenValidator.validate.mockResolvedValue(validationResult);
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateTokenAndGetUser('mock-token-admin');

      expect(result.area).toBe('Manual Area');
      // Should NOT include area in update when overridden
      expect(userRepository.update).toHaveBeenCalledWith(mockUser.id, {
        lastLoginAt: expect.any(Date),
      });
    });

    it('should sync cargo from JWT jobTitle when not overridden', async () => {
      const mockUser = createMockUser({ cargo: 'Old Cargo', cargoOverridden: false });
      const validationResult: TokenValidationResult = {
        isValid: true,
        status: TOKEN_VALIDATION_STATUS.VALID,
        payload: {
          sub: 'azure-ad-admin-001',
          email: 'admin@cooperativa.com',
          name: 'Admin User',
          groups: ['LMS-Administradores'],
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 28800,
          jobTitle: 'Senior Developer',
        },
      };

      tokenValidator.validate.mockResolvedValue(validationResult);
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateTokenAndGetUser('mock-token-admin');

      expect(result.cargo).toBe('Senior Developer');
      // Should include cargo in the targeted update
      expect(userRepository.update).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({ cargo: 'Senior Developer', lastLoginAt: expect.any(Date) }),
      );
    });

    it('should NOT sync cargo when cargoOverridden is true', async () => {
      const mockUser = createMockUser({ cargo: 'Manual Cargo', cargoOverridden: true });
      const validationResult: TokenValidationResult = {
        isValid: true,
        status: TOKEN_VALIDATION_STATUS.VALID,
        payload: {
          sub: 'azure-ad-admin-001',
          email: 'admin@cooperativa.com',
          name: 'Admin User',
          groups: ['LMS-Administradores'],
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 28800,
          jobTitle: 'New Title',
        },
      };

      tokenValidator.validate.mockResolvedValue(validationResult);
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateTokenAndGetUser('mock-token-admin');

      expect(result.cargo).toBe('Manual Cargo');
      // Should NOT include cargo in update when overridden
      expect(userRepository.update).toHaveBeenCalledWith(mockUser.id, {
        lastLoginAt: expect.any(Date),
      });
    });

    it('should not clear existing area when department claim is absent', async () => {
      const mockUser = createMockUser({ area: 'Existing Area', areaOverridden: false });
      const validationResult: TokenValidationResult = {
        isValid: true,
        status: TOKEN_VALIDATION_STATUS.VALID,
        payload: {
          sub: 'azure-ad-admin-001',
          email: 'admin@cooperativa.com',
          name: 'Admin User',
          groups: ['LMS-Administradores'],
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 28800,
          // department intentionally omitted
        },
      };

      tokenValidator.validate.mockResolvedValue(validationResult);
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateTokenAndGetUser('mock-token-admin');

      expect(result.area).toBe('Existing Area');
      // Should only update lastLoginAt, not area
      expect(userRepository.update).toHaveBeenCalledWith(mockUser.id, {
        lastLoginAt: expect.any(Date),
      });
    });

    it('should throw UnauthorizedException for deactivated user', async () => {
      const deactivatedUser = createMockUser({ isActive: false });
      const validationResult: TokenValidationResult = {
        isValid: true,
        status: TOKEN_VALIDATION_STATUS.VALID,
        payload: {
          sub: 'azure-ad-admin-001',
          email: 'admin@cooperativa.com',
          name: 'Admin User',
          groups: [],
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 28800,
        },
      };

      tokenValidator.validate.mockResolvedValue(validationResult);
      userRepository.findOne.mockResolvedValue(deactivatedUser);

      await expect(service.validateTokenAndGetUser('mock-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getUserById', () => {
    it('should return authenticated user for valid ID', async () => {
      const mockUser = createMockUser();
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getUserById('test-uuid-001');

      expect(result.id).toBe('test-uuid-001');
      expect(result.email).toBe('admin@cooperativa.com');
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.getUserById('non-existent')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('mapAdGroupsToRole', () => {
    it('should map LMS-Administradores to ADMINISTRADOR', () => {
      const role = service.mapAdGroupsToRole(['LMS-Administradores']);
      expect(role).toBe(USER_ROLE.ADMINISTRADOR);
    });

    it('should map LMS-Instructores to INSTRUCTOR', () => {
      const role = service.mapAdGroupsToRole(['LMS-Instructores']);
      expect(role).toBe(USER_ROLE.INSTRUCTOR);
    });

    it('should default to COLABORADOR when no matching groups', () => {
      const role = service.mapAdGroupsToRole(['Some-Other-Group']);
      expect(role).toBe(USER_ROLE.COLABORADOR);
    });

    it('should default to COLABORADOR when groups is empty', () => {
      const role = service.mapAdGroupsToRole([]);
      expect(role).toBe(USER_ROLE.COLABORADOR);
    });

    it('should default to COLABORADOR when groups is undefined', () => {
      const role = service.mapAdGroupsToRole(undefined);
      expect(role).toBe(USER_ROLE.COLABORADOR);
    });

    it('should prioritize ADMINISTRADOR over INSTRUCTOR when both groups present', () => {
      const role = service.mapAdGroupsToRole(['LMS-Administradores', 'LMS-Instructores']);
      expect(role).toBe(USER_ROLE.ADMINISTRADOR);
    });
  });

  describe('validateGoogleTokenAndGetUser', () => {
    it('should return user and accessToken for valid Google token with registered user', async () => {
      const mockUser = createMockUser({
        role: USER_ROLE.INSTRUCTOR,
        googleId: null,
      });

      googleTokenValidator.validate.mockResolvedValue({
        googleId: 'google-instructor-001',
        email: 'admin@cooperativa.com',
        name: 'Admin User',
      });
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateGoogleTokenAndGetUser('mock-google-token');

      expect(result.user.email).toBe('admin@cooperativa.com');
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
      // Should use targeted update instead of full save
      expect(userRepository.update).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          googleId: 'google-instructor-001',
          lastLoginAt: expect.any(Date),
        }),
      );
    });

    it('should link googleId on first Google login', async () => {
      const mockUser = createMockUser({ googleId: null });

      googleTokenValidator.validate.mockResolvedValue({
        googleId: 'google-new-001',
        email: 'admin@cooperativa.com',
        name: 'Admin User',
      });
      userRepository.findOne.mockResolvedValue(mockUser);

      await service.validateGoogleTokenAndGetUser('mock-google-token');

      expect(mockUser.googleId).toBe('google-new-001');
      // Should use targeted update with googleId included
      expect(userRepository.update).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({ googleId: 'google-new-001' }),
      );
    });

    it('should throw ForbiddenException when user is not registered', async () => {
      googleTokenValidator.validate.mockResolvedValue({
        googleId: 'google-unknown-001',
        email: 'unknown@cooperativa.com',
        name: 'Unknown User',
      });
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.validateGoogleTokenAndGetUser('mock-google-token')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when user is deactivated', async () => {
      const deactivatedUser = createMockUser({ isActive: false });

      googleTokenValidator.validate.mockResolvedValue({
        googleId: 'google-deactivated-001',
        email: 'admin@cooperativa.com',
        name: 'Admin User',
      });
      userRepository.findOne.mockResolvedValue(deactivatedUser);

      await expect(service.validateGoogleTokenAndGetUser('mock-google-token')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw UnauthorizedException for invalid Google token', async () => {
      googleTokenValidator.validate.mockRejectedValue(new Error('Invalid token'));

      await expect(service.validateGoogleTokenAndGetUser('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
