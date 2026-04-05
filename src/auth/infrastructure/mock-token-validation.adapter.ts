import { Injectable } from '@nestjs/common';

import type { TokenValidationPort } from '../domain/ports';
import type { TokenValidationResult, JwtPayload } from '../domain/types';
import { TOKEN_VALIDATION_STATUS } from '../domain/types';

/**
 * Mock adapter for token validation.
 * Accepts specific test tokens and returns predefined payloads.
 * Replace with DotNetTokenValidationAdapter when .NET 10 auth service is available.
 */
@Injectable()
export class MockTokenValidationAdapter implements TokenValidationPort {
  private static readonly MOCK_USERS: Record<string, JwtPayload> = {
    // ── Administradores ──────────────────────────────────────────────
    'mock-token-admin': {
      sub: 'azure-ad-admin-001',
      email: 'admin@cooperativa.com',
      name: 'Admin User',
      groups: ['LMS-Administradores'],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 28800, // 8 hours
      iss: 'https://auth.cooperativa.com',
      aud: 'lms-api',
    },

    // ── Instructores ─────────────────────────────────────────────────
    'mock-token-instructor': {
      sub: 'azure-ad-instructor-001',
      email: 'instructor@cooperativa.com',
      name: 'Instructor User',
      groups: ['LMS-Instructores'],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 28800,
      iss: 'https://auth.cooperativa.com',
      aud: 'lms-api',
    },
    'mock-token-instructor-2': {
      sub: 'azure-ad-instructor-002',
      email: 'maria.gonzalez@cooperativa.com',
      name: 'Maria Gonzalez',
      groups: ['LMS-Instructores'],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 28800,
      iss: 'https://auth.cooperativa.com',
      aud: 'lms-api',
    },
    'mock-token-instructor-3': {
      sub: 'azure-ad-instructor-003',
      email: 'carlos.ramirez@cooperativa.com',
      name: 'Carlos Ramirez',
      groups: ['LMS-Instructores'],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 28800,
      iss: 'https://auth.cooperativa.com',
      aud: 'lms-api',
    },

    // ── Colaboradores ────────────────────────────────────────────────
    'mock-token-colaborador': {
      sub: 'azure-ad-colaborador-001',
      email: 'colaborador@cooperativa.com',
      name: 'Colaborador User',
      groups: [],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 28800,
      iss: 'https://auth.cooperativa.com',
      aud: 'lms-api',
    },
    'mock-token-colaborador-2': {
      sub: 'azure-ad-colaborador-002',
      email: 'ana.martinez@cooperativa.com',
      name: 'Ana Martinez',
      groups: [],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 28800,
      iss: 'https://auth.cooperativa.com',
      aud: 'lms-api',
    },
    'mock-token-colaborador-3': {
      sub: 'azure-ad-colaborador-003',
      email: 'luis.fernandez@cooperativa.com',
      name: 'Luis Fernandez',
      groups: [],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 28800,
      iss: 'https://auth.cooperativa.com',
      aud: 'lms-api',
    },
    'mock-token-colaborador-4': {
      sub: 'azure-ad-colaborador-004',
      email: 'sofia.lopez@cooperativa.com',
      name: 'Sofia Lopez',
      groups: [],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 28800,
      iss: 'https://auth.cooperativa.com',
      aud: 'lms-api',
    },

    // ── Token expirado (testing) ─────────────────────────────────────
    'mock-token-expired': {
      sub: 'azure-ad-expired-001',
      email: 'expired@cooperativa.com',
      name: 'Expired User',
      groups: [],
      iat: Math.floor(Date.now() / 1000) - 36000,
      exp: Math.floor(Date.now() / 1000) - 3600, // expired 1 hour ago
      iss: 'https://auth.cooperativa.com',
      aud: 'lms-api',
    },
  };

  async validate(token: string): Promise<TokenValidationResult> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 10));

    const payload = MockTokenValidationAdapter.MOCK_USERS[token];

    if (!payload) {
      return {
        isValid: false,
        status: TOKEN_VALIDATION_STATUS.INVALID,
        error: 'Token not recognized',
      };
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return {
        isValid: false,
        status: TOKEN_VALIDATION_STATUS.EXPIRED,
        payload,
        error: 'Token has expired',
      };
    }

    return {
      isValid: true,
      status: TOKEN_VALIDATION_STATUS.VALID,
      payload,
    };
  }
}
