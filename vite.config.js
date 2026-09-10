import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const handleProxyError = (proxy) => {
  proxy.on('error', (err, _req, _res) => {
    if (
      err.code === 'ECONNABORTED' ||
      err.code === 'ECONNRESET' ||
      err.code === 'EPIPE' ||
      err.message?.includes('socket') ||
      err.message?.includes('abort')
    ) {
      return;
    }
    console.warn('[Vite Proxy]:', err.message);
  });
  proxy.on('proxyReqWs', (_proxyReq, _req, socket) => {
    socket.on('error', (err) => {
      if (err.code === 'ECONNABORTED' || err.code === 'ECONNRESET' || err.code === 'EPIPE') {
        return;
      }
    });
  });
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://danish-chat-1.onrender.com',
        changeOrigin: true,
        secure: false,
        configure: handleProxyError,
      },
      '/socket.io': {
        target: 'https://danish-chat-1.onrender.com',
        changeOrigin: true,
        ws: true,
        secure: false,
        configure: handleProxyError,
      },
      '/uploads': {
        target: 'https://danish-chat-1.onrender.com',
        changeOrigin: true,
        secure: false,
        configure: handleProxyError,
      },
    },
  },
});
