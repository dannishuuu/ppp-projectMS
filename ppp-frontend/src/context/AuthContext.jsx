// context/AuthContext.js
import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { authService } from '../services/authServices/authService';
import { apiClient } from '../utils/apiClient';
import { SessionTimeoutModal } from '../components/Common/SessionTimeoutModal';

const AuthContext = createContext();

const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes inactivity
const COUNTDOWN_INITIAL = 60; // 1 minute (60 seconds) countdown warning
const REFRESH_THROTTLE_MS = 4 * 60 * 1000; // Throttle active silent refresh to every 4 minutes

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loginError, setLoginError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isInitialCheckDone, setIsInitialCheckDone] = useState(false);

  // Inactivity timeout state
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_INITIAL);

  const lastActivityRef = useRef(Date.now());
  const lastRefreshRef = useRef(Date.now());
  const countdownIntervalRef = useRef(null);

  const login = async (emailOrUsername, password) => {
    setLoading(true);
    setLoginError(null);
    try {
      const userData = await authService.login(emailOrUsername, password);
      setUser(userData);
      lastActivityRef.current = Date.now();
      lastRefreshRef.current = Date.now();
      setShowTimeoutModal(false);
      return userData;
    } catch (error) {
      setLoginError(error.message || 'Login failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    setShowTimeoutModal(false);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setUser(null);
    authService.logout();
    window.history.pushState(null, '', '/login');
  }, []);

  const isAuthenticated = useCallback(() => {
    return authService.isAuthenticated() && user !== null;
  }, [user]);

  // Handle Continuing session on modal interaction
  const handleContinueSession = useCallback(async () => {
    try {
      await authService.refreshToken();
    } catch (err) {
      console.error('Failed to extend session token:', err);
    }
    lastActivityRef.current = Date.now();
    lastRefreshRef.current = Date.now();
    setShowTimeoutModal(false);
    setCountdown(COUNTDOWN_INITIAL);
  }, []);

  // On app load, check if there is a token and fetch user profile
  const checkAuth = useCallback(async () => {
    const hasToken = authService.isAuthenticated();
    if (hasToken) {
      try {
        const response = await apiClient.get('/users/profile');
        setUser(response.data || response);
        lastActivityRef.current = Date.now();
        lastRefreshRef.current = Date.now();
      } catch (error) {
        authService.logout();
        setUser(null);
      }
    }
    setIsInitialCheckDone(true);
  }, []);

  // Track User Activity & Perform Silent Token Extension for Active Users
  useEffect(() => {
    if (!user) return;

    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    const handleUserActivity = () => {
      const now = Date.now();
      lastActivityRef.current = now;

      // If user is active and modal is not open, silently refresh token periodically (every 4 mins)
      if (!showTimeoutModal && now - lastRefreshRef.current >= REFRESH_THROTTLE_MS) {
        lastRefreshRef.current = now;
        authService.refreshToken().catch((err) => {
          console.warn('Silent token refresh failed:', err);
        });
      }
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [user, showTimeoutModal]);

  // Main Idle Check & Modal Countdown Loop
  useEffect(() => {
    if (!user) return;

    const timer = setInterval(() => {
      if (!showTimeoutModal) {
        const idleTime = Date.now() - lastActivityRef.current;
        if (idleTime >= IDLE_TIMEOUT_MS) {
          setShowTimeoutModal(true);
          setCountdown(COUNTDOWN_INITIAL);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [user, showTimeoutModal]);

  // 1-minute countdown interval while Inactivity Modal is visible
  useEffect(() => {
    if (!showTimeoutModal) return;

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          logout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [showTimeoutModal, logout]);

  // Prevent back button access to protected pages after logout
  useEffect(() => {
    const handlePopState = () => {
      if (!authService.isAuthenticated()) {
        window.location.replace('/login');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Prevent browser caching of protected pages
  useEffect(() => {
    const handleBeforeUnload = () => {
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
      {user && (
        <SessionTimeoutModal
          open={showTimeoutModal}
          countdown={countdown}
          onContinue={handleContinueSession}
          onLogout={logout}
        />
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);