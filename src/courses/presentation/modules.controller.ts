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

import { ModulesService } from '../application/modules.service';
import { CreateModuleDto } from '../application/dto/create-module.dto';
import { UpdateModuleDto } from '../application/dto/update-module.dto';
import { ReorderDto } from '../application/dto/reorder.dto';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/presentation/guards/roles.guard';
import { Roles } from '../../auth/presentation/decorators/roles.decorator';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/domain/types';

@ApiTags('Course Modules')
@Controller('courses/:courseId/modules')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(USER_ROLE.INSTRUCTOR)
  @ApiOperation({ summary: 'Create a module within a course (owner only)' })
  async create(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: CreateModuleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.modulesService.create(courseId, dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List modules in a course' })
  async findAll(@Param('courseId', ParseUUIDPipe) courseId: string) {
    return this.modulesService.findByCourseId(courseId);
  }

  @Put(':id')
  @Roles(USER_ROLE.INSTRUCTOR)
  @ApiOperation({ summary: 'Update a module (owner only)' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateModuleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.modulesService.update(id, dto, user);
  }

  @Patch('reorder')
  @Roles(USER_ROLE.INSTRUCTOR)
  @ApiOperation({ summary: 'Reorder modules within a course (owner only)' })
  async reorder(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: ReorderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.modulesService.reorder(courseId, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(USER_ROLE.INSTRUCTOR)
  @ApiOperation({ summary: 'Soft delete a module (owner only)' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.modulesService.softDelete(id, user);
  }
}
