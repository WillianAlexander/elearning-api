import { TOKEN_VALIDATION_STATUS } from '../domain/types';
import { AzureAdTokenValidationAdapter } from './azure-ad-token-validation.adapter';

// Mock jwks-rsa
const mockGetSigningKey = jest.fn();
jest.mock('jwks-rsa', () => ({
  JwksClient: jest.fn().mockImplementation(() => ({
    getSigningKey: mockGetSigningKey,
  })),
}));

// Mock jsonwebtoken
const mockDecode = jest.fn();
const mockVerify = jest.fn();
jest.mock('jsonwebtoken', () => ({
  decode: (...args: unknown[]) => mockDecode(...args),
  verify: (...args: unknown[]) => mockVerify(...args),
}));

const TENANT_ID = 'test-tenant-id';
const CLIENT_ID = 'test-client-id';

const createValidDecodedToken = () => ({
  header: { alg: 'RS256', kid: 'test-kid-123' },
  payload: { sub: 'user-123' },
  signature: 'sig',
});

const createVerifiedPayload = (overrides: Record<string, unknown> = {}) => ({
  sub: 'user-123',
  preferred_username: 'user@cooperativa.com',
  name: 'Test User',
  groups: ['LMS-Administradores'],
  iat: 1700000000,
  exp: 1700028800,
  iss: `https://login.microsoftonline.com/${TENANT_ID}/v2.0`,
  aud: CLIENT_ID,
  department: 'Tecnologia',
  jobTitle: 'Developer',
  ...overrides,
});

describe('AzureAdTokenValidationAdapter', () => {
  let adapter: AzureAdTokenValidationAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new AzureAdTokenValidationAdapter(TENANT_ID, CLIENT_ID);
  });

  it('should return valid result for a properly signed token', async () => {
    mockDecode.mockReturnValue(createValidDecodedToken());
    mockGetSigningKey.mockResolvedValue({
      getPublicKey: () => 'mock-public-key',
    });
    mockVerify.mockReturnValue(createVerifiedPayload());

    const result = await adapter.validate('valid-token');

    expect(result.isValid).toBe(true);
    expect(result.status).toBe(TOKEN_VALIDATION_STATUS.VALID);
    expect(result.payload).toBeDefined();
    expect(result.payload?.sub).toBe('user-123');
    expect(result.payload?.email).toBe('user@cooperativa.com');
    expect(result.payload?.name).toBe('Test User');
    expect(result.payload?.groups).toEqual(['LMS-Administradores']);
    expect(result.payload?.department).toBe('Tecnologia');
    expect(result.payload?.jobTitle).toBe('Developer');
  });

  it('should fall back to email claim when preferred_username is absent', async () => {
    mockDecode.mockReturnValue(createValidDecodedToken());
    mockGetSigningKey.mockResolvedValue({
      getPublicKey: () => 'mock-public-key',
    });
    mockVerify.mockReturnValue(
      createVerifiedPayload({
        preferred_username: undefined,
        email: 'fallback@cooperativa.com',
      }),
    );

    const result = await adapter.validate('valid-token');

    expect(result.isValid).toBe(true);
    expect(result.payload?.email).toBe('fallback@cooperativa.com');
  });

  it('should return expired status for expired token', async () => {
    mockDecode.mockReturnValue(createValidDecodedToken());
    mockGetSigningKey.mockResolvedValue({
      getPublicKey: () => 'mock-public-key',
    });

    const expiredError = new Error('jwt expired');
    expiredError.name = 'TokenExpiredError';
    mockVerify.mockImplementation(() => {
      throw expiredError;
    });

    const result = await adapter.validate('expired-token');

    expect(result.isValid).toBe(false);
    expect(result.status).toBe(TOKEN_VALIDATION_STATUS.EXPIRED);
    expect(result.error).toBe('Token has expired');
  });

  it('should return invalid status for invalid signature', async () => {
    mockDecode.mockReturnValue(createValidDecodedToken());
    mockGetSigningKey.mockResolvedValue({
      getPublicKey: () => 'mock-public-key',
    });

    const invalidError = new Error('invalid signature');
    invalidError.name = 'JsonWebTokenError';
    mockVerify.mockImplementation(() => {
      throw invalidError;
    });

    const result = await adapter.validate('bad-signature-token');

    expect(result.isValid).toBe(false);
    expect(result.status).toBe(TOKEN_VALIDATION_STATUS.INVALID);
    expect(result.error).toContain('invalid signature');
  });

  it('should return invalid status when token cannot be decoded', async () => {
    mockDecode.mockReturnValue(null);

    const result = await adapter.validate('garbage');

    expect(result.isValid).toBe(false);
    expect(result.status).toBe(TOKEN_VALIDATION_STATUS.INVALID);
    expect(result.error).toBe('Token could not be decoded');
  });

  it('should return invalid status when kid is missing from header', async () => {
    mockDecode.mockReturnValue({
      header: { alg: 'RS256' },
      payload: {},
      signature: 'sig',
    });

    const result = await adapter.validate('no-kid-token');

    expect(result.isValid).toBe(false);
    expect(result.status).toBe(TOKEN_VALIDATION_STATUS.INVALID);
    expect(result.error).toBe('Token header missing kid');
  });

  it('should return error status when JWKS fetch fails', async () => {
    mockDecode.mockReturnValue(createValidDecodedToken());
    mockGetSigningKey.mockRejectedValue(new Error('Network error'));

    const result = await adapter.validate('valid-token');

    expect(result.isValid).toBe(false);
    expect(result.status).toBe(TOKEN_VALIDATION_STATUS.ERROR);
    expect(result.error).toContain('signing key');
  });
});
