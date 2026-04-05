import {
  IsOptional,
  IsEnum,
  IsInt,
  IsObject,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CONTENT_BLOCK_TYPE } from '@lms/shared';

import type { ContentBlockType } from '@lms/shared';

export class CreateContentBlockDto {
  @ApiProperty({
    example: 'text',
    enum: Object.values(CONTENT_BLOCK_TYPE),
  })
  @IsEnum(Object.values(CONTENT_BLOCK_TYPE))
  type!: ContentBlockType;

  @ApiProperty({
    example: { html: '<p>Rich text content here...</p>' },
    description: 'Block-specific data stored as JSON',
  })
  @IsObject()
  content!: Record<string, unknown>;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}
