import type { TokenValidationResult } from '../types';

/**
 * Port for token validation.
 * Infrastructure adapters implement this to validate JWT tokens.
 * - MockTokenValidationAdapter: for development/testing
 * - DotNetTokenValidationAdapter: for production (.NET 10 auth service)
 */
export const TOKEN_VALIDATION_PORT = Symbol('TOKEN_VALIDATION_PORT');

export interface TokenValidationPort {
  /**
   * Validate a JWT token and return the result.
   * @param token - The raw JWT bearer token
   */
  validate(token: string): Promise<TokenValidationResult>;
}
