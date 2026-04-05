import { USER_ROLE } from '@lms/shared';

import { User } from './user.entity';

describe('User Entity', () => {
  it('should create a user with required fields', () => {
    const user = new User();
    user.id = 'test-uuid';
    user.cedula = '0102030405';
    user.email = 'jperez@cooperativa.com';
    user.firstName = 'Juan';
    user.lastName = 'Perez';
    user.role = USER_ROLE.COLABORADOR;
    user.area = 'Operaciones';
    user.cargo = 'Cajero';
    user.isActive = true;

    expect(user.cedula).toBe('0102030405');
    expect(user.email).toBe('jperez@cooperativa.com');
    expect(user.firstName).toBe('Juan');
    expect(user.lastName).toBe('Perez');
    expect(user.role).toBe('colaborador');
    expect(user.area).toBe('Operaciones');
    expect(user.cargo).toBe('Cajero');
    expect(user.isActive).toBe(true);
  });

  it('should compute fullName from firstName and lastName', () => {
    const user = new User();
    user.firstName = 'Maria';
    user.lastName = 'Gonzalez';

    expect(user.fullName).toBe('Maria Gonzalez');
  });

  it('should allow optional fields to be null', () => {
    const user = new User();
    user.cedula = '0102030405';
    user.email = 'test@cooperativa.com';
    user.firstName = 'Test';
    user.lastName = 'User';
    user.role = USER_ROLE.COLABORADOR;
    user.area = '';
    user.cargo = '';
    user.isActive = true;

    expect(user.lastLoginAt).toBeUndefined();
    expect(user.azureAdId).toBeUndefined();
  });

  it('should accept all valid roles', () => {
    const user = new User();
    user.cedula = '0102030405';
    user.email = 'admin@cooperativa.com';
    user.firstName = 'Admin';
    user.lastName = 'User';
    user.area = 'TI';
    user.cargo = 'Jefe';
    user.isActive = true;

    user.role = USER_ROLE.ADMINISTRADOR;
    expect(user.role).toBe('administrador');

    user.role = USER_ROLE.INSTRUCTOR;
    expect(user.role).toBe('instructor');

    user.role = USER_ROLE.COLABORADOR;
    expect(user.role).toBe('colaborador');
  });
});
