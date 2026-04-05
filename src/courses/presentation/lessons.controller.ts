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

import { LessonsService } from '../application/lessons.service';
import { CreateLessonDto } from '../application/dto/create-lesson.dto';
import { UpdateLessonDto } from '../application/dto/update-lesson.dto';
import { ReorderDto } from '../application/dto/reorder.dto';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/presentation/guards/roles.guard';
import { Roles } from '../../auth/presentation/decorators/roles.decorator';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/domain/types';

@ApiTags('Lessons')
@Controller('courses/:courseId/modules/:moduleId/lessons')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(USER_ROLE.INSTRUCTOR)
  @ApiOperation({ summary: 'Create a lesson within a module (owner only)' })
  async create(
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @Body() dto: CreateLessonDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.lessonsService.create(moduleId, dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List lessons in a module' })
  async findAll(@Param('moduleId', ParseUUIDPipe) moduleId: string) {
    return this.lessonsService.findByModuleId(moduleId);
  }

  @Put(':id')
  @Roles(USER_ROLE.INSTRUCTOR)
  @ApiOperation({ summary: 'Update a lesson (owner only)' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLessonDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.lessonsService.update(id, dto, user);
  }

  @Patch('reorder')
  @Roles(USER_ROLE.INSTRUCTOR)
  @ApiOperation({ summary: 'Reorder lessons within a module (owner only)' })
  async reorder(
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @Body() dto: ReorderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.lessonsService.reorder(moduleId, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(USER_ROLE.INSTRUCTOR)
  @ApiOperation({ summary: 'Soft delete a lesson (owner only)' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.lessonsService.softDelete(id, user);
  }
}
