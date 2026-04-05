import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

import { CONTENT_BLOCK_TYPE } from '@lms/shared';
import type {
  QuizBlockContent,
  QuizAnswerRecord,
  QuizSummary,
  MultipleChoiceQuestion,
  MultipleSelectQuestion,
  TrueFalseQuestion,
} from '@lms/shared';

import { EnrollmentsService } from '../../enrollments/application/enrollments.service';
import { QuizAttemptRepository } from '../infrastructure/quiz-attempt.repository';
import type { SubmitQuizDto } from './dto/submit-quiz.dto';
import type { QuizAttempt } from '../domain/entities/quiz-attempt.entity';

const DEFAULT_PASSING_SCORE = 70;

@Injectable()
export class QuizAttemptsService {
  private readonly logger = new Logger(QuizAttemptsService.name);

  constructor(
    private readonly quizAttemptRepository: QuizAttemptRepository,
    private readonly enrollmentsService: EnrollmentsService,
    private readonly prisma: PrismaService,
  ) {}

  async submitQuiz(enrollmentId: string, userId: string, dto: SubmitQuizDto): Promise<QuizAttempt> {
    // 1. Validate enrollment belongs to user
    const enrollment = await this.enrollmentsService.findById(enrollmentId);
    if (enrollment.userId !== userId) {
      throw new ForbiddenException('No puedes enviar quizzes de otra inscripcion');
    }

    // 2. Verify ContentBlock is QUIZ type
    const block = await this.prisma.contentBlock.findFirst({
      where: { id: dto.contentBlockId, deletedAt: null },
    });
    if (!block) {
      throw new NotFoundException('Bloque de contenido no encontrado');
    }
    if (block.type !== CONTENT_BLOCK_TYPE.QUIZ) {
      throw new BadRequestException('El bloque de contenido no es un quiz');
    }

    const quizContent = block.content as unknown as QuizBlockContent;

    // 3. Verify max attempts not exceeded
    const maxAttempts = quizContent.maxAttempts ?? null;
    if (maxAttempts !== null) {
      const currentCount = await this.quizAttemptRepository.countByEnrollmentAndBlock(
        enrollmentId,
        dto.contentBlockId,
      );
      if (currentCount >= maxAttempts) {
        throw new BadRequestException(
          `Has alcanzado el maximo de ${maxAttempts} intentos para este quiz`,
        );
      }
    }

    // 4. Grade answers
    const passingScore = quizContent.passingScore ?? DEFAULT_PASSING_SCORE;
    const gradedAnswers = this.gradeAnswers(quizContent, dto.answers);
    const totalQuestions = quizContent.questions.length;
    const correctCount = gradedAnswers.filter((a) => a.isCorrect).length;
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const passed = score >= passingScore;

    // 5. Create attempt
    const attempt = await this.quizAttemptRepository.create({
      enrollmentId,
      contentBlockId: dto.contentBlockId,
      answers: gradedAnswers,
      score,
      totalQuestions,
      correctCount,
      passed,
      submittedAt: new Date(),
    });

    this.logger.log(
      `Quiz attempt for enrollment ${enrollmentId}, block ${dto.contentBlockId}: ${score}% (${passed ? 'PASSED' : 'FAILED'})`,
    );

    return attempt;
  }

  async getAttemptsByBlock(
    enrollmentId: string,
    contentBlockId: string,
    userId: string,
  ): Promise<QuizAttempt[]> {
    const enrollment = await this.enrollmentsService.findById(enrollmentId);
    if (enrollment.userId !== userId) {
      throw new ForbiddenException('No puedes ver intentos de otra inscripcion');
    }
    return this.quizAttemptRepository.findByEnrollmentAndBlock(enrollmentId, contentBlockId);
  }

  async getAttemptById(
    enrollmentId: string,
    attemptId: string,
    userId: string,
  ): Promise<QuizAttempt> {
    const enrollment = await this.enrollmentsService.findById(enrollmentId);
    if (enrollment.userId !== userId) {
      throw new ForbiddenException('No puedes ver intentos de otra inscripcion');
    }
    const attempt = await this.quizAttemptRepository.findById(attemptId);
    if (!attempt || attempt.enrollmentId !== enrollmentId) {
      throw new NotFoundException('Intento no encontrado');
    }
    return attempt;
  }

