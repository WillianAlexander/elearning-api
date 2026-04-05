import { Logger } from '@nestjs/common';
import { JwksClient } from 'jwks-rsa';
import { decode, verify } from 'jsonwebtoken';

import type { SigningKey } from 'jwks-rsa';
import type { JwtHeader, JwtPayload as JsonWebTokenPayload } from 'jsonwebtoken';

import type { TokenValidationPort } from '../domain/ports';
import type { JwtPayload, TokenValidationResult } from '../domain/types';
import { TOKEN_VALIDATION_STATUS } from '../domain/types';

/**
 * Azure AD token validation adapter.
 * Validates JWTs directly against Azure AD JWKS endpoint using jwks-rsa + jsonwebtoken.
 * No passport dependency — lightweight and fully controlled.
 */
export class AzureAdTokenValidationAdapter implements TokenValidationPort {
  private readonly logger = new Logger(AzureAdTokenValidationAdapter.name);
  private readonly jwksClient: JwksClient;
  private readonly validIssuers: [string, ...string[]];

  constructor(
    tenantId: string,
    private readonly clientId: string,
  ) {
    this.jwksClient = new JwksClient({
      jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`,
      cache: true,
      cacheMaxAge: 3600000, // 1 hour
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });

    // Azure AD v2.0 tokens can have either issuer format
    this.validIssuers = [
      `https://login.microsoftonline.com/${tenantId}/v2.0`,
      `https://sts.windows.net/${tenantId}/`,
    ];
  }

  async validate(token: string): Promise<TokenValidationResult> {
    try {
      // 1. Decode header to get kid
      const decoded = decode(token, { complete: true });

      if (!decoded || typeof decoded === 'string') {
        this.logger.error('Token could not be decoded. First 20 chars: ' + token.substring(0, 20));
        return {
          isValid: false,
          status: TOKEN_VALIDATION_STATUS.INVALID,
          error: 'Token could not be decoded',
        };
      }

      this.logger.log(`Token decoded: iss=${(decoded.payload as Record<string, unknown>)['iss']}, aud=${(decoded.payload as Record<string, unknown>)['aud']}, sub=${(decoded.payload as Record<string, unknown>)['sub']}`);


      const header = decoded.header as JwtHeader;
      const kid = header.kid;

      if (!kid) {
        return {
          isValid: false,
          status: TOKEN_VALIDATION_STATUS.INVALID,
          error: 'Token header missing kid',
        };
      }

      // 2. Get signing key from JWKS
      let signingKey: SigningKey;
      try {
        signingKey = await this.jwksClient.getSigningKey(kid);
      } catch (err) {
        this.logger.error(`Failed to fetch signing key for kid=${kid}`, err);
        return {
          isValid: false,
          status: TOKEN_VALIDATION_STATUS.ERROR,
          error: 'Failed to fetch signing key from JWKS endpoint',
        };
      }

      const publicKey = signingKey.getPublicKey();

      // 3. Verify token
      // ID tokens have aud=clientId; access tokens may have aud=api://clientId
      // nonce is present in ID tokens from MSAL, but jsonwebtoken doesn't validate it
      const verifiedPayload = verify(token, publicKey, {
        audience: [this.clientId, `api://${this.clientId}`],
        issuer: this.validIssuers,
        algorithms: ['RS256'],
        ignoreNotBefore: true,
      }) as JsonWebTokenPayload;

      // 4. Map to our JwtPayload
      const payload: JwtPayload = {
        sub: (verifiedPayload['sub'] as string) ?? '',
        email:
          (verifiedPayload['preferred_username'] as string) ??
          (verifiedPayload['email'] as string) ??
          '',
        name: (verifiedPayload['name'] as string) ?? '',
        groups: (verifiedPayload['groups'] as string[]) ?? [],
        iat: (verifiedPayload['iat'] as number) ?? 0,
        exp: (verifiedPayload['exp'] as number) ?? 0,
        iss: verifiedPayload['iss'] as string,
        aud: verifiedPayload['aud'] as string,
        department: verifiedPayload['department'] as string | undefined,
        jobTitle: verifiedPayload['jobTitle'] as string | undefined,
      };

      return {
        isValid: true,
        status: TOKEN_VALIDATION_STATUS.VALID,
        payload,
      };
    } catch (err: unknown) {
      const error = err as Error;
      const errorName = error.name ?? '';
      const errorMessage = error.message ?? 'Unknown error';

      if (errorName === 'TokenExpiredError') {
        return {
          isValid: false,
          status: TOKEN_VALIDATION_STATUS.EXPIRED,
          error: 'Token has expired',
        };
      }

      if (
        errorName === 'JsonWebTokenError' ||
        errorName === 'NotBeforeError'
      ) {
        return {
          isValid: false,
          status: TOKEN_VALIDATION_STATUS.INVALID,
          error: `Invalid token: ${errorMessage}`,
        };
      }

      this.logger.error('Unexpected error validating token', error);
      return {
        isValid: false,
        status: TOKEN_VALIDATION_STATUS.ERROR,
        error: `Token validation error: ${errorMessage}`,
      };
    }
  }
}
