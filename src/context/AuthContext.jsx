import React, { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { initSocket, disconnectSocket } from '../services/socket';
import { getApiBaseUrl, setApiBaseUrl } from '../services/api';
import { AuthContext } from './contexts';

const decodeUserFromToken = (tok) => {
  if (!tok || typeof tok !== 'string') return null;
  try {
    const parts = tok.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    return {
      _id: parsed.userId || parsed._id || parsed.id,
      username: parsed.username || parsed.name || 'User',
      displayName: parsed.displayName || parsed.username || 'User',
      role: parsed.role || 'USER',
    };
  } catch {
    return null;
  }
};


export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    const saved = localStorage.getItem('accessToken');
    if (!saved || saved === 'undefined' || saved === 'null') return null;
    return saved;
  });

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('dchat_user');
      if (saved && saved !== 'undefined' && saved !== 'null') {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {
      // ignore
    }
    const savedToken = localStorage.getItem('accessToken');
    if (savedToken && savedToken !== 'undefined' && savedToken !== 'null') {
      return decodeUserFromToken(savedToken);
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(true);
  const [serverUrl, setServerUrlState] = useState(getApiBaseUrl());

  const refreshProfile = useCallback(async () => {
    const currentToken = localStorage.getItem('accessToken');
    if (!currentToken || currentToken === 'undefined' || currentToken === 'null') {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const profile = await authService.getMyProfile();
      if (profile) {
        setUser(profile);
        localStorage.setItem('dchat_user', JSON.stringify(profile));
      }
    } catch (error) {
      console.warn('Failed to load profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token && token !== 'undefined' && token !== 'null') {
      initSocket(token);
      refreshProfile();
    } else {
      disconnectSocket();
      setIsLoading(false);
    }

    const handleAuthExpired = () => {
      setToken(null);
      setUser(null);
      disconnectSocket();
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired);
    };
  }, [token, refreshProfile]);

  const login = async (credentials) => {
    setIsLoading(true);
    try {
      const result = await authService.login(credentials);
      if (result.accessToken) {
        localStorage.setItem('accessToken', result.accessToken);
        setToken(result.accessToken);
      }
      if (result.refreshToken) {
        localStorage.setItem('refreshToken', result.refreshToken);
      }
      if (result.user) {
        localStorage.setItem('dchat_user', JSON.stringify(result.user));
        setUser(result.user);
      }
      if (result.accessToken) {
        initSocket(result.accessToken);
      }
      return result.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setToken(null);
      setUser(null);
      disconnectSocket();
    }
  };

  const updateUser = (partial) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...partial };
      localStorage.setItem('dchat_user', JSON.stringify(updated));
      return updated;
    });
  };

  const updateServerUrl = (url) => {
    const cleanUrl = url.trim().replace(/\/$/, '');
    setApiBaseUrl(cleanUrl);
    setServerUrlState(cleanUrl);
    if (token) {
      disconnectSocket();
      initSocket(token);
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isAdmin,
        isLoading,
        serverUrl,
        login,
        logout,
        updateUser,
        updateServerUrl,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

