import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { BookmarksService } from '../application/bookmarks.service';
import { ToggleBookmarkDto } from '../application/dto/toggle-bookmark.dto';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/presentation/guards/roles.guard';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/domain';

@ApiTags('Bookmarks')
@Controller('bookmarks')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post('toggle')
  @ApiOperation({ summary: 'Toggle bookmark on a lesson (add/remove)' })
  async toggle(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ToggleBookmarkDto,
  ) {
    return this.bookmarksService.toggle(user.id, dto.lessonId, dto.courseId);
  }

  @Get()
  @ApiOperation({ summary: 'List all bookmarks for the current user' })
  async listMy(@CurrentUser() user: AuthenticatedUser) {
    return this.bookmarksService.listByUser(user.id);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'List bookmarks for a specific course' })
  async listByCourse(
    @CurrentUser() user: AuthenticatedUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ) {
    return this.bookmarksService.listByUserAndCourse(user.id, courseId);
  }
}
