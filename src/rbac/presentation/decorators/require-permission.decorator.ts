import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to require specific permissions for a route.
 * Used with PermissionsGuard to enforce permission-based access.
 *
 * @example
 * ```ts
 * @RequirePermission('courses:create')
 * @Post()
 * createCourse() { ... }
 * ```
 */
export const RequirePermission = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
