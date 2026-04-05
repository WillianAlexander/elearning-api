import { IsOptional, IsObject, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLessonProgressDto {
  @ApiPropertyOptional({
    example: { blockIndex: 3, scrollOffset: 250 },
    description: 'Bookmark position for resume',
  })
  @IsOptional()
  @IsObject()
  lastPosition?: Record<string, unknown>;

  @ApiPropertyOptional({ example: 120, description: 'Time spent in seconds to add' })
  @IsOptional()
  @IsInt()
  @Min(0)
  timeSpentSeconds?: number;
}
