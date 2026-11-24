const authService = require('./auth.service');
const { ok } = require('../../utils/response');

const isProd = process.env.NODE_ENV === 'production';

function setAuthCookies(res, accessToken, refreshToken) {
  // Access token cookie: 7-day browser persistence matching refresh session to allow Edge Middleware routing,
  // while the JWT payload itself retains short-lived security expiry (15m) enforced on API endpoints.
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  });

  // 7-day refresh token cookie
  if (refreshToken) {
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth'
    });
  }
}

function clearAuthCookies(res) {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/api/v1/auth' });
}

exports.login = async (req, res) => {
  const meta = {
    ip: req.ip || req.socket.remoteAddress,
    ua: req.headers['user-agent']
  };

  const result = await authService.login(req.body, meta, req);
  setAuthCookies(res, result.accessToken, result.refreshToken);

  return ok(res, {
    user: result.user,
    token: result.accessToken
  }, 'Login successful');
};

exports.refresh = async (req, res) => {
  const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;
  const meta = {
    ip: req.ip || req.socket.remoteAddress,
    ua: req.headers['user-agent']
  };

  const result = await authService.refresh({ refreshToken, meta });
  setAuthCookies(res, result.accessToken, result.refreshToken);

  return ok(res, {
    user: result.user,
    token: result.accessToken
  }, 'Token refreshed successfully');
};

exports.logout = async (req, res) => {
  const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;
  await authService.logout({ refreshToken, userId: req.user?.id });
  clearAuthCookies(res);
  return ok(res, null, 'Logged out successfully');
};

exports.forgotPassword = async (req, res) => {
  const meta = { ip: req.ip, ua: req.headers['user-agent'] };
  const result = await authService.forgotPassword({ email: req.body.email, meta });
  return ok(res, result, result.message);
};

exports.resetPassword = async (req, res) => {
  const result = await authService.resetPassword(req.body);
  clearAuthCookies(res);
  return ok(res, null, result.message);
};

exports.changePassword = async (req, res) => {
  const result = await authService.changePassword({
    userId: req.user.id,
    currentPassword: req.body.currentPassword,
    newPassword: req.body.newPassword
  });
  return ok(res, null, result.message);
};

exports.getMe = async (req, res) => {
  const user = await authService.getMe(req.user.id);
  return ok(res, user, 'Profile loaded');
};

exports.updateMe = async (req, res) => {
  const updated = await authService.updateMe(req.user.id, req.body);
  return ok(res, updated, 'Profile updated successfully');
};
