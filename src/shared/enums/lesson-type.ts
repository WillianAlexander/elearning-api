/**
 * Types of content a lesson can contain.
 */

const LESSON_TYPE = Object.freeze({
  TEXT: 'text',
  VIDEO: 'video',
  DOCUMENT: 'document',
  QUIZ: 'quiz',
  ASSIGNMENT: 'assignment',
} as const);

type LessonType = (typeof LESSON_TYPE)[keyof typeof LESSON_TYPE];

export { LESSON_TYPE };
export type { LessonType };
