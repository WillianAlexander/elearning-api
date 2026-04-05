import { IsUUID, IsInt, Min, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VideoHeartbeatDto {
  @ApiProperty({ description: 'Lesson ID containing the video' })
  @IsUUID()
  lessonId!: string;

  @ApiProperty({ description: 'Content block ID of the video' })
  @IsUUID()
  contentBlockId!: string;

  @ApiProperty({ description: 'Total seconds watched so far' })
  @IsInt()
  @Min(0)
  watchedSeconds!: number;

  @ApiProperty({ description: 'Total duration of the video in seconds' })
  @IsInt()
  @Min(0)
  totalDuration!: number;

  @ApiProperty({ description: 'Current playback position in seconds' })
  @IsNumber()
  @Min(0)
  position!: number;
}
