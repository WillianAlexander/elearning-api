import { SetMetadata } from '@nestjs/common';

import type { UserRole } from '@lms/shared';

export const ROLES_KEY = 'roles';

/**
 * Decorator to set required roles for a route.
 * Used with RolesGuard to enforce role-based access control.
 *
 * @example
 * ```ts
 * @Roles(USER_ROLE.ADMINISTRADOR)
 * @Get('admin-only')
 * adminEndpoint() { ... }
 * ```
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
