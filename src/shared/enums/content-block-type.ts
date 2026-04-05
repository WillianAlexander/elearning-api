/**
 * Types of content blocks within a lesson.
 */

const CONTENT_BLOCK_TYPE = Object.freeze({
  TEXT: 'text',
  VIDEO: 'video',
  PDF: 'pdf',
  IMAGE: 'image',
  QUIZ: 'quiz',
  CODE: 'code',
  EMBED: 'embed',
  AUDIO: 'audio',
} as const);

type ContentBlockType =
  (typeof CONTENT_BLOCK_TYPE)[keyof typeof CONTENT_BLOCK_TYPE];

export { CONTENT_BLOCK_TYPE };
export type { ContentBlockType };
