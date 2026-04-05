import { USER_ROLE } from './roles';

describe('USER_ROLE', () => {
  it('should have exactly 3 roles', () => {
    const roles = Object.values(USER_ROLE);
    expect(roles).toHaveLength(3);
  });

  it('should contain expected role values', () => {
    expect(USER_ROLE.ADMINISTRADOR).toBe('administrador');
    expect(USER_ROLE.INSTRUCTOR).toBe('instructor');
    expect(USER_ROLE.COLABORADOR).toBe('colaborador');
  });

  it('should be frozen (runtime immutable)', () => {
    expect(Object.isFrozen(USER_ROLE)).toBe(true);
  });
});
