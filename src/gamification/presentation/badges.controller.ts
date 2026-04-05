import {
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { BadgesService } from '../application/badges.service';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/presentation/guards/roles.guard';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/domain';

@ApiTags('Badges')
@Controller('badges')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  @Get()
  @ApiOperation({ summary: 'List all badge definitions' })
  async listAll() {
    return this.badgesService.getAllDefinitions();
  }

  @Get('my')
  @ApiOperation({ summary: 'List badges earned by the current user' })
  async listMy(@CurrentUser() user: AuthenticatedUser) {
    return this.badgesService.getUserBadges(user.id);
  }

  @Post('evaluate')
  @ApiOperation({ summary: 'Evaluate and award any new badges for the current user' })
  async evaluate(@CurrentUser() user: AuthenticatedUser) {
    const newBadges = await this.badgesService.evaluateBadges(user.id);
    return {
      newBadges,
      count: newBadges.length,
    };
  }
}
