import {
  IsString,
  IsUUID,
  IsOptional,
  IsArray,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RubricScoreEntryDto {
  @ApiProperty({ description: 'Criterion ID' })
  @IsUUID()
  criterionId!: string;

  @ApiProperty({ description: 'Selected level ID' })
  @IsUUID()
  levelId!: string;

  @ApiPropertyOptional({ description: 'Optional comment for this criterion' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}

export class CreateRubricEvaluationDto {
  @ApiProperty({ description: 'Enrollment ID to evaluate' })
  @IsUUID()
  enrollmentId!: string;

  @ApiProperty({
    description: 'Scores per criterion',
    type: [RubricScoreEntryDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RubricScoreEntryDto)
  scores!: RubricScoreEntryDto[];

  @ApiPropertyOptional({ description: 'General feedback' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  feedback?: string;
}
