import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  IsIn,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { USER_ROLE } from '@lms/shared';

import type { UserRole } from '@lms/shared';

export class CreateUserDto {
  @ApiProperty({ example: 'jperez@cooperativa.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  @MaxLength(150)
  firstName!: string;

  @ApiProperty({ example: 'Perez' })
  @IsString()
  @MaxLength(150)
  lastName!: string;

  @ApiPropertyOptional({
    example: 'colaborador',
    enum: Object.values(USER_ROLE),
  })
  @IsOptional()
  @IsEnum(Object.values(USER_ROLE))
  role?: UserRole;

  @ApiPropertyOptional({ example: 'Operaciones' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  area?: string;

  @ApiPropertyOptional({ example: 'Cajero' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  cargo?: string;

  @ApiPropertyOptional({ example: 'azure-ad-object-id-here' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  azureAdId?: string;
}

/**
 * DTO for manual admin user creation.
 * Only allows INSTRUCTOR or ADMINISTRADOR roles —
 * COLABORADOR users are auto-provisioned via Azure AD.
 */
const ADMIN_ALLOWED_ROLES = [
  USER_ROLE.INSTRUCTOR,
  USER_ROLE.ADMINISTRADOR,
] as const;

export class AdminCreateUserDto {
  @ApiProperty({ example: 'jperez@cooperativa.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  @MaxLength(150)
  firstName!: string;

  @ApiProperty({ example: 'Perez' })
  @IsString()
  @MaxLength(150)
  lastName!: string;

  @ApiProperty({
    example: 'instructor',
    enum: ADMIN_ALLOWED_ROLES,
    description:
      'Only instructor or administrador. Colaboradores come via Azure AD.',
  })
  @IsIn(ADMIN_ALLOWED_ROLES, {
    message:
      'Solo se permite crear usuarios con rol instructor o administrador. Los colaboradores se provisionan via Azure AD.',
  })
  role!: UserRole;

  @ApiPropertyOptional({ example: 'Operaciones' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  area?: string;

  @ApiPropertyOptional({ example: 'Cajero' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  cargo?: string;
}
