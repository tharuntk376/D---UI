import axios from 'axios';
import { API_ENDPOINTS } from '../types/api';

// Default to relative URL so requests go through the Vite dev server proxy (same-origin),
// completely bypassing browser "strict-origin-when-cross-origin" Referrer Policies and CORS limits.
export const DEFAULT_API_URL = '';

export const getApiBaseUrl = () => {
  const saved = localStorage.getItem('dchat_api_url');
  // If previously saved as the direct Render URL, clear it to use the proxy
  if (saved === 'https://danish-chat-1.onrender.com') {
    localStorage.removeItem('dchat_api_url');
    return '';
  }
  return saved ?? (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_URL);
};

export const setApiBaseUrl = (url) => {
  if (!url || url === 'https://danish-chat-1.onrender.com') {
    localStorage.removeItem('dchat_api_url');
  } else {
    localStorage.setItem('dchat_api_url', url);
  }
};

export const getSocketUrl = () => {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    return window.location.origin.replace(/^http/, 'ws');
  }
  return baseUrl.replace(/^http/, 'ws');
};

export const getMediaUrl = (path) => {
  if (!path) return '';
  if (typeof path !== 'string') {
    if (typeof path === 'object' && path !== null) {
      return getMediaUrl(path.url || path.path || path.fileUrl || path.secure_url || path._id || path.id);
    }
    return '';
  }
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }
  const baseUrl = getApiBaseUrl().replace(/\/$/, '');
  // If it's a raw MongoDB ObjectId or media ID (e.g. 24 hex chars)
  if (/^[a-fA-F0-9]{24}$/.test(path) || path.startsWith('file-') || path.startsWith('media-')) {
    return baseUrl ? `${baseUrl}/api/files/getfileaccess/${path}` : `/api/files/getfileaccess/${path}`;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return baseUrl ? `${baseUrl}${cleanPath}` : cleanPath;
};

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Update baseURL on request in case custom URL is changed in settings
api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  const token = localStorage.getItem('accessToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auto refresh token on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/api/auth/login') || originalRequest.url?.includes('/api/auth/refresh')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        isRefreshing = false;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.dispatchEvent(new CustomEvent('auth:expired'));
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(
          `${getApiBaseUrl()}${API_ENDPOINTS.AUTH.REFRESH}`,
          { refreshToken },
          { withCredentials: true }
        );

        const dataObj = typeof data.data === 'object' && data.data !== null ? data.data : {};
        const msgObj = typeof data.message === 'object' && data.message !== null ? data.message : {};

        const newAccessToken =
          data.accessToken ||
          dataObj.accessToken ||
          msgObj.accessToken ||
          data.token ||
          dataObj.token;

        const newRefreshToken =
          data.refreshToken ||
          dataObj.refreshToken ||
          msgObj.refreshToken ||
          refreshToken;

        if (newAccessToken) {
          localStorage.setItem('accessToken', newAccessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

          processQueue(null, newAccessToken);
          return api(originalRequest);
        } else {
          throw new Error('Refresh failed: missing token');
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.dispatchEvent(new CustomEvent('auth:expired'));
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