  async getQuizSummary(
    enrollmentId: string,
    contentBlockId: string,
    userId: string,
  ): Promise<QuizSummary> {
    const enrollment = await this.enrollmentsService.findById(enrollmentId);
    if (enrollment.userId !== userId) {
      throw new ForbiddenException('No puedes ver el resumen de otra inscripcion');
    }

    const block = await this.prisma.contentBlock.findFirst({
      where: { id: contentBlockId, deletedAt: null },
    });
    if (!block) {
      throw new NotFoundException('Bloque de contenido no encontrado');
    }

    const quizContent = block.content as unknown as QuizBlockContent;
    const maxAttempts = quizContent.maxAttempts ?? null;

    const totalAttempts = await this.quizAttemptRepository.countByEnrollmentAndBlock(
      enrollmentId,
      contentBlockId,
    );
    const bestScore = await this.quizAttemptRepository.bestScoreByEnrollmentAndBlock(
      enrollmentId,
      contentBlockId,
    );
    const passed = await this.quizAttemptRepository.hasPassedQuiz(enrollmentId, contentBlockId);

    const canRetry = maxAttempts === null || totalAttempts < maxAttempts;

    return {
      contentBlockId,
      totalAttempts,
      bestScore,
      passed,
      canRetry: canRetry && !passed,
      maxAttempts,
    };
  }

  /**
   * Check if the student has passed ALL quizzes in a given lesson.
   * Used by LessonProgressService before marking a lesson as complete.
   */
  async hasPassedAllQuizzes(enrollmentId: string, lessonId: string): Promise<boolean> {
    // Find all quiz blocks for this lesson
    const quizBlocks = await this.prisma.contentBlock.findMany({
      where: { lessonId, type: CONTENT_BLOCK_TYPE.QUIZ, deletedAt: null },
      select: { id: true },
    });

    if (quizBlocks.length === 0) return true; // No quizzes = auto-pass

    const quizBlockIds = quizBlocks.map((b) => b.id);
    const passedIds = await this.quizAttemptRepository.findAllPassedByEnrollmentAndLesson(
      enrollmentId,
      quizBlockIds,
    );

    return quizBlockIds.every((id) => passedIds.includes(id));
  }

  private gradeAnswers(
    quizContent: QuizBlockContent,
    answers: Array<{
      questionId: string;
      selectedOptionId: string;
      selectedOptionIds?: string[];
    }>,
  ): QuizAnswerRecord[] {
    return answers.map((answer) => {
      const question = quizContent.questions.find((q) => q.id === answer.questionId);

      if (!question) {
        return {
          questionId: answer.questionId,
          selectedOptionId: answer.selectedOptionId,
          selectedOptionIds: answer.selectedOptionIds,
          isCorrect: false,
        };
      }

      // Determine question type (default to multiple_choice for legacy questions)
      const questionType = 'type' in question ? question.type : 'multiple_choice';

      let isCorrect: boolean;

      if (questionType === 'multiple_select') {
        const q = question as MultipleSelectQuestion;
        const selected = new Set(answer.selectedOptionIds ?? []);
        const correct = new Set(q.correctOptionIds);
        // Exact set match: same size and all selected are correct
        isCorrect = selected.size === correct.size && [...selected].every((id) => correct.has(id));
      } else if (questionType === 'true_false') {
        const q = question as TrueFalseQuestion;
        // Convention: selectedOptionId is 'true' or 'false'
        isCorrect = String(q.correctAnswer) === answer.selectedOptionId;
      } else {
        // multiple_choice (and legacy questions without a type field)
        const q = question as MultipleChoiceQuestion;
        isCorrect = q.correctOptionId === answer.selectedOptionId;
      }

      return {
        questionId: answer.questionId,
        selectedOptionId: answer.selectedOptionId,
        selectedOptionIds: answer.selectedOptionIds,
        isCorrect,
      };
    });
  }
}
