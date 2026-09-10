import { api } from './api';
import { API_ENDPOINTS } from '../types/api';

export const fileService = {
  async uploadFile(file, mediaType = 'FILE', conversationId = null, duration = null) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mediaType', mediaType);
    if (conversationId) formData.append('conversationId', conversationId);
    if (duration) formData.append('duration', duration.toString());

    let resData = null;
    try {
      const response = await api.post(API_ENDPOINTS.FILES.UPLOAD, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      resData = response.data;
    } catch {
      try {
        const response2 = await api.post(API_ENDPOINTS.MEDIA.UPLOAD, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        resData = response2.data;
      } catch {
        const response3 = await api.post('/api/files/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        resData = response3.data;
      }
    }

    const payload =
      resData?.data?.media ||
      resData?.data?.file ||
      resData?.media ||
      resData?.file ||
      resData?.data ||
      resData;

    return payload;
  },

  async uploadChatMedia(file, conversationId, caption, duration) {
    const formData = new FormData();
    formData.append('file', file);
    if (conversationId) formData.append('conversationId', conversationId);
    if (caption) formData.append('caption', caption);
    if (duration) formData.append('duration', duration.toString());

    let resData = null;
    try {
      const response = await api.post(API_ENDPOINTS.MEDIA.UPLOAD, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      resData = response.data;
    } catch {
      const response2 = await api.post(API_ENDPOINTS.FILES.UPLOAD, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      resData = response2.data;
    }

    return (
      resData?.data?.media ||
      resData?.data?.file ||
      resData?.media ||
      resData?.file ||
      resData?.data ||
      resData
    );
  },
};
