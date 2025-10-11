import React from 'react';
import { Navigate } from 'react-router-dom';
import { authState } from '../utils/mockData';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  if (!authState.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(authState.currentRole)) {
    return <Navigate to={`/${authState.currentRole}`} replace />;
  }

  return children;
}
