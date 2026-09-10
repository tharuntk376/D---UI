import { io } from 'socket.io-client';
import { getApiBaseUrl } from './api';
import { SOCKET_EVENTS } from '../types/api';

let socket = null;

export const getSocket = () => {
  return socket;
};

export const initSocket = (token) => {
  const authToken = token || localStorage.getItem('accessToken');
  const serverUrl = getApiBaseUrl();

  const cleanToken = authToken ? authToken.replace(/^Bearer\s+/i, '') : '';
  const bearerToken = authToken ? (authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`) : '';

  if (socket) {
    if (authToken && socket.auth && socket.auth.token !== cleanToken) {
      socket.disconnect();
    } else if (socket.connected) {
      return socket;
    }
  }

  // Connect directly to remote backend for WebSockets to avoid local proxy stream aborts
  const endpoint = serverUrl || 'https://danish-chat-1.onrender.com';

  socket = io(endpoint, {
    auth: {
      token: cleanToken,
      accessToken: cleanToken,
      authToken: cleanToken,
      jwt: cleanToken,
      Authorization: bearerToken,
    },
    query: {
      token: cleanToken,
    },
    extraHeaders: {
      Authorization: bearerToken,
    },
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 20,
    reconnectionDelay: 1000,
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected to server:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.warn('[Socket] Connection error:', error.message);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export { SOCKET_EVENTS };
