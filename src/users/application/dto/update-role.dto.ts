import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { USER_ROLE } from '@lms/shared';

import type { UserRole } from '@lms/shared';

export class UpdateRoleDto {
  @ApiProperty({
    example: 'instructor',
    enum: Object.values(USER_ROLE),
    description: 'New role to assign',
  })
  @IsEnum(Object.values(USER_ROLE))
  role!: UserRole;
}
