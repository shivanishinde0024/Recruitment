const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dayjs = require('dayjs');
const { v4: uuidv4 } = require('uuid');

const prisma = require('../../config/db');
const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES,
  BCRYPT_ROUNDS,
  MAX_FAILED_LOGINS,
  LOCK_MINUTES
} = require('../../config/env');
const ApiError = require('../../utils/ApiError');
const { recordAudit } = require('../../middleware/audit');

const INACTIVITY_TIMEOUT_MS = parseInt(process.env.INACTIVITY_TIMEOUT_MINUTES, 10)
  ? parseInt(process.env.INACTIVITY_TIMEOUT_MINUTES, 10) * 60 * 1000
  : 30 * 60 * 1000;

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

function getAccessTokenExpiryMs(accessToken) {
  const decoded = jwt.decode(accessToken);
  return decoded?.exp ? decoded.exp * 1000 : null;
}

/**
 * Generates an Access Token (15 min) and Refresh Token pair (7 days).
 */
async function generateTokenPair(user, meta = {}, familyId = null) {
  const currentFamilyId = familyId || uuidv4();
  const rawRefreshToken = crypto.randomBytes(48).toString('hex');
  const tokenHash = sha256(rawRefreshToken);

  const accessToken = jwt.sign(
    {
      sub: String(user.id),
      role: user.role,
      email: user.email,
      jti: uuidv4()
    },
    JWT_ACCESS_SECRET,
    { expiresIn: JWT_ACCESS_EXPIRES }
  );

  const expiresAt = dayjs().add(7, 'day').toDate();

  await prisma.refresh_tokens.create({
    data: {
      user_id: user.id,
      token_hash: tokenHash,
      family_id: currentFamilyId,
      expires_at: expiresAt,
      ip: meta.ip || null,
      user_agent: meta.ua || null
    }
  });

  return {
    accessToken,
    refreshToken: rawRefreshToken,
    familyId: currentFamilyId
  };
}

/**
 * Authenticates user, handles lockout, creates session tokens.
 */
async function login({ email, password }, meta = {}, req = null) {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.users.findFirst({
    where: {
      email: normalizedEmail,
      deleted_at: null
    }
  });

  if (!user) {
    // Prevent user enumeration by taking similar time and returning generic error
    await bcrypt.compare(password, '$2b$12$e80y6kLw10oB9511s462.u.p1d07c0b02e60.a065604104040404');
    throw new ApiError(401, 'Invalid email or password');
  }

  // Check lockout status
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    const remainingMinutes = Math.max(1, dayjs(user.locked_until).diff(dayjs(), 'minute'));
    throw new ApiError(423, `Account locked due to consecutive failed logins. Please try again after ${remainingMinutes} minute(s).`);
  }

  // Check active status
  if (user.status !== 'active') {
    throw new ApiError(403, 'Account is disabled. Please contact administrator.');
  }

  // Verify password
  const passwordValid = await bcrypt.compare(password, user.password_hash);
  if (!passwordValid) {
    const currentAttempts = typeof user.failed_attempts === 'number' && !isNaN(user.failed_attempts)
      ? user.failed_attempts
      : 0;
    const attempts = currentAttempts + 1;
    const shouldLock = attempts >= MAX_FAILED_LOGINS;
    const lockUntil = shouldLock ? dayjs().add(LOCK_MINUTES, 'minute').toDate() : null;

    await prisma.users.update({
      where: { id: user.id },
      data: {
        failed_attempts: attempts,
        locked_until: lockUntil
      }
    });

    if (shouldLock) {
      throw new ApiError(423, `Account locked due to consecutive failed logins. Please try again after ${LOCK_MINUTES} minutes.`);
    }

    throw new ApiError(401, 'Invalid email or password');
  }

  // Validate company approval status if role is company (Approach 1: Strict Verification Gate)
  let company = null;
  if (user.role === 'company') {
    company = await prisma.companies.findFirst({
      where: { user_id: user.id, deleted_at: null }
    });

    if (!company) {
      throw new ApiError(403, 'No company profile found associated with this account. Please contact administrator.');
    }

    if (company.status === 'pending') {
      throw new ApiError(403, 'Your company registration is pending approval by administrator. You will be able to log in once your account has been verified.');
    }

    if (company.status === 'need_info') {
      throw new ApiError(403, 'Additional verification information is required for your company account. Please check your email or contact administrator.');
    }

    if (company.status === 'rejected') {
      throw new ApiError(403, 'Your company registration has been rejected. Please contact administrator.');
    }

    if (company.status === 'suspended') {
      throw new ApiError(403, 'Your company account is currently suspended. Please contact administrator.');
    }

    if (company.status !== 'approved') {
      throw new ApiError(403, `Company access is restricted (Status: ${company.status}). Please contact administrator.`);
    }
  }

  // Reset failed attempts on success
  await prisma.users.update({
    where: { id: user.id },
    data: {
      failed_attempts: 0,
      locked_until: null,
      last_login: new Date()
    }
  });

  const { accessToken, refreshToken } = await generateTokenPair(user, meta);

  await recordAudit({
    userId: user.id,
    action: 'login',
    moduleName: 'auth',
    recordId: user.id,
    newValue: { email: user.email, role: user.role },
    req
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyStatus: company ? company.status : null,
      companyId: company ? company.id : null,
      companyName: company ? company.company_name : null
    },
    accessToken,
    refreshToken,
    expiresAt: getAccessTokenExpiryMs(accessToken),
    inactivityTimeoutMs: INACTIVITY_TIMEOUT_MS
  };
}

