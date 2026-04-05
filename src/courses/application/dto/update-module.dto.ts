import { IsString, IsOptional, MaxLength, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateModuleDto {
  @ApiPropertyOptional({ example: 'Módulo 1: Fundamentos Actualizados' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: 'Descripción actualizada...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Prerequisite module ID (must complete before accessing this module)' })
  @IsOptional()
  @IsUUID()
  prerequisiteModuleId?: string | null;
}
