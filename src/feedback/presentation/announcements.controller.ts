import {
  Controller,
  Get,
  Post,
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

import { USER_ROLE } from '@lms/shared';

import { AnnouncementsService } from '../application/announcements.service';
import { CreateAnnouncementDto } from '../application/dto/create-announcement.dto';
import { UpdateAnnouncementDto } from '../application/dto/update-announcement.dto';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/presentation/guards/roles.guard';
import { Roles } from '../../auth/presentation/decorators/roles.decorator';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/domain';

@ApiTags('Announcements')
@Controller('courses/:courseId/announcements')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(USER_ROLE.INSTRUCTOR, USER_ROLE.ADMINISTRADOR)
  @ApiOperation({ summary: 'Create an announcement (instructor only)' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: CreateAnnouncementDto,
  ) {
    return this.announcementsService.create(courseId, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List announcements for a course' })
  async list(
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ) {
    return this.announcementsService.findByCourse(courseId);
  }

  @Put(':announcementId')
  @Roles(USER_ROLE.INSTRUCTOR, USER_ROLE.ADMINISTRADOR)
  @ApiOperation({ summary: 'Update an announcement (author only)' })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('announcementId', ParseUUIDPipe) announcementId: string,
    @Body() dto: UpdateAnnouncementDto,
  ) {
    return this.announcementsService.update(announcementId, user.id, dto);
  }

  @Delete(':announcementId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(USER_ROLE.INSTRUCTOR, USER_ROLE.ADMINISTRADOR)
  @ApiOperation({ summary: 'Delete an announcement (author only)' })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('announcementId', ParseUUIDPipe) announcementId: string,
  ) {
    await this.announcementsService.remove(announcementId, user.id);
  }
}
