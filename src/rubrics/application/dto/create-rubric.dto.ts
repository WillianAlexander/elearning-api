import {
  IsString,
  MaxLength,
  IsOptional,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRubricLevelDto {
  @ApiProperty({ description: 'Level label (e.g., "Excelente")' })
  @IsString()
  @MaxLength(100)
  label!: string;

  @ApiPropertyOptional({ description: 'Level description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ description: 'Score for this level' })
  @IsInt()
  @Min(0)
  score!: number;

  @ApiProperty({ description: 'Display order' })
  @IsInt()
  @Min(0)
  orderIndex!: number;
}

export class CreateRubricCriterionDto {
  @ApiProperty({ description: 'Criterion name' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ description: 'Criterion description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ description: 'Weight of this criterion', default: 1 })
  @IsInt()
  @Min(1)
  weight!: number;

  @ApiProperty({ description: 'Display order' })
  @IsInt()
  @Min(0)
  orderIndex!: number;

  @ApiProperty({ description: 'Scoring levels', type: [CreateRubricLevelDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRubricLevelDto)
  levels!: CreateRubricLevelDto[];
}

export class CreateRubricDto {
  @ApiProperty({ description: 'Rubric title' })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({ description: 'Rubric description' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Criteria with levels (can be added later)',
    type: [CreateRubricCriterionDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRubricCriterionDto)
  criteria?: CreateRubricCriterionDto[];
}
