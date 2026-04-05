import { TOKEN_VALIDATION_STATUS } from '../domain/types';
import { MockTokenValidationAdapter } from './mock-token-validation.adapter';

describe('MockTokenValidationAdapter', () => {
  let adapter: MockTokenValidationAdapter;

  beforeEach(() => {
    adapter = new MockTokenValidationAdapter();
  });

  it('should validate a valid admin token', async () => {
    const result = await adapter.validate('mock-token-admin');

    expect(result.isValid).toBe(true);
    expect(result.status).toBe(TOKEN_VALIDATION_STATUS.VALID);
    expect(result.payload).toBeDefined();
    expect(result.payload!.email).toBe('admin@cooperativa.com');
    expect(result.payload!.groups).toContain('LMS-Administradores');
  });

  it('should validate a valid instructor token', async () => {
    const result = await adapter.validate('mock-token-instructor');

    expect(result.isValid).toBe(true);
    expect(result.status).toBe(TOKEN_VALIDATION_STATUS.VALID);
    expect(result.payload!.email).toBe('instructor@cooperativa.com');
  });

  it('should validate instructor-2 token (Maria Gonzalez)', async () => {
    const result = await adapter.validate('mock-token-instructor-2');

    expect(result.isValid).toBe(true);
    expect(result.status).toBe(TOKEN_VALIDATION_STATUS.VALID);
    expect(result.payload!.email).toBe('maria.gonzalez@cooperativa.com');
    expect(result.payload!.groups).toContain('LMS-Instructores');
  });

  it('should validate instructor-3 token (Carlos Ramirez)', async () => {
    const result = await adapter.validate('mock-token-instructor-3');

    expect(result.isValid).toBe(true);
    expect(result.status).toBe(TOKEN_VALIDATION_STATUS.VALID);
    expect(result.payload!.email).toBe('carlos.ramirez@cooperativa.com');
    expect(result.payload!.groups).toContain('LMS-Instructores');
  });

  it('should validate a valid colaborador token', async () => {
    const result = await adapter.validate('mock-token-colaborador');

    expect(result.isValid).toBe(true);
    expect(result.status).toBe(TOKEN_VALIDATION_STATUS.VALID);
    expect(result.payload!.email).toBe('colaborador@cooperativa.com');
  });

  it('should validate colaborador-2 token (Ana Martinez)', async () => {
    const result = await adapter.validate('mock-token-colaborador-2');

    expect(result.isValid).toBe(true);
    expect(result.status).toBe(TOKEN_VALIDATION_STATUS.VALID);
    expect(result.payload!.email).toBe('ana.martinez@cooperativa.com');
    expect(result.payload!.groups).toEqual([]);
  });

  it('should reject an expired token', async () => {
    const result = await adapter.validate('mock-token-expired');

    expect(result.isValid).toBe(false);
    expect(result.status).toBe(TOKEN_VALIDATION_STATUS.EXPIRED);
    expect(result.error).toBe('Token has expired');
  });

  it('should reject an invalid/unknown token', async () => {
    const result = await adapter.validate('completely-invalid-token');

    expect(result.isValid).toBe(false);
    expect(result.status).toBe(TOKEN_VALIDATION_STATUS.INVALID);
    expect(result.error).toBe('Token not recognized');
  });

  it('should reject an empty token', async () => {
    const result = await adapter.validate('');

    expect(result.isValid).toBe(false);
    expect(result.status).toBe(TOKEN_VALIDATION_STATUS.INVALID);
  });
});
