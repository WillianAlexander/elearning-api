import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { LessonNotesService } from '../application/lesson-notes.service';
import { SaveNoteDto } from '../application/dto/save-note.dto';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/presentation/guards/roles.guard';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/domain';

@ApiTags('Lesson Notes')
@Controller('notes')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LessonNotesController {
  constructor(private readonly notesService: LessonNotesService) {}

  @Get('lesson/:lessonId')
  @ApiOperation({ summary: 'Get the current user note for a lesson' })
  async getNote(
    @CurrentUser() user: AuthenticatedUser,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
  ) {
    return this.notesService.getNote(user.id, lessonId);
  }

  @Put('lesson/:lessonId')
  @ApiOperation({ summary: 'Create or update a note for a lesson (upsert)' })
  async saveNote(
    @CurrentUser() user: AuthenticatedUser,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() dto: SaveNoteDto,
  ) {
    return this.notesService.saveNote(user.id, lessonId, dto.content);
  }

  @Delete('lesson/:lessonId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a note for a lesson' })
  async deleteNote(
    @CurrentUser() user: AuthenticatedUser,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
  ) {
    await this.notesService.deleteNote(user.id, lessonId);
  }
}
