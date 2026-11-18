const ApiError = require('../../src/utils/ApiError');

describe('Unit: ApiError Utility', () => {
  it('should instantiate correctly with status and message', () => {
    const error = new ApiError(404, 'Job not found');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(404);
    expect(error.message).toBe('Job not found');
    expect(error.errors).toBeNull();
  });

  it('should attach validation error details array', () => {
    const errorsList = [{ field: 'email', message: 'Email is required' }];
    const error = new ApiError(400, 'Validation failed', errorsList);
    expect(error.status).toBe(400);
    expect(error.message).toBe('Validation failed');
    expect(error.errors).toEqual(errorsList);
  });
});
