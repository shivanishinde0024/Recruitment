'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Hydrate cached user from localStorage on client mount to eliminate delay/flicker
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        const cachedUser = localStorage.getItem('rp_user');
        if (cachedUser) {
          const parsed = JSON.parse(cachedUser);
          if (parsed && parsed.name && parsed.role) {
            setUser(parsed);
          }
        }
      } catch {
        // Ignore JSON parse errors
      }
    }
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.success && res.data?.data) {
        setUser(res.data.data);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('rp_user', JSON.stringify(res.data.data));
        }
      } else {
        setUser(null);
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('rp_user');
        }
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setUser(null);
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('rp_user');
          localStorage.removeItem('access_token');
        }
        if (typeof document !== 'undefined') {
          document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    if (res.data?.success) {
      const loggedInUser = res.data.data.user;
      const token = res.data.data.token;
      const refreshToken = res.data.data.refreshToken;

      // 1. Explicitly store access_token, refresh_token, and user info
      if (typeof localStorage !== 'undefined') {
        if (token) localStorage.setItem('access_token', token);
        if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
        if (loggedInUser) localStorage.setItem('rp_user', JSON.stringify(loggedInUser));
      }
      if (token && typeof document !== 'undefined') {
        document.cookie = `access_token=${token}; path=/; max-age=86400; SameSite=Lax`;
      }

      setUser(loggedInUser);

      // 2. Check for redirect query parameter (e.g. /login?redirect=%2Fadmin%2Fdashboard)
      let target = `/${loggedInUser.role}/dashboard`;
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const redirectParam = urlParams.get('redirect');
        if (redirectParam && redirectParam.startsWith(`/${loggedInUser.role}`)) {
          target = redirectParam;
        }
        window.location.href = target;
      } else {
        router.push(target);
      }
      return res.data;
    }
    throw new Error(res.data?.message || 'Login failed');
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      if (typeof document !== 'undefined') {
        document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('rp_user');
      }
      setUser(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      } else {
        router.push('/login');
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser: fetchCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
