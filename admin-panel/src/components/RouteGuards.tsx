import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PageLoader from './PageLoader';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Protect routes that require authentication
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, loading, mustChangePassword } = useAuth();
  const token = localStorage.getItem('token');
  const location = window.location;

  if (loading) return <PageLoader />;

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Force password change redirect — skip for OAuth users
  if (mustChangePassword() && !location.pathname.includes('/ganti-password')) {
    return <Navigate to="/ganti-password" replace />;
  }

  return <>{children}</>;
};

/**
 * Protect routes that require author verification
 */
export const AuthorGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const token = localStorage.getItem('token');

  if (loading) return <PageLoader />;
  if (!token || !user) return <Navigate to="/login" replace />;
  if (user.role !== 'ADMIN' && !user.is_verified_author) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

export default AuthGuard;
