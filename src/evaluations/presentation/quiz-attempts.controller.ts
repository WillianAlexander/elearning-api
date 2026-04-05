import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '@/auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/presentation/guards/roles.guard';
import { CurrentUser } from '@/auth/presentation/decorators/current-user.decorator';

import { QuizAttemptsService } from '../application/quiz-attempts.service';
import { SubmitQuizDto } from '../application/dto/submit-quiz.dto';

interface AuthUser {
  id: string;
  role: string;
}

@ApiTags('Quiz Attempts')
@Controller('enrollments/:enrollmentId/quizzes')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class QuizAttemptsController {
  constructor(private readonly quizAttemptsService: QuizAttemptsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a quiz attempt' })
  @ApiCreatedResponse({ description: 'Intento de quiz registrado exitosamente' })
  @ApiBadRequestResponse({ description: 'Respuestas invalidas o quiz ya completado' })
  @ApiNotFoundResponse({ description: 'Inscripcion o bloque de contenido no encontrado' })
  @ApiUnauthorizedResponse({ description: 'Token invalido o expirado' })
  @ApiForbiddenResponse({ description: 'No tienes permiso para rendir este quiz' })
  async submitQuiz(
    @Param('enrollmentId', ParseUUIDPipe) enrollmentId: string,
    @Body() dto: SubmitQuizDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.quizAttemptsService.submitQuiz(enrollmentId, user.id, dto);
  }

  @Get(':contentBlockId')
  @ApiOperation({ summary: 'Get all attempts for a specific quiz' })
  @ApiOkResponse({ description: 'Lista de intentos del quiz para la inscripcion indicada' })
  @ApiNotFoundResponse({ description: 'Inscripcion o bloque de contenido no encontrado' })
  @ApiUnauthorizedResponse({ description: 'Token invalido o expirado' })
  @ApiForbiddenResponse({ description: 'No tienes permiso para ver estos intentos' })
  async getAttempts(
    @Param('enrollmentId', ParseUUIDPipe) enrollmentId: string,
    @Param('contentBlockId', ParseUUIDPipe) contentBlockId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.quizAttemptsService.getAttemptsByBlock(enrollmentId, contentBlockId, user.id);
  }

  @Get(':contentBlockId/summary')
  @ApiOperation({ summary: 'Get quiz summary (best score, attempts, can retry)' })
  @ApiOkResponse({
    description: 'Resumen del quiz: mejor puntaje, cantidad de intentos y si puede reintentar',
  })
  @ApiNotFoundResponse({ description: 'Inscripcion o bloque de contenido no encontrado' })
  @ApiUnauthorizedResponse({ description: 'Token invalido o expirado' })
  @ApiForbiddenResponse({ description: 'No tienes permiso para ver el resumen de este quiz' })
  async getQuizSummary(
    @Param('enrollmentId', ParseUUIDPipe) enrollmentId: string,
    @Param('contentBlockId', ParseUUIDPipe) contentBlockId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.quizAttemptsService.getQuizSummary(enrollmentId, contentBlockId, user.id);
  }

  @Get('attempts/:attemptId')
  @ApiOperation({ summary: 'Get a specific attempt with answers' })
  @ApiOkResponse({ description: 'Detalle del intento con las respuestas enviadas' })
  @ApiNotFoundResponse({ description: 'Intento no encontrado' })
  @ApiUnauthorizedResponse({ description: 'Token invalido o expirado' })
  @ApiForbiddenResponse({ description: 'No tienes permiso para ver este intento' })
  async getAttempt(
    @Param('enrollmentId', ParseUUIDPipe) enrollmentId: string,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.quizAttemptsService.getAttemptById(enrollmentId, attemptId, user.id);
  }
}
