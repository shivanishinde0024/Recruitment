import axios from 'axios';
import sessionManager from './sessionManager';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

const AUTH_SKIP_PREFLIGHT = [
  '/auth/login',
  '/auth/refresh',
  '/auth/logout',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/me'
];

const AUTH_SKIP_RETRY = ['/auth/login', '/auth/refresh', '/auth/logout'];

// Request interceptor: track API activity & proactively renew expiring active sessions
api.interceptors.request.use(async (config) => {
  const url = config.url || '';
  const skipPreflight = AUTH_SKIP_PREFLIGHT.some((ep) => url.includes(ep));

  if (!skipPreflight && typeof window !== 'undefined') {
    sessionManager.recordActivity(false);
    if (sessionManager.isExpiringSoon()) {
      try {
        await sessionManager.ensureFreshSession();
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          return Promise.reject(err);
        }
        // On transient network error during proactive refresh, proceed with original request
      }
    }
  }

  return config;
});

// Response interceptor: handle 401 token renewal with single-flight protection, preserve 403 authorization errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) {
      return Promise.reject(error);
    }

    const url = originalRequest.url || '';
    const isAuthSkip = AUTH_SKIP_RETRY.some((ep) => url.includes(ep));

    // Never treat 403 Forbidden (permission denied) as session expiration
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthSkip) {
      originalRequest._retry = true;

      try {
        await sessionManager.refreshSession();
        return api(originalRequest);
      } catch (refreshErr) {
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
