/**
 * Real-Time Chat Backend API & WebSocket Constants
 * File: src/types/api.js
 */

export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  AUTHENTICATE: 'authenticate',
  USER_ONLINE: 'presence:online',
  USER_OFFLINE: 'presence:offline',
  STATUS_UPDATE: 'presence:status_update',
  MESSAGE_SEND: 'message:send',
  MESSAGE_RECEIVE: 'message:receive',
  MESSAGE_EDIT: 'message:edit',
  MESSAGE_EDITED: 'message:edited',
  MESSAGE_DELETE: 'message:delete',
  MESSAGE_DELETED: 'message:deleted',
  MESSAGE_REACT: 'message:react',
  MESSAGE_REACTION: 'message:reaction',
  MESSAGE_READ: 'message:read',
  MESSAGE_READ_RECEIPT: 'message:read_receipt',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  CALL_INITIATE: 'call:initiate',
  CALL_OFFER: 'call:offer',
  CALL_ANSWER: 'call:answer',
  CALL_ICE_CANDIDATE: 'call:ice_candidate',
  CALL_REJECT: 'call:reject',
  CALL_END: 'call:end',
  NOTIFICATION_NEW: 'notification:new',
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REFRESH: '/api/auth/refresh',
    LOGOUT: '/api/auth/logout',
    GET_ME: '/api/auth/getmyprofile',
    CHANGE_PASSWORD: '/api/auth/changepassword',
    FORGOT_PASSWORD: '/api/auth/forgotpassword',
    RESET_PASSWORD: '/api/auth/resetpassword',
  },
  USERS: {
    GET_CONTACTS: '/api/users/getcontacts',
    GET_PROFILE: (id) => `/api/users/getprofile/${id}`,
    UPDATE_PROFILE: '/api/users/updateprofile',
  },
  CHAT: {
    START_CONVERSATION: '/api/chat/startconversation',
    GET_CONVERSATIONS: '/api/chat/getconversations',
  },
  MESSAGES: {
    GET_MESSAGES: (conversationId) => `/api/messages/getmessages/${conversationId}`,
    SEND_MESSAGE: '/api/messages/sendmessage',
    EDIT_MESSAGE: (messageId) => `/api/messages/editmessage/${messageId}`,
    DELETE_MESSAGE: (messageId) => `/api/messages/deletemessage/${messageId}`,
    REACT_MESSAGE: (messageId) => `/api/messages/react/${messageId}`,
    REACTION_MESSAGE: (messageId) => `/api/messages/reaction/${messageId}`,
    MARK_READ: (conversationId) => `/api/messages/markread/${conversationId}`,
  },
  FILES: {
    UPLOAD: '/api/files/uploadfile',
    GET_ACCESS: (fileId) => `/api/files/getfileaccess/${fileId}`,
    DELETE: (fileId) => `/api/files/deletefile/${fileId}`,
  },
  MEDIA: {
    UPLOAD: '/api/media/uploadmedia',
    GET_MEDIA: (id) => `/api/media/getmedia/${id}`,
    DELETE: (id) => `/api/media/deletemedia/${id}`,
  },
  NOTIFICATIONS: {
    GET_ALL: '/api/notifications/getnotifications',
    MARK_READ: (id) => `/api/notifications/markread/${id}`,
    MARK_ALL_READ: '/api/notifications/markallread',
  },
  ADMIN: {
    CREATE_USER: '/api/admin/createuser',
    GET_USERS: '/api/admin/getallusers',
    GET_USER: (id) => `/api/admin/getuserbyid/${id}`,
    UPDATE_USER: (id) => `/api/admin/updateuser/${id}`,
    SET_STATUS: (id) => `/api/admin/usersstatus/${id}`,
    RESET_PASSWORD: (id) => `/api/admin/resetpassword/${id}`,
    DELETE_USER: (id) => `/api/admin/deleteuser/${id}`,
    GET_STATS: '/api/admin/getallstats',
  },
};
