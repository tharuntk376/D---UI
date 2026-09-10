import React, { useEffect, useState, useCallback } from 'react';
import { getSocket, initSocket, SOCKET_EVENTS } from '../services/socket';
import { useAuth } from '../hooks/useAuth';
import { SocketContext } from './contexts';
import { Bell, X, CheckCircle, AlertTriangle, Info } from 'lucide-react';

const playNotificationSound = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Ignore audio autoplay restrictions
  }
};

const triggerDesktopNotification = (title, body) => {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, { body, icon: '/favicon.ico' });
      } catch {
        // ignore
      }
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().catch(() => {});
    }
  }
};

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({});
  const [incomingCall, setIncomingCall] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const handleIncomingNotification = useCallback((payload) => {
    if (!payload) return;
    const title = payload.title || payload.senderName || 'New Notification';
    const body = payload.message || payload.body || payload.text || 'You have received a new update.';
    const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const newNotif = {
      id,
      title,
      body,
      type: payload.type || 'INFO',
      createdAt: new Date().toISOString(),
      ...payload,
    };

    setNotifications((prev) => [newNotif, ...prev.slice(0, 4)]);
    playNotificationSound();
    triggerDesktopNotification(title, body);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  }, []);

  useEffect(() => {
    if (!token) {
      setIsConnected(false);
      setOnlineUserIds(new Set());
      return;
    }

    const socket = initSocket(token);
    if (!socket) return;

    const onConnect = () => {
      setIsConnected(true);
      console.log('[Socket] Connected, announcing presence...');
      const cleanToken = token.replace(/^Bearer\s+/i, '');
      socket.emit(SOCKET_EVENTS.AUTHENTICATE, { token: cleanToken });
      socket.emit('authenticate', { token: cleanToken });
      socket.emit('presence:online');
      socket.emit('user:online');
      socket.emit('get_online_users');
      socket.emit('online_users');
      socket.emit('presence:get');
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const handleUserOnline = (payload) => {
      if (!payload) return;
      if (typeof payload === 'string') {
        setOnlineUserIds((prev) => new Set(prev).add(payload));
      } else if (Array.isArray(payload)) {
        setOnlineUserIds((prev) => {
          const next = new Set(prev);
          payload.forEach((item) => {
            const id = typeof item === 'object' ? item._id || item.userId || item.id : item;
            if (id) next.add(id);
          });
          return next;
        });
      } else if (typeof payload === 'object') {
        const list = payload.users || payload.onlineUsers || payload.userIds || payload.onlineUserIds;
        if (Array.isArray(list)) {
          setOnlineUserIds((prev) => {
            const next = new Set(prev);
            list.forEach((item) => {
              const id = typeof item === 'object' ? item._id || item.userId || item.id : item;
              if (id) next.add(id);
            });
            return next;
          });
        } else {
          const uid = payload.userId || payload._id || payload.id || payload.user?._id || payload.user?.id;
          if (uid) setOnlineUserIds((prev) => new Set(prev).add(uid));
        }
      }
    };

    const handleUserOffline = (payload) => {
      if (!payload) return;
      let uid = null;
      if (typeof payload === 'string') {
        uid = payload;
      } else if (typeof payload === 'object') {
        uid = payload.userId || payload._id || payload.id || payload.user?._id || payload.user?.id;
      }
      if (uid) {
        setOnlineUserIds((prev) => {
          const next = new Set(prev);
          next.delete(uid);
          return next;
        });
      }
    };

    const onTypingStart = (payload) => {
      if (payload?.conversationId && payload?.userId !== user?._id) {
        setTypingUsers((prev) => ({
          ...prev,
          [payload.conversationId]: payload.displayName || payload.username || 'Someone',
        }));
      }
    };

    const onTypingStop = (payload) => {
      if (payload?.conversationId) {
        setTypingUsers((prev) => {
          const next = { ...prev };
          delete next[payload.conversationId];
          return next;
        });
      }
    };

    const onCallInitiate = (payload) => {
      setIncomingCall(payload);
    };

    const onlineEvents = [
      SOCKET_EVENTS.USER_ONLINE,
      'user:online',
      'user_online',
      'userOnline',
      'presence:list',
      'online_users',
      'onlineUsers',
      'get_online_users',
      'users:online',
      'users_online',
      'presence:status_update',
      'user:status',
    ];

    const offlineEvents = [
      SOCKET_EVENTS.USER_OFFLINE,
      'user:offline',
      'user_offline',
      'userOffline',
    ];

    const notificationEvents = [
      SOCKET_EVENTS.NOTIFICATION_NEW,
      'notification:new',
      'notification:send',
      'notification:receive',
      'notification',
      'notify',
      'push_notification',
      'user:notification',
    ];

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    onlineEvents.forEach((evt) => socket.on(evt, handleUserOnline));
    offlineEvents.forEach((evt) => socket.on(evt, handleUserOffline));
    notificationEvents.forEach((evt) => socket.on(evt, handleIncomingNotification));

    socket.on(SOCKET_EVENTS.TYPING_START, onTypingStart);
    socket.on('typing:start', onTypingStart);
    socket.on('typing_start', onTypingStart);
    socket.on('typing', onTypingStart);

    socket.on(SOCKET_EVENTS.TYPING_STOP, onTypingStop);
    socket.on('typing:stop', onTypingStop);
    socket.on('typing_stop', onTypingStop);

    socket.on(SOCKET_EVENTS.CALL_INITIATE, onCallInitiate);

    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      onlineEvents.forEach((evt) => socket.off(evt, handleUserOnline));
      offlineEvents.forEach((evt) => socket.off(evt, handleUserOffline));
      notificationEvents.forEach((evt) => socket.off(evt, handleIncomingNotification));
      socket.off(SOCKET_EVENTS.TYPING_START, onTypingStart);
      socket.off('typing:start', onTypingStart);
      socket.off('typing_start', onTypingStart);
      socket.off('typing', onTypingStart);
      socket.off(SOCKET_EVENTS.TYPING_STOP, onTypingStop);
      socket.off('typing:stop', onTypingStop);
      socket.off('typing_stop', onTypingStop);
      socket.off(SOCKET_EVENTS.CALL_INITIATE, onCallInitiate);
    };
  }, [token, user?._id, handleIncomingNotification]);

  const sendNotificationViaSocket = useCallback(
    (recipientId, notification = {}) => {
      const socket = getSocket();
      if (!socket || !socket.connected) {
        console.warn('[Socket] Cannot send notification: socket not connected');
        return false;
      }

      const payload =
        typeof notification === 'string'
          ? {
              recipientId,
              targetUserId: recipientId,
              userId: recipientId,
              title: 'Notification',
              message: notification,
              body: notification,
              senderId: user?._id,
              senderName: user?.displayName || user?.username || 'System',
              createdAt: new Date().toISOString(),
            }
          : {
              recipientId,
              targetUserId: recipientId,
              userId: recipientId,
              title: notification.title || 'Notification',
              message: notification.message || notification.body || notification.text || '',
              body: notification.body || notification.message || notification.text || '',
              type: notification.type || 'INFO',
              senderId: user?._id,
              senderName: user?.displayName || user?.username || 'System',
              createdAt: new Date().toISOString(),
              ...notification,
            };

      socket.emit(SOCKET_EVENTS.NOTIFICATION_NEW, payload);
      socket.emit('notification:send', payload);
      socket.emit('notification:new', payload);
      socket.emit('notification', payload);
      socket.emit('notify_user', payload);
      socket.emit('push_notification', payload);
      socket.emit('user:notification', payload);

      return true;
    },
    [user]
  );

  const sendMessageViaSocket = useCallback((payload) => {
    return new Promise((resolve, reject) => {
      const socket = getSocket();
      if (!socket || !socket.connected) {
        reject(new Error('Socket is not connected'));
        return;
      }

      socket.emit(SOCKET_EVENTS.MESSAGE_SEND, payload, (response) => {
        if (response?.success && response?.message) {
          resolve(response.message);
        } else {
          resolve(response);
        }
      });
    });
  }, []);

  const sendTyping = useCallback((conversationId, isTyping) => {
    const socket = getSocket();
    if (!socket || !socket.connected) return;
    const event = isTyping ? SOCKET_EVENTS.TYPING_START : SOCKET_EVENTS.TYPING_STOP;
    socket.emit(event, { conversationId });
  }, []);

  const markAsReadViaSocket = useCallback((conversationId) => {
    const socket = getSocket();
    if (!socket || !socket.connected) return;
    socket.emit(SOCKET_EVENTS.MESSAGE_READ, { conversationId });
  }, []);

  const deleteMessageViaSocket = useCallback((messageId, deleteForAll = true) => {
    const socket = getSocket();
    if (!socket || !socket.connected) return;
    socket.emit(SOCKET_EVENTS.MESSAGE_DELETE, { messageId, deleteForAll });
  }, []);

  const editMessageViaSocket = useCallback((messageId, text) => {
    const socket = getSocket();
    if (!socket || !socket.connected) return;
    socket.emit(SOCKET_EVENTS.MESSAGE_EDIT, { messageId, text });
  }, []);

  const reactToMessageViaSocket = useCallback((messageId, emoji, conversationId) => {
    const socket = getSocket();
    if (!socket || !socket.connected) return;
    const payload = { messageId, emoji, reaction: emoji, conversationId };
    socket.emit(SOCKET_EVENTS.MESSAGE_REACT || 'message:react', payload);
    socket.emit('message:reaction', payload);
    socket.emit('reaction:add', payload);
    socket.emit('reaction', payload);
  }, []);

  const dismissCall = useCallback(() => {
    setIncomingCall(null);
  }, []);

  const onNotification = useCallback((callback) => {
    const socket = getSocket();
    if (!socket) return () => {};

    const notificationEvents = [
      SOCKET_EVENTS.NOTIFICATION_NEW,
      'notification:new',
      'notification:send',
      'notification:receive',
      'notification',
      'notify',
      'push_notification',
      'user:notification',
    ];

    notificationEvents.forEach((evt) => socket.on(evt, callback));

    return () => {
      notificationEvents.forEach((evt) => socket.off(evt, callback));
    };
  }, []);

  const onNewMessage = useCallback((callback) => {
    const socket = getSocket();
    if (!socket) return () => {};

    const messageEvents = [
      SOCKET_EVENTS.MESSAGE_RECEIVE,
      'message:receive',
      'message_receive',
      'receive_message',
      'receiveMessage',
      'new_message',
      'newMessage',
      'message',
      'chat_message',
    ];

    messageEvents.forEach((evt) => socket.on(evt, callback));

    return () => {
      messageEvents.forEach((evt) => socket.off(evt, callback));
    };
  }, []);

  const onMessageEdited = useCallback((callback) => {
    const socket = getSocket();
    if (!socket) return () => {};
    socket.on(SOCKET_EVENTS.MESSAGE_EDITED, callback);
    socket.on('message:edited', callback);
    socket.on('message_edited', callback);
    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_EDITED, callback);
      socket.off('message:edited', callback);
      socket.off('message_edited', callback);
    };
  }, []);

  const onMessageDeleted = useCallback((callback) => {
    const socket = getSocket();
    if (!socket) return () => {};
    socket.on(SOCKET_EVENTS.MESSAGE_DELETED, callback);
    socket.on('message:deleted', callback);
    socket.on('message_deleted', callback);
    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_DELETED, callback);
      socket.off('message:deleted', callback);
      socket.off('message_deleted', callback);
    };
  }, []);

  const onMessageReaction = useCallback((callback) => {
    const socket = getSocket();
    if (!socket) return () => {};
    const reactionEvents = [
      'message:react',
      'message:reaction',
      'message_reaction',
      'reaction:added',
      'reaction:new',
      'reaction:remove',
      'reaction:removed',
      'reaction',
      'message_reacted',
    ];
    reactionEvents.forEach((evt) => socket.on(evt, callback));
    return () => {
      reactionEvents.forEach((evt) => socket.off(evt, callback));
    };
  }, []);

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        onlineUserIds,
        typingUsers,
        incomingCall,
        notifications,
        sendNotificationViaSocket,
        sendMessageViaSocket,
        sendTyping,
        markAsReadViaSocket,
        deleteMessageViaSocket,
        editMessageViaSocket,
        reactToMessageViaSocket,
        dismissCall,
        onNotification,
        onNewMessage,
        onMessageEdited,
        onMessageDeleted,
        onMessageReaction,
      }}
    >
      {children}

      {/* Floating Socket Toast Notifications Overlay */}
      {notifications.length > 0 && (
        <div
          style={{
            position: 'fixed',
            top: '80px',
            right: '24px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxWidth: '360px',
            width: '100%',
            pointerEvents: 'none',
          }}
        >
          {notifications.map((n) => (
            <div
              key={n.id}
              className="animate-fade-in"
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '14px 16px',
                background: 'rgba(17, 27, 33, 0.94)',
                backdropFilter: 'blur(12px)',
                borderRadius: '12px',
                border: '1px solid rgba(0, 168, 132, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                color: '#e9edef',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(0, 168, 132, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                {n.type === 'SUCCESS' ? (
                  <CheckCircle size={18} color="#00a884" />
                ) : n.type === 'WARNING' ? (
                  <AlertTriangle size={18} color="#f59e0b" />
                ) : (
                  <Bell size={18} color="#00a884" />
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#e9edef', marginBottom: '2px' }}>
                  {n.title}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#8696a0', lineHeight: 1.4, wordBreak: 'break-word' }}>
                  {n.body || n.message}
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeNotification(n.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8696a0',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </SocketContext.Provider>
  );
};
