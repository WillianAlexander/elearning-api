import { IsString, IsOptional, IsInt, MaxLength, Min, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateModuleDto {
  @ApiProperty({ example: 'Módulo 1: Fundamentos' })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({ example: 'Descripción del módulo...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 0, description: 'Position in the module list' })
  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;

  @ApiPropertyOptional({ description: 'Prerequisite module ID (must complete before accessing this module)' })
  @IsOptional()
  @IsUUID()
  prerequisiteModuleId?: string | null;
}
