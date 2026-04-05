import { IsUUID, IsArray, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class SurveyAnswerDto {
  @ApiProperty({ description: 'Question ID from the template' })
  @IsString()
  questionId!: string;

  @ApiProperty({ description: 'Answer value (string for text, number as string for rating)' })
  value!: string | number;
}

export class SubmitSurveyResponseDto {
  @ApiProperty({ description: 'Survey template ID' })
  @IsUUID()
  templateId!: string;

  @ApiProperty({ description: 'Enrollment ID (proves course completion)' })
  @IsUUID()
  enrollmentId!: string;

  @ApiProperty({ description: 'Answers to survey questions', type: [SurveyAnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SurveyAnswerDto)
  answers!: SurveyAnswerDto[];
}
