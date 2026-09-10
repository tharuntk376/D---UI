import { api } from './api';
import { API_ENDPOINTS } from '../types/api';

export const authService = {
  async login(payload) {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, payload);
      const res = response.data;
      if (res.success === false) {
        throw new Error(res.error?.message || (typeof res.message === 'string' ? res.message : 'Login failed'));
      }

      // Backend may return auth details in res, res.data, or res.message
      const dataObj = typeof res.data === 'object' && res.data !== null ? res.data : {};
      const msgObj = typeof res.message === 'object' && res.message !== null ? res.message : {};

      const accessToken =
        res.accessToken ||
        dataObj.accessToken ||
        msgObj.accessToken ||
        res.token ||
        dataObj.token ||
        msgObj.token;

      const refreshToken =
        res.refreshToken ||
        dataObj.refreshToken ||
        msgObj.refreshToken;

      const user =
        res.user ||
        dataObj.user ||
        msgObj.user ||
        (dataObj._id ? dataObj : null) ||
        (msgObj._id ? msgObj : null);

      if (!accessToken) {
        throw new Error('No access token received from server.');
      }

      return {
        accessToken,
        refreshToken,
        user,
      };
    } catch (error) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      if (typeof error.response?.data?.message === 'string') {
        throw new Error(error.response.data.message);
      }
      if (typeof error.response?.data?.data === 'string' && !error.response?.data?.success) {
        throw new Error(error.response.data.data);
      }
      throw error;
    }
  },

  async logout() {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      if (refreshToken && refreshToken !== 'undefined' && refreshToken !== 'null') {
        await api.post(API_ENDPOINTS.AUTH.LOGOUT, { refreshToken });
      }
    } catch (e) {
      console.warn('Logout request failed:', e);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('dchat_user');
    }
  },

  async getMyProfile() {
    try {
      const response = await api.get(API_ENDPOINTS.AUTH.GET_ME);
      const res = response.data;
      if (res.success === false) {
        throw new Error(res.error?.message || 'Failed to fetch profile');
      }
      const user =
        res.data?.user ||
        (typeof res.data === 'object' && res.data?._id ? res.data : null) ||
        res.user ||
        res.message?.user ||
        (typeof res.message === 'object' && res.message?._id ? res.message : null);
      return user;
    } catch (error) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw error;
    }
  },

  async changePassword(payload) {
    const response = await api.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, payload);
    const res = response.data;
    if (res.success === false) {
      throw new Error(res.error?.message || res.message || 'Failed to change password');
    }
  },

  async forgotPassword(payload) {
    const response = await api.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, payload);
    const res = response.data;
    if (res.success === false) {
      throw new Error(res.error?.message || res.message || 'Password reset request failed');
    }
    const resetToken =
      res.data?.resetToken ||
      res.resetToken ||
      res.message?.resetToken ||
      (typeof res.data === 'string' ? res.data : null);
    return resetToken;
  },

  async resetPassword(payload) {
    const response = await api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, payload);
    const res = response.data;
    if (res.success === false) {
      throw new Error(res.error?.message || res.message || 'Password reset failed');
    }
  },
};

