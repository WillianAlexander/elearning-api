import {
  IsString,
  MaxLength,
  IsOptional,
  IsUUID,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class SurveyQuestionDto {
  @ApiProperty({ description: 'Unique question ID' })
  @IsString()
  id!: string;

  @ApiProperty({ description: 'Question text' })
  @IsString()
  @MaxLength(500)
  text!: string;

  @ApiProperty({ description: 'Question type', enum: ['rating', 'text'] })
  @IsIn(['rating', 'text'])
  type!: 'rating' | 'text';

  @ApiProperty({ description: 'Whether the question is required' })
  @IsBoolean()
  required!: boolean;
}

export class CreateSurveyTemplateDto {
  @ApiProperty({ description: 'Survey title' })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({ description: 'Survey description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'Course to assign this survey to' })
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @ApiProperty({ description: 'Survey questions', type: [SurveyQuestionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SurveyQuestionDto)
  questions!: SurveyQuestionDto[];
}