/**
 * Rotates refresh token with strict reuse detection (Ruling 3.5).
 */
async function refresh({ refreshToken, meta = {} }) {
  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token required');
  }

  const tokenHash = sha256(refreshToken);
  const existingToken = await prisma.refresh_tokens.findUnique({
    where: { token_hash: tokenHash },
    include: { user: true }
  });

  if (!existingToken) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  // REUSE DETECTION: If token was already revoked, a replay attack is occurring!
  if (existingToken.revoked_at !== null) {
    // Revoke all tokens in this family immediately
    await prisma.refresh_tokens.updateMany({
      where: { family_id: existingToken.family_id },
      data: { revoked_at: new Date() }
    });
    throw new ApiError(401, 'Security alert: Refresh token replay detected. All active sessions have been invalidated.');
  }

  // Check expiry
  if (new Date(existingToken.expires_at) < new Date()) {
    throw new ApiError(401, 'Refresh token has expired. Please log in again.');
  }

  const user = existingToken.user;
  if (!user || user.deleted_at !== null || user.status !== 'active') {
    throw new ApiError(401, 'Account inactive or deleted');
  }

  // Guard active refresh for company users
  let company = null;
  if (user.role === 'company') {
    company = await prisma.companies.findFirst({
      where: { user_id: user.id, deleted_at: null }
    });
    if (!company || company.status !== 'approved') {
      throw new ApiError(403, 'Company registration is not approved or currently suspended');
    }
  }

  // Revoke the used refresh token
  await prisma.refresh_tokens.update({
    where: { id: existingToken.id },
    data: { revoked_at: new Date() }
  });

  // Issue new token pair keeping same family_id
  const { accessToken, refreshToken: newRefreshToken } = await generateTokenPair(
    user,
    meta,
    existingToken.family_id
  );

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyStatus: company ? company.status : null,
      companyId: company ? company.id : null,
      companyName: company ? company.company_name : null
    },
    accessToken,
    refreshToken: newRefreshToken,
    expiresAt: getAccessTokenExpiryMs(accessToken),
    inactivityTimeoutMs: INACTIVITY_TIMEOUT_MS
  };
}

/**
 * Revokes refresh token and terminates session family.
 */
