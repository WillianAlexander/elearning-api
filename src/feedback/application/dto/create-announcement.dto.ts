import { IsString, MaxLength, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAnnouncementDto {
  @ApiProperty({ description: 'Announcement title' })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiProperty({ description: 'Announcement content' })
  @IsString()
  @MaxLength(10000)
  content!: string;

  @ApiPropertyOptional({ description: 'Publish date (null = draft)' })
  @IsOptional()
  @IsDateString()
  publishedAt?: string;
}
