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
import { Throttle } from '@nestjs/throttler';

import { USER_ROLE } from '@lms/shared';

import { BulkEmailService } from '../application/bulk-email.service';
import { SendBulkEmailDto } from '../application/dto/send-bulk-email.dto';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/presentation/guards/roles.guard';
import { Roles } from '../../auth/presentation/decorators/roles.decorator';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/domain';

@ApiTags('Bulk Email')
@Controller('courses/:courseId/email')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BulkEmailController {
  constructor(private readonly bulkEmailService: BulkEmailService) {}

  @Post()
  @Roles(USER_ROLE.INSTRUCTOR, USER_ROLE.ADMINISTRADOR)
  @Throttle({ default: { limit: 3, ttl: 300000 } })
  @ApiOperation({ summary: 'Send bulk email to all enrolled users (instructor only)' })
  async send(
    @CurrentUser() user: AuthenticatedUser,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: SendBulkEmailDto,
  ) {
    return this.bulkEmailService.sendBulkEmail(courseId, user.id, dto);
  }

  @Get('history')
  @Roles(USER_ROLE.INSTRUCTOR, USER_ROLE.ADMINISTRADOR)
  @ApiOperation({ summary: 'Get email campaign history for a course (instructor/admin)' })
  async history(
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ) {
    return this.bulkEmailService.getCampaignHistory(courseId);
  }
}
