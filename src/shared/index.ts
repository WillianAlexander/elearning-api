// Types
export type {
  ApiError,
  ApiResponse,
  ApiListResponse,
  ResponseMeta,
  PaginationMeta,
  PaginatedRequest,
  PaginatedResponse,
  QuizOption,
  QuizQuestion,
  QuizBlockContent,
  QuizAnswerRecord,
  QuizSummary,
  QuestionType,
  MultipleChoiceQuestion,
  MultipleSelectQuestion,
  TrueFalseQuestion,
} from './types';

// Enums (const objects + types)
export {
  USER_ROLE,
  COURSE_STATUS,
  LESSON_TYPE,
  ENROLLMENT_STATUS,
  CONTENT_BLOCK_TYPE,
  DIFFICULTY_LEVEL,
} from './enums';
export type {
  UserRole,
  CourseStatus,
  LessonType,
  EnrollmentStatus,
  ContentBlockType,
  DifficultyLevel,
} from './enums';

// Constants
export { ROLE_PERMISSIONS } from './constants';

// Validation schemas
export { paginatedRequestSchema } from './validation';
export type { PaginatedRequestDto } from './validation';

// Utils
export { parseYouTubeUrl, getYouTubeEmbedUrl } from './utils';
