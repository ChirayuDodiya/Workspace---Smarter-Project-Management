import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const PublicRoute: React.FC = () => {
  const { user } = useAuth();

  if (user === undefined) {
    return <div className="w-screen h-screen bg-[#121212]"></div>;
  }

  if (user !== null) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default PublicRoute;
