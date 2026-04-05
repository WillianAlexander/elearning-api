import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SaveNoteDto {
  @ApiProperty({ description: 'Note content (plain text or markdown)' })
  @IsString()
  @MinLength(1)
  content!: string;
}
