import { IsString, MaxLength, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRubricDto {
  @ApiPropertyOptional({ description: 'Rubric title' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ description: 'Rubric description' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
