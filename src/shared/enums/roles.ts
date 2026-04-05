/**
 * User roles in the LMS platform.
 * Maps to the cooperative's organizational structure.
 */

const USER_ROLE = Object.freeze({
  ADMINISTRADOR: 'administrador',
  INSTRUCTOR: 'instructor',
  COLABORADOR: 'colaborador',
} as const);

type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

export { USER_ROLE };
export type { UserRole };
