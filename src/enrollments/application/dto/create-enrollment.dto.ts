import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEnrollmentDto {
  @ApiProperty({ example: 'uuid-of-course', description: 'Course ID to enroll in' })
  @IsUUID()
  courseId!: string;
}
