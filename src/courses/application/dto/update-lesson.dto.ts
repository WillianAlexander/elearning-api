import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LESSON_TYPE } from '@lms/shared';

import type { LessonType } from '@lms/shared';

export class UpdateLessonDto {
  @ApiPropertyOptional({ example: 'Lección 1 actualizada' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: 'Descripción actualizada...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'video',
    enum: Object.values(LESSON_TYPE),
  })
  @IsOptional()
  @IsEnum(Object.values(LESSON_TYPE))
  type?: LessonType;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedDuration?: number;
}
