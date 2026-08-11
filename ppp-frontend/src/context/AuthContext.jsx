// context/AuthContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { authService } from '../services/authServices/authService';
import { apiClient } from '../utils/apiClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loginError, setLoginError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isInitialCheckDone, setIsInitialCheckDone] = useState(false);

  const login = async (emailOrUsername, password) => {
    setLoading(true);
    setLoginError(null);
    try {
      const userData = await authService.login(emailOrUsername, password);
      setUser(userData);
      return userData;
    } catch (error) {
      setLoginError(error.message || 'Login failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    // Prevent back navigation after logout
    window.history.pushState(null, '', '/login');
  };

  const isAuthenticated = () => {
    return authService.isAuthenticated() && user !== null;
  };

  // On app load, check if there is a token and fetch user profile
  const checkAuth = useCallback(async () => {
    const hasToken = authService.isAuthenticated();
    if (hasToken) {
      try {
        const response = await apiClient.get('/users/profile');
        setUser(response.data || response);
      } catch (error) {
        // token invalid - clear everything
        authService.logout();
        setUser(null);
      }
    }
    // Always mark initial check as done, regardless of token
    setIsInitialCheckDone(true);
  }, []);

  // Prevent back button access to protected pages after logout
  useEffect(() => {
    const handlePopState = () => {
      if (!authService.isAuthenticated()) {
        // User pressed back but is not authenticated - redirect to login
        window.location.replace('/login');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Prevent browser caching of protected pages
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Tell browser not to cache this page
      navigator.serviceWorker?.controller?.postMessage({ type: 'CLEAR_CACHE' });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Run initial auth check on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, checkAuth, loginError, isAuthenticated, isInitialCheckDone }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);