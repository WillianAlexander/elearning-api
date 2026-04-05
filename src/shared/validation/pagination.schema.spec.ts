import { paginatedRequestSchema } from './pagination.schema';

describe('paginatedRequestSchema', () => {
  it('should parse valid pagination request with defaults', () => {
    const result = paginatedRequestSchema.parse({});

    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.sortOrder).toBe('asc');
  });

  it('should parse pagination with custom values', () => {
    const result = paginatedRequestSchema.parse({
      page: 3,
      pageSize: 50,
      sortBy: 'name',
      sortOrder: 'desc',
      search: 'typescript',
    });

    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(50);
    expect(result.sortBy).toBe('name');
    expect(result.sortOrder).toBe('desc');
    expect(result.search).toBe('typescript');
  });

  it('should coerce string numbers', () => {
    const result = paginatedRequestSchema.parse({
      page: '2',
      pageSize: '10',
    });

    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(10);
  });

  it('should reject pageSize > 100', () => {
    expect(() =>
      paginatedRequestSchema.parse({ pageSize: 101 }),
    ).toThrow();
  });

  it('should reject page < 1', () => {
    expect(() =>
      paginatedRequestSchema.parse({ page: 0 }),
    ).toThrow();
  });

  it('should reject invalid sortOrder', () => {
    expect(() =>
      paginatedRequestSchema.parse({ sortOrder: 'invalid' }),
    ).toThrow();
  });
});
