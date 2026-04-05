/**
 * Course lifecycle statuses.
 */

const COURSE_STATUS = Object.freeze({
  DRAFT: 'draft',
  PENDING_REVIEW: 'pending_review',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const);

type CourseStatus = (typeof COURSE_STATUS)[keyof typeof COURSE_STATUS];

export { COURSE_STATUS };
export type { CourseStatus };
