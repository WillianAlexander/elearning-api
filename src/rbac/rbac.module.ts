import { Module } from '@nestjs/common';

import { RbacService } from './application/rbac.service';
import { RbacSeederService } from './infrastructure/rbac-seeder.service';
import { PermissionsGuard } from './presentation/guards/permissions.guard';

@Module({
  providers: [RbacService, RbacSeederService, PermissionsGuard],
  exports: [RbacService, PermissionsGuard],
})
export class RbacModule {}
