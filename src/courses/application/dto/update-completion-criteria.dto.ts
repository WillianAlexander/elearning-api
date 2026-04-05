import { IsBoolean, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCompletionCriteriaDto {
  @ApiPropertyOptional({ description: 'Require all lessons completed', default: true })
  @IsOptional()
  @IsBoolean()
  requireAllLessons?: boolean;

  @ApiPropertyOptional({ description: 'Require quiz pass for completion', default: false })
  @IsOptional()
  @IsBoolean()
  requireQuizPass?: boolean;

  @ApiPropertyOptional({ description: 'Minimum quiz score percentage (0-100)', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  minQuizScore?: number;
}
