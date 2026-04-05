import type { JwtPayload } from './jwt-payload';

const TOKEN_VALIDATION_STATUS = Object.freeze({
  VALID: 'valid',
  EXPIRED: 'expired',
  INVALID: 'invalid',
  ERROR: 'error',
} as const);

type TokenValidationStatus =
  (typeof TOKEN_VALIDATION_STATUS)[keyof typeof TOKEN_VALIDATION_STATUS];

/**
 * Result of validating a JWT token against the .NET 10 auth service.
 */
interface TokenValidationResult {
  isValid: boolean;
  status: TokenValidationStatus;
  payload?: JwtPayload;
  error?: string;
}

export { TOKEN_VALIDATION_STATUS };
export type { TokenValidationStatus, TokenValidationResult };
