import { createContext } from 'react';

// Pure context objects — no components, no hooks.
// This file is intentionally plain JS so Vite Fast Refresh
// never needs to touch it for component HMR.
export const AuthContext = createContext(undefined);
export const SocketContext = createContext(undefined);
