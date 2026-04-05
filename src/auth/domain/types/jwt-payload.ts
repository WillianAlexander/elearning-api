/**
 * JWT payload as received from the .NET 10 auth service.
 * Contains Azure AD user claims.
 */
export interface JwtPayload {
  /** Azure AD Object ID */
  sub: string;
  /** User email (UPN) */
  email: string;
  /** Display name from Azure AD */
  name: string;
  /** Azure AD groups the user belongs to */
  groups?: string[];
  /** Token issued at (Unix timestamp) */
  iat: number;
  /** Token expiration (Unix timestamp) */
  exp: number;
  /** Token issuer */
  iss?: string;
  /** Token audience */
  aud?: string;
  /** Azure AD department claim (maps to user.area) */
  department?: string;
  /** Azure AD job title claim (maps to user.cargo) */
  jobTitle?: string;
}
