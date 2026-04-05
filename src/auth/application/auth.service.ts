import {
  Injectable,
  Inject,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';

import { TOKEN_VALIDATION_PORT, GOOGLE_TOKEN_VALIDATION_PORT } from '../domain/ports';
import type { TokenValidationPort, GoogleTokenValidationPort } from '../domain/ports';
import type { AuthenticatedUser, JwtPayload, TokenValidationResult } from '../domain/types';

// USER_ROLE enum - temporarily define locally until @lms/shared is resolved
export const USER_ROLE = {
  ADMINISTRADOR: 'ADMINISTRADOR' as const,
  INSTRUCTOR: 'INSTRUCTOR' as const,
  COLABORADOR: 'COLABORADOR' as const,
};
export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

/**
 * AuthService validates JWT tokens from the .NET 10 auth service
 * and maps Azure AD identity to LMS users.
 *
 * DOES NOT issue tokens — only validates and resolves users.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  /** Maps Azure AD group names to LMS roles */
  private static readonly AD_GROUP_ROLE_MAP: Record<string, UserRole> = {
    'LMS-Administradores': USER_ROLE.ADMINISTRADOR,
    'LMS-Instructores': USER_ROLE.INSTRUCTOR,
  };

  constructor(
    @Inject(TOKEN_VALIDATION_PORT)
    private readonly tokenValidator: TokenValidationPort,
    @Inject(GOOGLE_TOKEN_VALIDATION_PORT)
    private readonly googleTokenValidator: GoogleTokenValidationPort,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Validate a JWT token and return the authenticated user.
   * Creates a new LMS user if one doesn't exist for the Azure AD identity.
   */
  async validateTokenAndGetUser(token: string): Promise<AuthenticatedUser> {
    const validation: TokenValidationResult = await this.tokenValidator.validate(token);

    if (!validation.isValid || !validation.payload) {
      this.logger.warn(
        `Token validation failed: ${validation.status} - ${validation.error ?? 'unknown'}`,
      );
      throw new UnauthorizedException(validation.error ?? 'Invalid or expired token');
    }

    const payload = validation.payload;
    let user = await this.findUserByAzureAdId(payload.sub);

    if (!user) {
      // Try to find by email
      user = await this.findUserByEmail(payload.email);

      if (user) {
        // Link the Azure AD ID to the existing user
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { azureAdId: payload.sub },
        });
      }
    }

    if (!user) {
      // Auto-provision: create a new user from the Azure AD identity
      user = await this.autoProvisionUser(payload);
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated. Contact your administrator.');
    }

    // Sync area/cargo from JWT claims (respecting manual overrides)
    const claimChanges = this.syncClaimsToUser(user, payload);

    // Update last login — use targeted update to avoid overwriting
    // fields changed by other operations (e.g. deactivation)
    const lastLoginAt = new Date();
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        ...claimChanges,
        lastLoginAt,
      },
    });

    // Fetch updated user
    user = await this.prisma.user.findUnique({ where: { id: user.id } });
    if (!user) {
      throw new UnauthorizedException('User not found after update');
    }

    return this.mapUserToAuthenticatedUser(user);
  }

  /**
   * Get the current authenticated user by ID.
   */
  async getUserById(userId: string): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.mapUserToAuthenticatedUser(user);
  }

  /**
   * Validate a Google ID token and return the authenticated user with a JWT.
   * Only pre-registered users can login — NO auto-provisioning.
   */
  async validateGoogleTokenAndGetUser(
    googleIdToken: string,
  ): Promise<{ user: AuthenticatedUser; accessToken: string }> {
    let googlePayload;
    try {
      googlePayload = await this.googleTokenValidator.validate(googleIdToken);
    } catch {
      throw new UnauthorizedException('Token de Google inválido o expirado');
    }

    // Find user by email — Google login only works for pre-registered users
    const user = await this.prisma.user.findFirst({
      where: { email: googlePayload.email, deletedAt: null },
    });

    if (!user) {
      throw new ForbiddenException('Usuario no registrado. Contacte al administrador.');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Usuario desactivado');
    }

    // Build targeted update payload to avoid race conditions
    const updateData: Record<string, unknown> = {};

    // Link googleId if not linked yet
    if (!user.googleId) {
      updateData['googleId'] = googlePayload.googleId;
    }

    // Update last login
    const lastLoginAt = new Date();
    updateData['lastLoginAt'] = lastLoginAt;

    await this.prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    // Fetch updated user
    const updatedUser = await this.prisma.user.findUnique({ where: { id: user.id } });
    if (!updatedUser) {
      throw new UnauthorizedException('User not found after update');
    }

    const authenticatedUser = this.mapUserToAuthenticatedUser(updatedUser);

    // Generate JWT for subsequent API calls
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return { user: authenticatedUser, accessToken };
  }

  /**
   * Map Azure AD groups to LMS role.
   * Default: COLABORADOR (if no admin/instructor group found).
   */
  mapAdGroupsToRole(groups: string[] = []): UserRole {
    for (const group of groups) {
      const role = AuthService.AD_GROUP_ROLE_MAP[group];
      if (role) return role;
    }
    return USER_ROLE.COLABORADOR;
  }

  private async findUserByAzureAdId(azureAdId: string): Promise<any | null> {
    return this.prisma.user.findFirst({ where: { azureAdId, deletedAt: null } });
  }

  private async findUserByEmail(email: string): Promise<any | null> {
    return this.prisma.user.findFirst({ where: { email, deletedAt: null } });
  }

  private async autoProvisionUser(payload: JwtPayload): Promise<any> {
    const nameParts = (payload.name ?? '').split(' ');
    const firstName = nameParts[0] ?? '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const role = this.mapAdGroupsToRole(payload.groups);

    const user = await this.prisma.user.create({
      data: {
        azureAdId: payload.sub,
        email: payload.email,
        firstName,
        lastName,
        role,
        area: payload.department ?? '',
        cargo: payload.jobTitle ?? '',
        isActive: true,
        lastLoginAt: new Date(),
      },
    });

    this.logger.log(`Auto-provisioned user: ${payload.email} with role: ${role}`);

    return user;
  }

  /**
   * Sync area/cargo from JWT claims, respecting manual overrides.
   * Absent claims do NOT clear existing data.
   * Returns the changed fields (empty object if nothing changed).
   */
  private syncClaimsToUser(user: any, payload: JwtPayload): Record<string, string> {
    const changes: Record<string, string> = {};
    if (!user.areaOverridden && payload.department) {
      changes['area'] = payload.department;
    }
    if (!user.cargoOverridden && payload.jobTitle) {
      changes['cargo'] = payload.jobTitle;
    }
    return changes;
  }

  private mapUserToAuthenticatedUser(user: any): AuthenticatedUser {
    return {
      id: user.id,
      azureAdId: user.azureAdId ?? '',
      email: user.email,
      name: user.fullName,
      firstName: user.firstName,
      lastName: user.lastName,
      cedula: user.cedula ?? null,
      role: user.role,
      area: user.area,
      cargo: user.cargo,
      isActive: user.isActive,
    };
  }
}
