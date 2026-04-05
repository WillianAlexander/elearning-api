import { Injectable, Inject, Logger } from '@nestjs/common';

import {
  AI_CONTENT_GENERATOR_PORT,
  type AiContentGeneratorPort,
  type CourseOutline,
  type GeneratedQuiz,
} from '../domain/ports/ai-content-generator.port';

@Injectable()
export class AiGenerationService {
  private readonly logger = new Logger(AiGenerationService.name);

  constructor(
    @Inject(AI_CONTENT_GENERATOR_PORT)
    private readonly contentGenerator: AiContentGeneratorPort,
  ) {}

  async generateCourseOutline(
    topic: string,
    notes?: string,
  ): Promise<CourseOutline> {
    this.logger.log(`Generating course outline for topic: "${topic}"`);
    return this.contentGenerator.generateCourseOutline(topic, notes);
  }

  async generateQuiz(
    lessonContent: string,
    questionCount: number,
  ): Promise<GeneratedQuiz> {
    this.logger.log(`Generating quiz with ${questionCount} questions for lesson content`);
    return this.contentGenerator.generateQuiz(lessonContent, questionCount);
  }
}
