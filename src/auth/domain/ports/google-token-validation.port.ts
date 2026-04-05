/**
 * Result of validating a Google ID token.
 */
export interface GoogleTokenPayload {
  /** Google user ID (sub claim) */
  googleId: string;
  /** User email */
  email: string;
  /** Display name */
  name: string;
  /** Profile picture URL */
  picture?: string;
}

/**
 * Port for Google ID token validation.
 * Infrastructure adapters implement this to validate Google OAuth tokens.
 */
export const GOOGLE_TOKEN_VALIDATION_PORT = Symbol(
  'GOOGLE_TOKEN_VALIDATION_PORT',
);

export interface GoogleTokenValidationPort {
  /**
   * Validate a Google ID token and return the payload.
   * @param idToken - The Google ID token from the frontend
   * @throws Error if the token is invalid
   */
  validate(idToken: string): Promise<GoogleTokenPayload>;
}
