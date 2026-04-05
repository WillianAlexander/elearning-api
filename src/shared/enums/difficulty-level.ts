/**
 * Course difficulty levels.
 */

const DIFFICULTY_LEVEL = Object.freeze({
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
} as const);

type DifficultyLevel =
  (typeof DIFFICULTY_LEVEL)[keyof typeof DIFFICULTY_LEVEL];

export { DIFFICULTY_LEVEL };
export type { DifficultyLevel };
