import { USER_ROLE } from '../../../shared';

import type { UserRole } from '../../../shared';

interface PermissionSeed {
  name: string;
  description: string;
  module: string;
  action: string;
}

/**
 * Default permissions for the LMS platform.
 */
export const DEFAULT_PERMISSIONS: PermissionSeed[] = [
  // Auth
  { name: 'auth:login', description: 'Login to the system', module: 'auth', action: 'login' },

  // Users
  { name: 'users:list', description: 'View list of users', module: 'users', action: 'list' },
  { name: 'users:view', description: 'View user details', module: 'users', action: 'view' },
  {
    name: 'users:manage',
    description: 'Create, update, deactivate users',
    module: 'users',
    action: 'manage',
  },

  // Courses
  { name: 'courses:list', description: 'View list of courses', module: 'courses', action: 'list' },
  { name: 'courses:view', description: 'View course content', module: 'courses', action: 'view' },
  {
    name: 'courses:create',
    description: 'Create new courses',
    module: 'courses',
    action: 'create',
  },
  { name: 'courses:edit', description: 'Edit course content', module: 'courses', action: 'edit' },
  { name: 'courses:delete', description: 'Delete courses', module: 'courses', action: 'delete' },
  {
    name: 'courses:publish',
    description: 'Publish/unpublish courses',
    module: 'courses',
    action: 'publish',
  },

  // Enrollments
  {
    name: 'enrollments:self',
    description: 'Enroll self in courses',
    module: 'enrollments',
    action: 'self',
  },
  {
    name: 'enrollments:manage',
    description: 'Manage enrollments for others',
    module: 'enrollments',
    action: 'manage',
  },
  {
    name: 'enrollments:view',
    description: 'View enrollment data',
    module: 'enrollments',
    action: 'view',
  },

  // Evaluations
  {
    name: 'evaluations:submit',
    description: 'Submit evaluation answers',
    module: 'evaluations',
    action: 'submit',
  },
  {
    name: 'evaluations:view',
    description: 'View evaluation results',
    module: 'evaluations',
    action: 'view',
  },
  {
    name: 'evaluations:create',
    description: 'Create evaluations',
    module: 'evaluations',
    action: 'create',
  },
  {
    name: 'evaluations:grade',
    description: 'Grade evaluations',
    module: 'evaluations',
    action: 'grade',
  },

  // Reports
  {
    name: 'reports:view',
    description: 'View reports and analytics',
    module: 'reports',
    action: 'view',
  },
  { name: 'reports:export', description: 'Export reports', module: 'reports', action: 'export' },

  // Admin
  {
    name: 'admin:settings',
    description: 'Manage system settings',
    module: 'admin',
    action: 'settings',
  },

  // Progress
  { name: 'progress:own', description: 'View own progress', module: 'progress', action: 'own' },
  {
    name: 'progress:all',
    description: 'View all users progress',
    module: 'progress',
    action: 'all',
  },
];

/**
 * Maps roles to their default permission names.
 */
export const ROLE_DEFAULT_PERMISSIONS: Record<UserRole, string[]> = {
  [USER_ROLE.ADMINISTRADOR]: [
    'auth:login',
    'users:list',
    'users:view',
    'users:manage',
    'courses:list',
    'courses:view',
    'courses:delete',
    'enrollments:manage',
    'enrollments:view',
    'evaluations:view',
    'evaluations:grade',
    'reports:view',
    'reports:export',
    'admin:sync',
    'admin:settings',
    'progress:all',
  ],
  [USER_ROLE.INSTRUCTOR]: [
    'auth:login',
    'users:list',
    'users:view',
    'courses:list',
    'courses:view',
    'courses:create',
    'courses:edit',
    'courses:publish',
    'enrollments:view',
    'evaluations:create',
    'evaluations:grade',
    'reports:view',
    'progress:all',
  ],
  [USER_ROLE.COLABORADOR]: [
    'auth:login',
    'courses:list',
    'courses:view',
    'enrollments:self',
    'evaluations:submit',
    'progress:own',
  ],
};
