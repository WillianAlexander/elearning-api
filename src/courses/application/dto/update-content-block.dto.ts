import { IsOptional, IsEnum, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CONTENT_BLOCK_TYPE } from '@lms/shared';

import type { ContentBlockType } from '@lms/shared';

export class UpdateContentBlockDto {
  @ApiPropertyOptional({
    example: 'video',
    enum: Object.values(CONTENT_BLOCK_TYPE),
  })
  @IsOptional()
  @IsEnum(Object.values(CONTENT_BLOCK_TYPE))
  type?: ContentBlockType;

  @ApiPropertyOptional({
    example: { url: 'https://storage.example.com/video.mp4', duration: 300 },
  })
  @IsOptional()
  @IsObject()
  content?: Record<string, unknown>;
}
