import { registerAs } from '@nestjs/config';

export const authConfig = registerAs('auth', () => ({
  /** URL of the .NET 10 auth service that handles Azure AD SSO */
  authServiceUrl: process.env['AUTH_SERVICE_URL'] ?? 'http://localhost:5000',
  /** JWT secret for validating tokens from the auth service — REQUIRED in production */
  jwtSecret: process.env['JWT_SECRET'] ?? (process.env['NODE_ENV'] === 'production'
    ? (() => { throw new Error('JWT_SECRET environment variable is required in production'); })()
    : 'dev-jwt-secret-change-in-production'),
  /** JWT token expiration */
  jwtExpiresIn: process.env['JWT_EXPIRES_IN'] ?? '8h',
  /** Azure AD tenant ID for JWKS validation */
  azureAdTenantId: process.env['AZURE_AD_TENANT_ID'] ?? '',
  /** Azure AD client ID (audience) for token validation */
  azureAdClientId: process.env['AZURE_AD_CLIENT_ID'] ?? '',
  /** Use mock adapter instead of real Azure AD validation (must explicitly opt-in) */
  useMock: process.env['AUTH_USE_MOCK'] === 'true',
  /** Google OAuth Client ID for ID token verification */
  googleClientId: process.env['GOOGLE_CLIENT_ID'] ?? '',
  /** Use mock Google token validation (must explicitly opt-in) */
  googleUseMock: process.env['GOOGLE_USE_MOCK'] === 'true',
}));
