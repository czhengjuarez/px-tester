import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://px-tester-api.px-tester.workers.dev/api';
      console.log('[Auth] Checking auth at:', `${API_URL}/auth/me`);
      const response = await fetch(`${API_URL}/auth/me`, {
        credentials: 'include'
      });
      console.log('[Auth] Check auth response status:', response.status);
      const data = await response.json();
      console.log('[Auth] Check auth data:', data);
      setUser(data.user);
    } catch (error) {
      console.error('[Auth] Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://px-tester-api.px-tester.workers.dev/api';
      console.log('[Auth] Getting OAuth URL from:', `${API_URL}/auth/google`);
      const response = await fetch(`${API_URL}/auth/google`);
      const data = await response.json();
      console.log('[Auth] OAuth URL:', data.url);
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('[Auth] Login failed:', error);
    }
  };

  const logout = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://px-tester-api.px-tester.workers.dev/api';
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      setUser(null);
      window.location.href = '/';
    } catch (error) {
      console.error('[Auth] Logout failed:', error);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
    isSuperAdmin: user?.role === 'super_admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
