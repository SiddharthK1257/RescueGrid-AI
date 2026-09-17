'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUser } from '../types';
import { api, getStoredToken } from './api';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginAsDemo: (user: AuthUser & { password: string }) => Promise<{ success: boolean; error?: string }>;
  register: (payload: { name: string; email: string; password: string; role?: string; department?: string; badgeNumber?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Check current session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = getStoredToken();
      if (storedToken) {
        try {
          const res = await api.getMe();
          if (res.success && res.user) {
            setUser(res.user);
            setToken(storedToken);
            setLoading(false);
            return;
          }
        } catch {
          // Token expired or invalid, fall through to default login
        }
      }

      // Auto login as Chief Sarah Jenkins (Commander) as default
      try {
        const res = await api.login('commander@rescuegrid.ai', 'Commander2026!');
        if (res.success && res.user) {
          setUser(res.user);
          setToken(res.token || null);
        }
      } catch {
        // Fallback default state if backend is booting
        setUser({
          userId: 'usr-commander-01',
          name: 'Chief Sarah Jenkins',
          email: 'commander@rescuegrid.ai',
          role: 'COMMANDER_OPERATOR',
          department: 'Incident Command Post',
          badgeNumber: 'CMD-9001'
        });
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await api.login(email, password);
      if (res.success && res.user && res.token) {
        setUser(res.user);
        setToken(res.token);
        setIsAuthModalOpen(false);
        return { success: true };
      }
      return { success: false, error: res.error || 'Authentication failed.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Connection error.' };
    }
  }, []);

  const loginAsDemo = useCallback(async (demoUser: AuthUser & { password: string }) => {
    return login(demoUser.email, demoUser.password);
  }, [login]);

  const register = useCallback(async (payload: {
    name: string;
    email: string;
    password: string;
    role?: string;
    department?: string;
    badgeNumber?: string;
  }) => {
    try {
      const res = await api.register(payload);
      if (res.success && res.user && res.token) {
        setUser(res.user);
        setToken(res.token);
        setIsAuthModalOpen(false);
        return { success: true };
      }
      return { success: false, error: res.error || 'Registration failed.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Connection error.' };
    }
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
    setToken(null);
    setIsAuthModalOpen(true);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        login,
        loginAsDemo,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
