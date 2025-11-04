import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../providers/AuthProvider';

interface Props {
  children: JSX.Element;
}

export const ProtectedRoute: React.FC<Props> = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};
