const { ZodError } = require('zod');
const ApiError = require('../utils/ApiError');

function notFound(req, res, next) {
  next(new ApiError(404, `Resource not found: ${req.method} ${req.originalUrl}`));
}

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  let status = err.status || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors || null;

  // 1. Zod Validation Errors
  if (err instanceof ZodError) {
    status = 400;
    message = 'Validation failed';
    errors = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message
    }));
  }

  // 2. Prisma Database Errors
  if (err.code === 'P2002') {
    status = 409;
    const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : err.meta?.target || 'field';
    message = `Duplicate entry conflict on ${target}`;
  } else if (err.code === 'P2025') {
    status = 404;
    message = err.meta?.cause || 'Record not found';
  } else if (err.code === 'P2003') {
    status = 422;
    message = 'Cannot complete operation due to referenced relation constraint';
  }

  // 3. Multer File Upload Errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    status = 413;
    message = 'Uploaded file exceeds maximum permissible file size';
  } else if (err.name === 'MulterError') {
    status = 400;
    message = `File upload error: ${err.message}`;
  }

  // 4. Bad JSON payload
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    status = 400;
    message = 'Malformed JSON body';
  }

  // 5. JWT Errors
  if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Authentication token expired';
  }

  const response = {
    success: false,
    message
  };

  if (errors) {
    response.errors = errors;
  }

  // Only expose stack trace in non-production environments when 500
  if (process.env.NODE_ENV !== 'production' && status === 500 && err.stack) {
    response.stack = err.stack;
  }

  return res.status(status).json(response);
}

module.exports = {
  notFound,
  errorHandler
};
