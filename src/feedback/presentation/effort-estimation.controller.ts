import {
  Controller,
  Post,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { USER_ROLE } from '@lms/shared';

import { EffortEstimationService } from '../application/effort-estimation.service';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/presentation/guards/roles.guard';
import { Roles } from '../../auth/presentation/decorators/roles.decorator';

@ApiTags('Effort Estimation')
@Controller('lessons/:lessonId/estimate')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EffortEstimationController {
  constructor(
    private readonly estimationService: EffortEstimationService,
  ) {}

  @Post()
  @Roles(USER_ROLE.ADMINISTRADOR, USER_ROLE.INSTRUCTOR)
  @ApiOperation({ summary: 'Recalculate estimated duration for a lesson from its content blocks' })
  async recalculate(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
  ) {
    const estimatedMinutes = await this.estimationService.recalculateForLesson(lessonId);
    return { lessonId, estimatedDuration: estimatedMinutes };
  }
}
