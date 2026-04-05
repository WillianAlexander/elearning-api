import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

import type { UserRole } from '../../shared';

/**
 * RBAC service for checking permissions.
 * Permissions are stored in the database and cached for performance.
 */
@Injectable()
export class RbacService {
  private readonly logger = new Logger(RbacService.name);

  /** Cache: role -> permission names */
  private permissionCache: Map<string, Set<string>> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if a role has a specific permission.
   */
  async hasPermission(role: UserRole, permissionName: string): Promise<boolean> {
    const permissions = await this.getPermissionsForRole(role);
    return permissions.has(permissionName);
  }

  /**
   * Check if a role has ALL of the specified permissions.
   */
  async hasPermissions(role: UserRole, permissionNames: string[]): Promise<boolean> {
    const permissions = await this.getPermissionsForRole(role);
    return permissionNames.every((name) => permissions.has(name));
  }

  /**
   * Get all permission names for a given role.
   */
  async getPermissionsForRole(role: UserRole): Promise<Set<string>> {
    // Check cache first
    const cached = this.permissionCache.get(role);
    if (cached) return cached;

    // Query database
    const rolePermissions = await (this.prisma as any).rolePermission.findMany({
      where: { role },
    });

    const permissionIds = rolePermissions.map((rp: any) => rp.permissionId as string);

    if (permissionIds.length === 0) {
      const emptySet = new Set<string>();
      this.permissionCache.set(role, emptySet);
      return emptySet;
    }

    const permissions = await (this.prisma as any).permission.findMany({
      where: { id: { in: permissionIds } },
    });

    const permissionNames = new Set<string>(permissions.map((p: any) => p.name as string));
    this.permissionCache.set(role, permissionNames);

    return permissionNames;
  }

  /**
   * Clear the permission cache (e.g., after permissions are updated).
   */
  clearCache(): void {
    this.permissionCache.clear();
    this.logger.log('Permission cache cleared');
  }
}
