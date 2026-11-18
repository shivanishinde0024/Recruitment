'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (user.role === 'admin') router.push('/admin/dashboard');
        else if (user.role === 'staff') router.push('/staff/dashboard');
        else if (user.role === 'company') router.push('/company/dashboard');
        else router.push('/login');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Redirecting...</span>
      </div>
    </div>
  );
}
