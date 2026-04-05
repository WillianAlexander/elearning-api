import { Injectable } from '@nestjs/common';

import type {
  GoogleTokenValidationPort,
  GoogleTokenPayload,
} from '../domain/ports';

/**
 * Mock adapter for Google token validation in dev/test environments.
 * Accepts predefined mock tokens and returns test payloads.
 */
@Injectable()
export class MockGoogleTokenValidationAdapter
  implements GoogleTokenValidationPort
{
  private static readonly MOCK_PAYLOADS: Record<string, GoogleTokenPayload> = {
    'mock-google-token-instructor': {
      googleId: 'google-instructor-001',
      email: 'instructor@cooperativa.com',
      name: 'Instructor User',
      picture: 'https://lh3.googleusercontent.com/mock-instructor',
    },
    'mock-google-token-admin': {
      googleId: 'google-admin-001',
      email: 'admin@cooperativa.com',
      name: 'Admin User',
      picture: 'https://lh3.googleusercontent.com/mock-admin',
    },
    'mock-google-token-superadmin': {
      googleId: 'google-superadmin-001',
      email: 'glituma@gmail.com',
      name: 'Jefferson Lituma',
      picture: 'https://lh3.googleusercontent.com/mock-superadmin',
    },
  };

  async validate(idToken: string): Promise<GoogleTokenPayload> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 10));

    const payload = MockGoogleTokenValidationAdapter.MOCK_PAYLOADS[idToken];

    if (!payload) {
      throw new Error(
        'Invalid Google ID token: token not recognized by mock adapter',
      );
    }

    return payload;
  }
}