async function logout({ refreshToken, userId = null }) {
  if (refreshToken) {
    const tokenHash = sha256(refreshToken);
    const existingToken = await prisma.refresh_tokens.findUnique({
      where: { token_hash: tokenHash }
    });
    if (existingToken?.family_id) {
      await prisma.refresh_tokens.updateMany({
        where: { family_id: existingToken.family_id, revoked_at: null },
        data: { revoked_at: new Date() }
      });
    } else {
      await prisma.refresh_tokens.updateMany({
        where: { token_hash: tokenHash, revoked_at: null },
        data: { revoked_at: new Date() }
      });
    }
  }
  return { success: true, message: 'Logged out successfully' };
}

/**
 * Initiates forgot password flow with zero user enumeration (Ruling 3.15).
 */
async function forgotPassword({ email, meta = {} }) {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.users.findFirst({
    where: { email: normalizedEmail, deleted_at: null }
  });

  if (user) {
    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = sha256(rawResetToken);
    const expiresAt = dayjs().add(30, 'minute').toDate();

    await prisma.password_resets.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt
      }
    });

    // In non-production testing, expose reset token for automation / verification tests
    return {
      message: 'If that email is registered, a password reset link has been sent.',
      debugToken: process.env.NODE_ENV !== 'production' ? rawResetToken : undefined
    };
  }

  // Consistent response for non-existent users
  return {
    message: 'If that email is registered, a password reset link has been sent.'
  };
}

/**
 * Resets password using single-use token and invalidates all existing sessions.
 */
async function resetPassword({ token, password }) {
  const tokenHash = sha256(token);
  const resetRecord = await prisma.password_resets.findUnique({
    where: { token_hash: tokenHash },
    include: { user: true }
  });

  if (!resetRecord || resetRecord.used_at !== null) {
    throw new ApiError(400, 'Invalid or already used password reset link');
  }

  if (new Date(resetRecord.expires_at) < new Date()) {
    throw new ApiError(400, 'Password reset link has expired');
  }

  const newHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  await prisma.$transaction([
    // Update user password & unlock if locked
    prisma.users.update({
      where: { id: resetRecord.user_id },
      data: {
        password_hash: newHash,
        failed_attempts: 0,
        locked_until: null
      }
    }),
    // Mark reset record as used
    prisma.password_resets.update({
      where: { id: resetRecord.id },
      data: { used_at: new Date() }
    }),
    // Revoke all active refresh sessions
    prisma.refresh_tokens.updateMany({
      where: { user_id: resetRecord.user_id, revoked_at: null },
      data: { revoked_at: new Date() }
    })
  ]);

  return { success: true, message: 'Password has been reset successfully. Please log in.' };
}

/**
 * Changes password for logged-in user.
 */
async function changePassword({ userId, currentPassword, newPassword }) {
  const user = await prisma.users.findUnique({
    where: { id: BigInt(userId) }
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) {
    throw new ApiError(400, 'Current password entered is incorrect');
  }

  const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  await prisma.$transaction([
    prisma.users.update({
      where: { id: user.id },
      data: { password_hash: newHash }
    }),
    prisma.refresh_tokens.updateMany({
      where: { user_id: user.id, revoked_at: null },
      data: { revoked_at: new Date() }
    })
  ]);

  return { success: true, message: 'Password changed successfully. All other sessions have been logged out.' };
}

/**
 * Returns currently authenticated user details.
 */
async function getMe(userId) {
  const user = await prisma.users.findUnique({
    where: { id: BigInt(userId) }
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  let company = null;
  if (user.role === 'company') {
    company = await prisma.companies.findFirst({
      where: { user_id: user.id, deleted_at: null },
      include: {
        industry: true,
        company_type: true
      }
    });
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    role: user.role,
    status: user.status,
    company: company
      ? {
          id: company.id,
          name: company.company_name,
          status: company.status,
          needsReverification: company.needs_reverification,
          industry: company.industry?.name || null,
          companyType: company.company_type?.name || null
        }
      : null
  };
}

/**
 * Updates self profile details.
 */
async function updateMe(userId, { name, mobile }) {
  const user = await prisma.users.update({
    where: { id: BigInt(userId) },
    data: {
      name: name || undefined,
      mobile: mobile || undefined
    }
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    role: user.role
  };
}

module.exports = {
  INACTIVITY_TIMEOUT_MS,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
  updateMe
};
