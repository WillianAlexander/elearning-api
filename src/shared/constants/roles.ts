import { USER_ROLE } from '../enums/roles';

/**
 * Default permissions per role.
 * Will be expanded when RBAC module is implemented in Phase 1.
 */
export const ROLE_PERMISSIONS = {
  [USER_ROLE.ADMINISTRADOR]: ['manage:courses', 'manage:users', 'view:reports', 'manage:settings'],
  [USER_ROLE.INSTRUCTOR]: ['create:courses', 'edit:own-courses', 'view:enrollments', 'grade:evaluations'],
  [USER_ROLE.COLABORADOR]: ['view:courses', 'enroll:courses', 'submit:evaluations', 'view:own-progress'],
} as const;
