import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LESSON_TYPE } from '@lms/shared';

import type { LessonType } from '@lms/shared';

export class CreateLessonDto {
  @ApiProperty({ example: 'Lección 1: ¿Qué es la banca digital?' })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({ example: 'Descripción de la lección...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'text',
    enum: Object.values(LESSON_TYPE),
  })
  @IsOptional()
  @IsEnum(Object.values(LESSON_TYPE))
  type?: LessonType;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;

  @ApiPropertyOptional({ example: 15, description: 'Duration in minutes' })
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedDuration?: number;
}
