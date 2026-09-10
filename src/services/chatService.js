import { api } from './api';
import { API_ENDPOINTS } from '../types/api';

export const chatService = {
  async getConversations() {
    try {
      const response = await api.get(API_ENDPOINTS.CHAT.GET_CONVERSATIONS);
      const res = response.data;
      if (res.success === false) {
        throw new Error(res.error?.message || res.message || 'Failed to fetch conversations');
      }

      const conversations =
        res.data?.conversations ||
        (Array.isArray(res.data) ? res.data : null) ||
        res.conversations ||
        (Array.isArray(res.message?.conversations) ? res.message.conversations : null) ||
        (Array.isArray(res.message) ? res.message : null) ||
        [];

      return conversations;
    } catch (err) {
      console.warn('API getConversations error:', err);
      throw err;
    }
  },

  async startConversation(recipientId) {
    const response = await api.post(API_ENDPOINTS.CHAT.START_CONVERSATION, {
      recipientId,
    });
    const res = response.data;
    if (res.success === false) {
      throw new Error(res.error?.message || res.message || 'Failed to start conversation');
    }
    return res.data?.conversation || res.data || res.conversation;
  },

  async getMessages(conversationId) {
    try {
      const response = await api.get(API_ENDPOINTS.MESSAGES.GET_MESSAGES(conversationId));
      const res = response.data;
      if (res.success === false) {
        throw new Error(res.error?.message || res.message || 'Failed to fetch messages');
      }

      const messages =
        res.data?.messages ||
        (Array.isArray(res.data) ? res.data : null) ||
        res.messages ||
        (Array.isArray(res.message?.messages) ? res.message.messages : null) ||
        (Array.isArray(res.message) ? res.message : null) ||
        [];

      return messages;
    } catch (err) {
      console.warn('API getMessages error:', err);
      throw err;
    }
  },

  async sendMessage(payload) {
    const response = await api.post(API_ENDPOINTS.MESSAGES.SEND_MESSAGE, payload);
    const res = response.data;
    if (res.success === false) {
      throw new Error(res.error?.message || res.message || 'Failed to send message');
    }
    return res.data?.message || (typeof res.data === 'object' && res.data?._id ? res.data : null) || res.message || res.data;
  },

  async editMessage(messageId, payload) {
    try {
      const response = await api.put(API_ENDPOINTS.MESSAGES.EDIT_MESSAGE(messageId), payload);
      const res = response.data;
      if (res.success === false) {
        throw new Error(res.error?.message || res.message || 'Failed to edit message');
      }
      return res.data?.message || res.data || res.message;
    } catch (err) {
      // Fallback: try PATCH /api/messages/:id or /api/messages/edit/:id
      try {
        const fallback = await api.patch(`/api/messages/${messageId}`, payload);
        return fallback.data?.message || fallback.data?.data || fallback.data;
      } catch {
        try {
          const fallback2 = await api.put(`/api/messages/${messageId}`, payload);
          return fallback2.data?.message || fallback2.data?.data || fallback2.data;
        } catch {
          // If server uses socket events exclusively, resolve with payload
          return { _id: messageId, ...payload, isEdited: true };
        }
      }
    }
  },

  async deleteMessage(messageId, deleteForAll = true) {
    try {
      const response = await api.delete(API_ENDPOINTS.MESSAGES.DELETE_MESSAGE(messageId), {
        data: { deleteForAll },
      });
      return response.data;
    } catch (err) {
      // Fallback: try DELETE /api/messages/:id
      try {
        const fallback = await api.delete(`/api/messages/${messageId}`, {
          data: { deleteForAll },
        });
        return fallback.data;
      } catch {
        // Socket emission handles real-time deletion
        return { success: true };
      }
    }
  },

  async reactToMessage(messageId, emoji, conversationId = null) {
    const payload = { emoji, reaction: emoji, conversationId };
    try {
      const response = await api.post(API_ENDPOINTS.MESSAGES.REACT_MESSAGE(messageId), payload);
      return response.data?.data || response.data;
    } catch {
      try {
        const response = await api.post(API_ENDPOINTS.MESSAGES.REACTION_MESSAGE(messageId), payload);
        return response.data?.data || response.data;
      } catch {
        try {
          const response = await api.post(`/api/messages/${messageId}/react`, payload);
          return response.data?.data || response.data;
        } catch {
          try {
            const response = await api.post(`/api/messages/${messageId}/reaction`, payload);
            return response.data?.data || response.data;
          } catch {
            // Sockets handle reaction broadcast
            return { success: true, messageId, emoji };
          }
        }
      }
    }
  },

  async markRead(conversationId) {
    try {
      const response = await api.post(API_ENDPOINTS.MESSAGES.MARK_READ(conversationId));
      return response.data?.data;
    } catch {
      // Non-blocking
      return null;
    }
  },
};
