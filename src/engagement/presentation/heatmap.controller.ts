import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { DailyActivityService } from '../application/daily-activity.service';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/presentation/guards/roles.guard';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/domain';

@ApiTags('Engagement')
@Controller('engagement/heatmap')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class HeatmapController {
  constructor(private readonly activityService: DailyActivityService) {}

  @Get()
  @ApiOperation({ summary: 'Get activity heatmap data for current user' })
  @ApiQuery({ name: 'months', required: false, type: Number, description: 'Number of months (default: 6)' })
  async getHeatmap(
    @CurrentUser() user: AuthenticatedUser,
    @Query('months') months?: string,
  ) {
    const monthsNum = months ? parseInt(months, 10) : 6;
    return this.activityService.getHeatmap(user.id, monthsNum);
  }
}
