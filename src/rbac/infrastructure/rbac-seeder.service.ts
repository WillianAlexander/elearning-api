import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

import { USER_ROLE } from '../../shared';

import { DEFAULT_PERMISSIONS, ROLE_DEFAULT_PERMISSIONS } from './seeds/permissions.seed';

/**
 * Seeds the database with default permissions and role mappings on startup.
 * Also creates a default admin user if none exists.
 */
@Injectable()
export class RbacSeederService implements OnModuleInit {
  private readonly logger = new Logger(RbacSeederService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await this.seedPermissions();
    await this.seedRolePermissions();
    await this.seedDefaultAdmin();
    await this.seedSuperAdmin();
  }

  private async seedPermissions(): Promise<void> {
    let created = 0;

    for (const permData of DEFAULT_PERMISSIONS) {
      const existing = await this.prisma.permission.findFirst({
        where: { name: permData.name },
      });

      if (!existing) {
        await this.prisma.permission.create({
          data: permData,
        });
        created++;
      }
    }

    if (created > 0) {
      this.logger.log(`Seeded ${created} permissions`);
    }
  }

  private async seedRolePermissions(): Promise<void> {
    let created = 0;
    const roles = [USER_ROLE.ADMINISTRADOR, USER_ROLE.INSTRUCTOR, USER_ROLE.COLABORADOR] as const;

    for (const role of roles) {
      const permissionNames = ROLE_DEFAULT_PERMISSIONS[role];

      for (const permName of permissionNames) {
        const permission = await this.prisma.permission.findFirst({
          where: { name: permName },
        });

        if (!permission) continue;

        const existing = await this.prisma.rolePermission.findFirst({
          where: { role, permissionId: permission.id },
        });

        if (!existing) {
          await this.prisma.rolePermission.create({
            data: {
              role,
              permissionId: permission.id,
            },
          });
          created++;
        }
      }
    }

    if (created > 0) {
      this.logger.log(`Seeded ${created} role-permission mappings`);
    }
  }

  private async seedDefaultAdmin(): Promise<void> {
    const adminEmail = 'admin@cooperativa.com';
    const existing = await this.prisma.user.findFirst({
      where: { email: adminEmail, deletedAt: null },
    });

    if (!existing) {
      await this.prisma.user.create({
        data: {
          cedula: '0000000001',
          email: adminEmail,
          firstName: 'Admin',
          lastName: 'Sistema',
          role: USER_ROLE.ADMINISTRADOR,
          area: 'Tecnologia de la Informacion',
          cargo: 'Administrador del Sistema',
          isActive: true,
        },
      });
      this.logger.log('Created default admin user: admin@cooperativa.com');
    }
  }

  private async seedSuperAdmin(): Promise<void> {
    const superAdminEmail = 'glituma@gmail.com';
    const existing = await this.prisma.user.findFirst({
      where: { email: superAdminEmail, deletedAt: null },
    });

    if (!existing) {
      await this.prisma.user.create({
        data: {
          email: superAdminEmail,
          firstName: 'Jefferson',
          lastName: 'Lituma',
          role: USER_ROLE.ADMINISTRADOR,
          area: 'Tecnologia de la Informacion',
          cargo: 'Jefe de Tecnologia',
          isActive: true,
        },
      });
      this.logger.log(`Created super admin user: ${superAdminEmail}`);
    }
  }
}
