/**
 * Enrollment lifecycle statuses.
 */

const ENROLLMENT_STATUS = Object.freeze({
  ACTIVE: 'active',
  COMPLETED: 'completed',
  DROPPED: 'dropped',
  EXPIRED: 'expired',
} as const);

type EnrollmentStatus = (typeof ENROLLMENT_STATUS)[keyof typeof ENROLLMENT_STATUS];

export { ENROLLMENT_STATUS };
export type { EnrollmentStatus };
