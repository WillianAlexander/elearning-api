import { Logger } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';

import type {
  GoogleTokenValidationPort,
  GoogleTokenPayload,
} from '../domain/ports';

/**
 * Validates Google ID tokens using google-auth-library's OAuth2Client.
 * Verifies the token signature, expiration, audience, and issuer.
 */
export class GoogleTokenValidationAdapter
  implements GoogleTokenValidationPort
{
  private readonly logger = new Logger(GoogleTokenValidationAdapter.name);
  private readonly client: OAuth2Client;

  constructor(private readonly clientId: string) {
    this.client = new OAuth2Client(clientId);
  }

  async validate(idToken: string): Promise<GoogleTokenPayload> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.clientId,
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw new Error('Google ID token payload is empty');
      }

      if (!payload['email']) {
        throw new Error('Google ID token missing email claim');
      }

      return {
        googleId: payload['sub'],
        email: payload['email'],
        name: payload['name'] ?? '',
        picture: payload['picture'],
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Google token validation failed: ${message}`);
      throw new Error(`Invalid Google ID token: ${message}`);
    }
  }
}
