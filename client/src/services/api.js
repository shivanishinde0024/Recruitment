import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Axios request interceptor to attach Bearer token if present
api.interceptors.request.use((config) => {
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(^|;\s*)access_token=([^;]+)/);
    const token = match ? match[2] : (typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null);
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

let refreshPromise = null;

// Axios response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip retry on auth login and refresh to prevent infinite redirect loop.
    // Note: /auth/me is intentionally allowed to trigger token refresh so expired sessions recover silently!
    const isAuthEndpoint = 
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = api.post('/auth/refresh')
          .then((res) => {
            const newToken = res.data?.data?.token;
            const newUser = res.data?.data?.user;
            if (newToken) {
              if (typeof localStorage !== 'undefined') {
                localStorage.setItem('access_token', newToken);
              }
              if (typeof document !== 'undefined') {
                document.cookie = `access_token=${newToken}; path=/; max-age=604800; SameSite=Lax`;
              }
            }
            if (newUser && typeof localStorage !== 'undefined') {
              localStorage.setItem('rp_user', JSON.stringify(newUser));
            }
            refreshPromise = null;
            return res;
          })
          .catch((refreshErr) => {
            refreshPromise = null;
            if (typeof localStorage !== 'undefined') {
              localStorage.removeItem('access_token');
              localStorage.removeItem('rp_user');
            }
            if (typeof document !== 'undefined') {
              document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            }
            if (typeof window !== 'undefined') {
              const path = window.location.pathname;
              // ONLY redirect to login if the user is actively in a protected workspace area (/admin, /staff, /company).
              // The landing page (/), auth pages, and public assets must ALWAYS remain publicly accessible!
              const isProtectedArea = ['/admin', '/staff', '/company'].some(p => path.startsWith(p));
              if (isProtectedArea) {
                window.location.href = '/login?session_expired=1';
              }
            }
            return Promise.reject(refreshErr);
          });
      }

      try {
        const refreshRes = await refreshPromise;
        const freshToken = refreshRes.data?.data?.token;
        if (freshToken) {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers['Authorization'] = `Bearer ${freshToken}`;
        }
        return api(originalRequest);
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
