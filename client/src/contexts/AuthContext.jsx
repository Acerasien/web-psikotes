/**
 * Authentication Context
 * Provides authentication state and methods throughout the application
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch current user when token changes
  const fetchUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await api.getCurrentUser();
      setUser(response.data);
    } catch (err) {
      console.error('Gagal mengambil data pengguna:', err);
      logout();
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(async (username, password) => {
    const response = await api.login({ username, password });
    const newToken = response.data.access_token;
    
    setToken(newToken);
    localStorage.setItem('token', newToken);
    
    // Fetch user info after login
    const userResponse = await api.getCurrentUser();
    setUser(userResponse.data);
    
    return userResponse.data;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  }, []);

  const value = {
    // State
    token,
    user,
    loading,
    isAuthenticated: !!token,
    
    // Computed
    isAdmin: user?.role === 'admin',
    isAssessor: user?.role === 'assessor',
    isSuperadmin: user?.role === 'superadmin',
    isParticipant: user?.role === 'participant',
    isStaff: user?.role === 'admin' || user?.role === 'assessor' || user?.role === 'superadmin',
    canSeeResults: user?.role === 'assessor' || user?.role === 'superadmin',
    
    // Methods
    login,
    logout,
    refreshUser: fetchUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
