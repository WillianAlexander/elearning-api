import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateOutlineDto {
  @ApiProperty({ description: 'Topic for the course outline', example: 'Seguridad Informática' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  topic!: string;

  @ApiPropertyOptional({ description: 'Additional notes or context for the AI', example: 'Enfocado en phishing y contraseñas seguras' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
