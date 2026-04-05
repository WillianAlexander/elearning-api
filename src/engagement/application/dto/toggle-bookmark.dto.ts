import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToggleBookmarkDto {
  @ApiProperty({ description: 'Lesson ID to bookmark/unbookmark' })
  @IsUUID()
  lessonId!: string;

  @ApiProperty({ description: 'Course ID the lesson belongs to' })
  @IsUUID()
  courseId!: string;
}
