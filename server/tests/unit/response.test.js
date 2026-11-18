const { ok, created } = require('../../src/utils/response');

describe('Unit: Response Envelope Utility', () => {
  let mockRes;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  it('should format ok response with default message', () => {
    ok(mockRes, { id: 1 }, 'Fetched');
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      message: 'Fetched',
      data: { id: 1 }
    });
  });

  it('should include meta in ok response when provided', () => {
    const meta = { page: 1, limit: 10, total: 50, totalPages: 5 };
    ok(mockRes, [{ id: 1 }], 'List fetched', meta);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      message: 'List fetched',
      data: [{ id: 1 }],
      meta
    });
  });

  it('should format created response with HTTP 201', () => {
    created(mockRes, { id: 99 }, 'Job created');
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      message: 'Job created',
      data: { id: 99 }
    });
  });
});

