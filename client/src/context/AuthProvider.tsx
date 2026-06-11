import React, { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import type { User } from '../types/auth';
import api from '../services/api';

import { socket } from '../services/socket';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  // Manage socket connection lifecycle
  useEffect(() => {
    if (user) {
      socket.connect();

      const onConnect = () => {
        socket.emit('join:user', user.id);
      };

      socket.on('connect', onConnect);
      if (socket.connected) {
        onConnect();
      }

      return () => {
        socket.off('connect', onConnect);
        socket.disconnect();
      };
    } else {
      socket.disconnect();
    }
  }, [user]);

  // Verify session validity via /auth/me
  const checkAuth = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data && response.data.success) {
        setUser(response.data.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  // Run initial session check on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      void checkAuth();
    }, 0);
    return () => clearTimeout(timer);
  }, [checkAuth]);

  // Log in using credentials
  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data && response.data.success) {
      setUser(response.data.data);
    }
  }, []);

  // Log out and clear state
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
