import { IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendBulkEmailDto {
  @ApiProperty({ description: 'Email subject' })
  @IsString()
  @MaxLength(255)
  subject!: string;

  @ApiProperty({ description: 'Email body (HTML supported)' })
  @IsString()
  @MaxLength(50000)
  body!: string;
}
