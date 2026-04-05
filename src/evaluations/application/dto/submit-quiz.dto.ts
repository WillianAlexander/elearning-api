import {
  IsUUID,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsString,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class QuizAnswerDto {
  @ApiProperty({ example: 'q1' })
  @IsString()
  questionId!: string;

  @ApiProperty({
    example: 'opt-a',
    description: 'For multiple_choice and true_false questions. Use empty string for multiple_select.',
  })
  @IsString()
  selectedOptionId!: string;

  @ApiPropertyOptional({
    example: ['opt-a', 'opt-b'],
    description: 'For multiple_select questions — all selected option ids.',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedOptionIds?: string[];
}

export class SubmitQuizDto {
  @ApiProperty({ example: 'uuid-of-content-block' })
  @IsUUID()
  contentBlockId!: string;

  @ApiProperty({ type: [QuizAnswerDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerDto)
  answers!: QuizAnswerDto[];
}
