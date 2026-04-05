/**
 * Port for AI content generation — follows hexagonal architecture.
 * Adapters: ClaudeContentGeneratorAdapter (production), MockContentGeneratorAdapter (dev).
 */

export const AI_CONTENT_GENERATOR_PORT = Symbol('AI_CONTENT_GENERATOR_PORT');

export interface CourseOutlineLesson {
  title: string;
  type: 'text' | 'video' | 'quiz';
}

export interface CourseOutlineModule {
  title: string;
  lessons: CourseOutlineLesson[];
}

export interface CourseOutline {
  title: string;
  description: string;
  modules: CourseOutlineModule[];
}

export interface GeneratedQuizQuestion {
  type: 'multiple_choice' | 'multiple_select' | 'true_false';
  question: string;
  options?: string[];
  correctAnswer: number | number[] | boolean;
  explanation?: string;
}

export type GeneratedQuiz = GeneratedQuizQuestion[];

export interface AiContentGeneratorPort {
  generateCourseOutline(
    topic: string,
    notes?: string,
  ): Promise<CourseOutline>;

  generateQuiz(
    lessonContent: string,
    questionCount: number,
  ): Promise<GeneratedQuiz>;
}
