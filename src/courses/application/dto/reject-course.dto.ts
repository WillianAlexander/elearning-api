import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectCourseDto {
  @ApiProperty({
    example: 'El curso necesita más contenido en el módulo 3.',
    description: 'Reason for rejecting the course back to draft status',
  })
  @IsString()
  @MinLength(10, { message: 'El motivo de rechazo debe tener al menos 10 caracteres' })
  @MaxLength(1000)
  reason!: string;
}
