import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import type { Request } from 'express';

import { AuthService } from '../../application/auth.service';

interface LocalJwtPayload {
  sub: string;
  email: string;
  role: string;
}

/**
 * Guard that validates JWT bearer tokens.
 * Supports two token types:
 * 1. Azure AD tokens (validated via external JWKS / mock)
 * 2. Locally-generated JWTs (issued for Google OAuth users)
 *
 * Strategy: try local JWT verification first (fast, no network).
 * If that fails, fall back to Azure AD token validation.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Missing authorization token');
    }

    // Try local JWT first (issued for Google OAuth users)
    try {
      const payload = this.jwtService.verify<LocalJwtPayload>(token);
      const user = await this.authService.getUserById(payload.sub);
      (request as Request & { user: unknown }).user = user;
      return true;
    } catch {
      // Not a local JWT — fall through to Azure AD validation
    }

    // Fall back to Azure AD token validation
    const user = await this.authService.validateTokenAndGetUser(token);
    (request as Request & { user: unknown }).user = user;

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) return undefined;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
