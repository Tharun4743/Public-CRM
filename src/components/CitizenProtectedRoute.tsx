
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isCitizenLoggedIn } from '../utils/citizenAuth';

interface Props {
  children: React.ReactNode;
}

export const CitizenProtectedRoute = ({ children }: Props) => {
  const isLoggedIn = isCitizenLoggedIn();
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to={`/citizen-login?redirect=${location.pathname}`} replace />;
  }

  return <>{children}</>;
};
