import type { UserRole } from '@lms/shared';

/**
 * Represents the authenticated user attached to the request.
 * Combines Azure AD identity with LMS-specific data.
 */
export interface AuthenticatedUser {
  /** LMS internal user ID (UUID) */
  id: string;
  /** Azure AD Object ID */
  azureAdId: string;
  /** User email */
  email: string;
  /** Display name */
  name: string;
  /** First name */
  firstName: string;
  /** Last name */
  lastName: string;
  /** Cedula (national ID) — optional, legacy field */
  cedula?: string | null;
  /** LMS role (from PostgreSQL, NOT from JWT) */
  role: UserRole;
  /** Organizational area */
  area: string;
  /** Job title */
  cargo: string;
  /** Whether the user is active in the LMS */
  isActive: boolean;
}
