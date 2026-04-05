/** Shared Quiz types — used by both API and Web */

export interface QuizOption {
  id: string;
  text: string;
}

/** Question type discriminant */
export type QuestionType = 'multiple_choice' | 'multiple_select' | 'true_false';

/** Single-answer multiple choice question (radio buttons) */
export interface MultipleChoiceQuestion {
  id: string;
  type: 'multiple_choice';
  text: string;
  options: QuizOption[];
  correctOptionId: string;
  explanation: string;
}

/**
 * Multiple-select question (checkboxes).
 * All correct options must be selected and no incorrect ones.
 */
export interface MultipleSelectQuestion {
  id: string;
  type: 'multiple_select';
  text: string;
  options: QuizOption[];
  correctOptionIds: string[];
  explanation: string;
}

/** True/False question — two hardcoded options, answer is a boolean */
export interface TrueFalseQuestion {
  id: string;
  type: 'true_false';
  text: string;
  correctAnswer: boolean;
  explanation: string;
}

/**
 * Union of all question shapes.
 * Legacy questions without a `type` field are treated as `multiple_choice`.
 */
export type QuizQuestion =
  | MultipleChoiceQuestion
  | MultipleSelectQuestion
  | TrueFalseQuestion;

/** Backwards-compatible base shape for questions that existed before typed questions */
export interface LegacyQuizQuestion {
  id: string;
  text: string;
  options: QuizOption[];
  correctOptionId: string;
  explanation: string;
}

export interface QuizBlockContent {
  questions: QuizQuestion[];
  maxAttempts?: number | null;
  passingScore?: number;
}

export interface QuizAnswerRecord {
  questionId: string;
  /** For multiple_choice: single selected option id */
  selectedOptionId: string;
  /** For multiple_select: all selected option ids */
  selectedOptionIds?: string[];
  isCorrect: boolean;
}

export interface QuizSummary {
  contentBlockId: string;
  totalAttempts: number;
  bestScore: number;
  passed: boolean;
  canRetry: boolean;
  maxAttempts: number | null;
}
