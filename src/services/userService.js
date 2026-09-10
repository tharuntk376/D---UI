import { api } from './api';
import { API_ENDPOINTS } from '../types/api';

export const userService = {
  async getContacts() {
    try {
      const response = await api.get(API_ENDPOINTS.USERS.GET_CONTACTS);
      const res = response.data;
      if (res.success === false) {
        throw new Error(res.error?.message || res.message || 'Failed to fetch contacts');
      }

      const contacts =
        res.data?.contacts ||
        (Array.isArray(res.data) ? res.data : null) ||
        res.contacts ||
        (Array.isArray(res.message?.contacts) ? res.message.contacts : null) ||
        (Array.isArray(res.message) ? res.message : null) ||
        [];

      return contacts;
    } catch (err) {
      console.warn('API getContacts error:', err);
      throw err;
    }
  },

  async getProfile(id) {
    const response = await api.get(API_ENDPOINTS.USERS.GET_PROFILE(id));
    const res = response.data;
    if (res.success === false) {
      throw new Error(res.error?.message || res.message || 'Failed to fetch user');
    }
    return res.data?.user || (typeof res.data === 'object' && res.data?._id ? res.data : null) || res.user || res.data;
  },

  async updateProfile(data) {
    const response = await api.put(API_ENDPOINTS.USERS.UPDATE_PROFILE, data);
    const res = response.data;
    if (res.success === false) {
      throw new Error(res.error?.message || res.message || 'Failed to update profile');
    }
    return res.data?.user || (typeof res.data === 'object' && res.data?._id ? res.data : null) || res.user || res.data;
  },
};
