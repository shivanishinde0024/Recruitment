const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { JWT_ACCESS_SECRET } = require('../config/env');
const ApiError = require('../utils/ApiError');

/**
 * Verifies access token from httpOnly cookie or Authorization Bearer header.
 */
exports.authenticate = async (req, res, next) => {
  try {
    const cookieToken = req.cookies?.access_token;
    const headerToken = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.substring(7)
      : null;

    const token = cookieToken || headerToken;
    if (!token) {
      throw new ApiError(401, 'Authentication token required');
    }

    let payload;
    try {
      payload = jwt.verify(token, JWT_ACCESS_SECRET);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        throw new ApiError(401, 'Authentication token expired');
      }
      throw new ApiError(401, 'Invalid authentication token');
    }

    const userId = BigInt(payload.sub);
    const user = await prisma.users.findFirst({
      where: {
        id: userId,
        deleted_at: null,
        status: 'active'
      }
    });

    if (!user) {
      throw new ApiError(401, 'Account does not exist or has been disabled');
    }

    let companyId = null;
    let company = null;

    if (user.role === 'company') {
      company = await prisma.companies.findFirst({
        where: {
          user_id: user.id,
          deleted_at: null
        }
      });
      companyId = company ? company.id : null;
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId
    };
    req.company = company;
    req.tokenExp = payload.exp ? payload.exp * 1000 : null;

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Role-based access control middleware.
 */
exports.requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required'));
  }
  if (!allowedRoles.includes(req.user.role)) {
    return next(new ApiError(403, `Access denied for role: ${req.user.role}`));
  }
  next();
};

/**
 * Guard ensuring company has been approved before accessing job/candidate capabilities.
 */
exports.requireApprovedCompany = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required'));
  }
  if (req.user.role !== 'company') {
    return next(); // staff & admin pass through
  }
  if (!req.company || req.company.status !== 'approved') {
    return next(new ApiError(403, 'Company registration is pending approval or currently suspended'));
  }
  next();
};
