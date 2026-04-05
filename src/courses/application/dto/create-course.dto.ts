import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsInt,
  IsArray,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DIFFICULTY_LEVEL } from '@lms/shared';

import type { DifficultyLevel } from '@lms/shared';

export class CreateCourseDto {
  @ApiProperty({ example: 'Introducción a la Banca Digital' })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({ example: 'Curso completo sobre banca digital...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/thumbnail.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  thumbnailUrl?: string;

  @ApiPropertyOptional({ example: 120, description: 'Duration in minutes' })
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedDuration?: number;

  @ApiPropertyOptional({
    example: 'beginner',
    enum: Object.values(DIFFICULTY_LEVEL),
  })
  @IsOptional()
  @IsEnum(Object.values(DIFFICULTY_LEVEL))
  difficultyLevel?: DifficultyLevel;

  @ApiPropertyOptional({ example: 'uuid-of-category' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    example: ['uuid-tag-1', 'uuid-tag-2'],
    description: 'Array of tag IDs',
  })
  @IsOptional()
  @IsArray()
  @ValidateIf((o: CreateCourseDto) => !o.tagNames)
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @ApiPropertyOptional({
    example: ['TypeScript', 'NestJS'],
    description: 'Array of tag names — tags are created if they do not exist',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  tagNames?: string[];
}
