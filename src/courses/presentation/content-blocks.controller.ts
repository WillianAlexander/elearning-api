import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { USER_ROLE } from '@lms/shared';

import { ContentBlocksService } from '../application/content-blocks.service';
import { CreateContentBlockDto } from '../application/dto/create-content-block.dto';
import { UpdateContentBlockDto } from '../application/dto/update-content-block.dto';
import { ReorderDto } from '../application/dto/reorder.dto';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/presentation/guards/roles.guard';
import { Roles } from '../../auth/presentation/decorators/roles.decorator';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/domain/types';

@ApiTags('Content Blocks')
@Controller('lessons/:lessonId/blocks')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ContentBlocksController {
  constructor(
    private readonly contentBlocksService: ContentBlocksService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(USER_ROLE.INSTRUCTOR)
  @ApiOperation({ summary: 'Create a content block within a lesson (owner only)' })
  async create(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() dto: CreateContentBlockDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.contentBlocksService.create(lessonId, dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List content blocks in a lesson' })
  async findAll(@Param('lessonId', ParseUUIDPipe) lessonId: string) {
    return this.contentBlocksService.findByLessonId(lessonId);
  }

  @Put(':id')
  @Roles(USER_ROLE.INSTRUCTOR)
  @ApiOperation({ summary: 'Update a content block (owner only)' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContentBlockDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.contentBlocksService.update(id, dto, user);
  }

  @Patch('reorder')
  @Roles(USER_ROLE.INSTRUCTOR)
  @ApiOperation({ summary: 'Reorder content blocks within a lesson (owner only)' })
  async reorder(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() dto: ReorderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.contentBlocksService.reorder(lessonId, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(USER_ROLE.INSTRUCTOR)
  @ApiOperation({ summary: 'Soft delete a content block (owner only)' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.contentBlocksService.softDelete(id, user);
  }

  @Get('versions')
  @ApiOperation({ summary: 'List content versions for a lesson' })
  async listVersions(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
  ) {
    return this.contentBlocksService.listVersions(lessonId);
  }

  @Post('versions')
  @HttpCode(HttpStatus.CREATED)
  @Roles(USER_ROLE.INSTRUCTOR)
  @ApiOperation({ summary: 'Create a content version snapshot (owner only)' })
  async createVersion(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.contentBlocksService.createVersion(lessonId, user.id, user);
  }
}
