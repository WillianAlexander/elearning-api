import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { VideoWatchService } from '../application/video-watch.service';
import { VideoHeartbeatDto } from '../application/dto/video-heartbeat.dto';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/presentation/guards/roles.guard';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/domain';

@ApiTags('Engagement')
@Controller('engagement/video-watch')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class VideoWatchController {
  constructor(private readonly videoWatchService: VideoWatchService) {}

  @Post()
  @ApiOperation({ summary: 'Send video watch heartbeat (POST every 15s)' })
  async heartbeat(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: VideoHeartbeatDto,
  ) {
    return this.videoWatchService.processHeartbeat(user.id, dto);
  }

  @Get('lesson/:lessonId')
  @ApiOperation({ summary: 'Get video watch logs for a lesson' })
  async getByLesson(
    @CurrentUser() user: AuthenticatedUser,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
  ) {
    return this.videoWatchService.getByLesson(user.id, lessonId);
  }
}
