import {
  Post,
  Body,
  Param,
  Controller,
  UseGuards,
  ParseUUIDPipe,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { USER_ROLE } from '@lms/shared';

import { AiGenerationService } from '../application/ai-generation.service';
import { GenerateOutlineDto } from '../application/dto/generate-outline.dto';
import { GenerateQuizDto } from '../application/dto/generate-quiz.dto';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/presentation/guards/roles.guard';
import { Roles } from '../../auth/presentation/decorators/roles.decorator';
import { ContentBlocksService } from '../../courses/application/content-blocks.service';

@ApiTags('AI Generation')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Throttle({ default: { limit: 5, ttl: 60000 } })
export class AiGenerationController {
  constructor(
    private readonly aiGenerationService: AiGenerationService,
    private readonly contentBlocksService: ContentBlocksService,
  ) {}

  @Post('courses/generate-outline')
  @Roles(USER_ROLE.INSTRUCTOR, USER_ROLE.ADMINISTRADOR)
  @ApiOperation({ summary: 'Generate a course outline using AI (instructor/admin only)' })
  async generateOutline(@Body() dto: GenerateOutlineDto) {
    return this.aiGenerationService.generateCourseOutline(dto.topic, dto.notes);
  }

  @Post('lessons/:lessonId/generate-quiz')
  @Roles(USER_ROLE.INSTRUCTOR, USER_ROLE.ADMINISTRADOR)
  @ApiOperation({ summary: 'Generate quiz questions from lesson content using AI (instructor/admin only)' })
  async generateQuiz(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() dto: GenerateQuizDto,
  ) {
    const blocks = await this.contentBlocksService.findByLessonId(lessonId);
    const textBlocks = blocks.filter((b) => b.type === 'text');

    if (textBlocks.length === 0) {
      throw new NotFoundException(
        `No text content blocks found for lesson ${lessonId}. Add text content before generating a quiz.`,
      );
    }

    const lessonContent = textBlocks
      .map((b) => {
        const content = b.content as { text?: string };
        return content.text ?? '';
      })
      .filter((text) => text.length > 0)
      .join('\n\n');

    if (!lessonContent.trim()) {
      throw new NotFoundException(
        `Text content blocks for lesson ${lessonId} are empty. Add content before generating a quiz.`,
      );
    }

    const questionCount = dto.questionCount ?? 5;
    return this.aiGenerationService.generateQuiz(lessonContent, questionCount);
  }
}
