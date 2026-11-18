'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.success && res.data?.data) {
        setUser(res.data.data);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
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
      setUser(loggedInUser);
      // Route by role
      if (loggedInUser.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (loggedInUser.role === 'staff') {
        router.push('/staff/dashboard');
      } else if (loggedInUser.role === 'company') {
        router.push('/company/dashboard');
      } else {
        router.push('/');
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
      setUser(null);
      router.push('/login');
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
