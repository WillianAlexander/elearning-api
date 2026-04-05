import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateQuizDto {
  @ApiPropertyOptional({
    description: 'Number of questions to generate (default: 5, max: 20)',
    example: 5,
    default: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  questionCount?: number;
}
