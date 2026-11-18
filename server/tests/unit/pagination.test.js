const { parsePagination, buildMeta } = require('../../src/utils/pagination');

describe('Unit: Pagination Utility', () => {
  it('should return defaults for empty query', () => {
    const result = parsePagination({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.skip).toBe(0);
    expect(result.take).toBe(10);
  });

  it('should parse page and limit correctly', () => {
    const result = parsePagination({ page: '3', limit: '25' });
    expect(result.page).toBe(3);
    expect(result.limit).toBe(25);
    expect(result.skip).toBe(50);
    expect(result.take).toBe(25);
  });

  it('should cap limit at maxLimit (100) per Ruling 3.14', () => {
    const result = parsePagination({ page: '1', limit: '500' });
    expect(result.limit).toBe(100);
    expect(result.take).toBe(100);
  });

  it('should construct correct metadata with buildMeta', () => {
    const meta = buildMeta(2, 20, 85);
    expect(meta.page).toBe(2);
    expect(meta.limit).toBe(20);
    expect(meta.total).toBe(85);
    expect(meta.totalPages).toBe(5);
  });
});

