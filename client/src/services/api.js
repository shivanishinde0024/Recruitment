import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

let refreshPromise = null;

// Axios response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip retry on auth endpoints to prevent infinite redirect loop
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = api.post('/auth/refresh')
          .then((res) => {
            refreshPromise = null;
            return res;
          })
          .catch((refreshErr) => {
            refreshPromise = null;
            if (typeof window !== 'undefined') {
              window.location.href = '/login?session_expired=1';
            }
            return Promise.reject(refreshErr);
          });
      }

      try {
        await refreshPromise;
        return api(originalRequest);
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
