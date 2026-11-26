'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '../services/api';
import sessionManager from '../services/sessionManager';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Initialize centralized session monitor and subscribe to cross-tab session events
  useEffect(() => {
    sessionManager.init();

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

    const unsubscribe = sessionManager.subscribe((event) => {
      if (event.type === 'SESSION_RENEWED' && event.user) {
        setUser(event.user);
      } else if (event.type === 'SESSION_EXPIRED' || event.type === 'LOGOUT') {
        setUser(null);
      }
    });

    return () => {
      unsubscribe();
      sessionManager.destroy();
    };
  }, []);

  // Record route navigation as user activity
  useEffect(() => {
    if (user && pathname) {
      sessionManager.recordActivity(false);
    }
  }, [pathname, user]);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.success && res.data?.data) {
        const { sessionExpiresAt, inactivityTimeoutMs, ...userData } = res.data.data;
        setUser(userData);
        sessionManager.startSession({
          expiresAt: sessionExpiresAt || null,
          inactivityTimeoutMs: inactivityTimeoutMs || null,
          user: userData
        });
      } else {
        setUser(null);
        sessionManager.clearSessionState();
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setUser(null);
        sessionManager.clearSessionState();
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
      const { user: loggedInUser, expiresAt, inactivityTimeoutMs } = res.data.data;

      sessionManager.startSession({
        expiresAt: expiresAt || null,
        inactivityTimeoutMs: inactivityTimeoutMs || null,
        user: loggedInUser
      });
      setUser(loggedInUser);

      // Check for redirect query parameter (e.g. /login?redirect=%2Fadmin%2Fdashboard)
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
      sessionManager.endSession({ broadcast: true, expired: false });
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
