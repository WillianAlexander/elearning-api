import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { USER_ROLE } from '@lms/shared';

import type { UserRole } from '@lms/shared';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'jperez@cooperativa.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Juan' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Perez' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  lastName?: string;

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

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
