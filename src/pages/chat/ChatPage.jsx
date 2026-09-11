import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../../components/common/Navbar';
import { ChatSidebar } from '../../components/chat/ChatSidebar';
import { ChatArea } from '../../components/chat/ChatArea';
import { CallModal } from '../../components/common/CallModal';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { chatService } from '../../services/chatService';
import { userService } from '../../services/userService';
import { getMediaUrl } from '../../services/api';

export const ChatPage = () => {
  const { user } = useAuth();
  const {
    onlineUserIds,
    typingUsers,
    sendMessageViaSocket,
    sendTyping,
    markAsReadViaSocket,
    deleteMessageViaSocket,
    editMessageViaSocket,
    reactToMessageViaSocket,
    onNewMessage,
    onMessageEdited,
    onMessageDeleted,
    onMessageReaction,
  } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch conversations and contacts on mount
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [convs, conts] = await Promise.all([
        chatService.getConversations().catch(() => []),
        userService.getContacts().catch(() => []),
      ]);
      const validConvs = Array.isArray(convs) ? convs : [];
      const validConts = Array.isArray(conts) ? conts : [];
      setConversations(validConvs);
      setContacts(validConts);

      if (validConvs.length > 0) {
        setActiveConversation((prev) => prev || validConvs[0]);
      } else if (validConts.length > 0) {
        // If no prior conversations, auto-select first available contact so the user is never stuck on an empty screen
        const firstContact = validConts.find((c) => c._id !== user?._id) || validConts[0];
        if (firstContact?._id) {
          try {
            const newConv = await chatService.startConversation(firstContact._id);
            if (newConv && newConv._id) {
              setConversations([newConv]);
              setActiveConversation(newConv);
            } else {
              throw new Error('Fallback to virtual conversation');
            }
          } catch {
            // Virtual conversation fallback
            const virtualConv = {
              _id: `temp-conv-${firstContact._id}`,
              isVirtual: true,
              participants: [
                firstContact,
                { _id: user?._id || 'self', username: user?.username || 'You', displayName: user?.displayName || 'You' },
              ],
              unreadCounts: {},
            };
            setActiveConversation(virtualConv);
          }
        }
      }
    } catch (err) {
      console.error('Error loading chat data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?._id, user?.username, user?.displayName]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConversation || !activeConversation._id || activeConversation._id.startsWith('temp-conv-')) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    const fetchMessages = async () => {
      try {
        const msgs = await chatService.getMessages(activeConversation._id);
        if (!isMounted) return;
        const normalized = (Array.isArray(msgs) ? msgs : []).map((m, i) => ({
          ...m,
          _id: String(m._id || m.id || m.messageId || `msg-${i}-${Date.now()}`),
          reactions: Array.isArray(m.reactions) ? m.reactions : [],
        }));
        setMessages(normalized);

        // Mark as read
        await chatService.markRead(activeConversation._id);
        markAsReadViaSocket(activeConversation._id);

        // Reset unread counts locally
        setConversations((prev) =>
          prev.map((c) =>
            c._id === activeConversation._id
              ? {
                  ...c,
                  unreadCounts: user?._id ? { ...c.unreadCounts, [user._id]: 0 } : c.unreadCounts,
                }
              : c
          )
        );
      } catch (err) {
        console.error('Failed to load messages for conversation:', err);
      }
    };

    fetchMessages();

    // Auto-sync polling every 2.5 seconds to guarantee real-time incoming messages without manual refresh
    const syncInterval = setInterval(async () => {
      if (!isMounted) return;
      try {
        const latestMsgs = await chatService.getMessages(activeConversation._id);
        if (!isMounted || !Array.isArray(latestMsgs)) return;

        setMessages((prev) => {
          let updated = [...prev];
          let changed = false;

          for (const rawLm of latestMsgs) {
            if (!rawLm) continue;
            const lmId = String(rawLm._id || rawLm.id || rawLm.messageId || '');
            if (!lmId) continue;
            const lm = { ...rawLm, _id: lmId };

            const existingIdx = updated.findIndex(
              (m) => String(m._id) === lmId || (m.tempId && String(m.tempId) === lmId)
            );

            if (existingIdx === -1) {
              const tempMatchIdx = updated.findIndex(
                (m) => m.tempId && m.text === lm.text && (m.type || 'TEXT') === (lm.type || 'TEXT')
              );
              if (tempMatchIdx !== -1) {
                updated[tempMatchIdx] = { ...updated[tempMatchIdx], ...lm, status: 'delivered' };
              } else {
                updated.push(lm);
              }
              changed = true;
            } else {
              const current = updated[existingIdx];
              const serverReactions = Array.isArray(lm.reactions) ? lm.reactions : [];
              const currentReactions = Array.isArray(current.reactions) ? current.reactions : [];
              if (
                serverReactions.length > currentReactions.length ||
                lm.text !== current.text ||
                lm.isEdited !== current.isEdited
              ) {
                updated[existingIdx] = {
                  ...current,
                  ...lm,
                  reactions: serverReactions.length > 0 ? serverReactions : currentReactions,
                };
                changed = true;
              }
            }
          }

          return changed ? updated : prev;
        });
      } catch {
        // Silent background fallback
      }
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(syncInterval);
    };
  }, [activeConversation?._id, markAsReadViaSocket, user?._id]);

  // Real-time socket message subscriptions
  useEffect(() => {
    const unsubNew = onNewMessage((newMsg) => {
      if (!newMsg) return;
      const targetConvId = newMsg.conversationId || newMsg.conversation;

      if (activeConversation && targetConvId === activeConversation._id) {
        setMessages((prev) => {
          const senderIdStr = typeof newMsg.senderId === 'object' ? newMsg.senderId?._id : newMsg.senderId;
          const isFromMe = senderIdStr === user?._id;

          // 1. If message already exists by real ID, update it
          const existsById = prev.some((m) => m._id === newMsg._id);
          if (existsById) {
            return prev.map((m) =>
              m._id === newMsg._id ? { ...m, ...newMsg, status: 'delivered' } : m
            );
          }

          // 2. If sent by current user, reconcile with optimistic temp message
          if (isFromMe) {
            const pendingIdx = prev.findIndex(
              (m) =>
                m.tempId &&
                (m.tempId === newMsg.tempId ||
                  (m.text === newMsg.text && (m.type || 'TEXT') === (newMsg.type || 'TEXT')))
            );
            if (pendingIdx !== -1) {
              return prev.map((m, idx) =>
                idx === pendingIdx ? { ...m, ...newMsg, status: 'delivered' } : m
              );
            }
          }

          // 3. Otherwise append as new received message
          return [...prev, { ...newMsg, status: 'delivered' }];
        });

        chatService.markRead(activeConversation._id);
        markAsReadViaSocket(activeConversation._id);
      }

      setConversations((prev) => {
        const targetId = newMsg.conversationId || newMsg.conversation;
        const exists = prev.some((c) => c._id === targetId);
        if (exists) {
          return prev.map((c) => {
            if (c._id === targetId) {
              const currentUnread = (c.unreadCounts && user?._id && c.unreadCounts[user._id]) || 0;
              const isCurrentActive = activeConversation?._id === c._id;
              return {
                ...c,
                lastMessage: newMsg,
                updatedAt: newMsg.createdAt || new Date().toISOString(),
                unreadCounts: user?._id
                  ? {
                      ...c.unreadCounts,
                      [user._id]: isCurrentActive ? 0 : currentUnread + 1,
                    }
                  : c.unreadCounts,
              };
            }
            return c;
          });
        } else {
          loadInitialData();
          return prev;
        }
      });
    });

    const unsubEdit = onMessageEdited((editedMsg) => {
      if (!editedMsg) return;
      setMessages((prev) =>
        prev.map((m) =>
          m._id === editedMsg._id || m.tempId === editedMsg._id
            ? { ...m, ...editedMsg, text: editedMsg.text || m.text, isEdited: true }
            : m
        )
      );
    });

    const unsubDelete = onMessageDeleted((payload) => {
      const deletedId = typeof payload === 'object' ? payload.messageId || payload._id : payload;
      if (!deletedId) return;
      setMessages((prev) => prev.filter((m) => m._id !== deletedId && m.tempId !== deletedId));
    });

    const unsubReaction = onMessageReaction((payload) => {
      if (!payload) return;
      const targetMsgId = payload.messageId || payload.msgId || payload._id;
      const reactionEmoji = payload.emoji || payload.reaction;
      const reactionUserId = payload.userId || payload.user?._id || payload.user?.id || payload.senderId;
      const reactionUsername = payload.username || payload.user?.username || payload.displayName || 'User';

      if (!targetMsgId || !reactionEmoji) return;

      setMessages((prev) =>
        prev.map((m) => {
          if (m._id !== targetMsgId && m.tempId !== targetMsgId) return m;
          const currentReactions = Array.isArray(m.reactions) ? m.reactions : [];
          const existingIdx = currentReactions.findIndex(
            (r) => (r.userId || r.user?._id || r.user) === reactionUserId
          );
          let updatedReactions;
          if (payload.action === 'remove' || (existingIdx >= 0 && currentReactions[existingIdx].emoji === reactionEmoji && payload.action !== 'add')) {
            updatedReactions = currentReactions.filter((_, idx) => idx !== existingIdx);
          } else if (existingIdx >= 0) {
            updatedReactions = currentReactions.map((r, idx) =>
              idx === existingIdx ? { ...r, emoji: reactionEmoji } : r
            );
          } else {
            updatedReactions = [
              ...currentReactions,
              { emoji: reactionEmoji, userId: reactionUserId, username: reactionUsername },
            ];
          }
          return { ...m, reactions: updatedReactions };
        })
      );
    });

    return () => {
      unsubNew();
      unsubEdit();
      unsubDelete();
      unsubReaction();
    };
  }, [
    activeConversation,
    loadInitialData,
    markAsReadViaSocket,
    onMessageDeleted,
    onMessageEdited,
    onMessageReaction,
    onNewMessage,
    user?._id,
  ]);

  const handleSelectConversation = (conversation) => {
    setActiveConversation(conversation);
  };

  const handleStartNewChat = async (recipient) => {
    try {
      const conv = await chatService.startConversation(recipient._id);
      setConversations((prev) => {
        if (!prev.some((c) => c._id === conv._id)) {
          return [conv, ...prev];
        }
        return prev;
      });
      setActiveConversation(conv);
    } catch (err) {
      alert('Could not start conversation: ' + (err.message || 'Unknown error'));
    }
  };

  // Instant Optimistic Message Sender
  const handleSendMessage = async (
    text,
    mediaId = null,
    type = 'TEXT',
    replyTo = null,
    mediaUrl = null,
    localPreviewUrl = null
  ) => {
    if (!activeConversation) return;

    let targetConv = activeConversation;

    // If active conversation is virtual/temporary, initialize it on the backend first
    if (activeConversation.isVirtual || activeConversation._id?.startsWith('temp-conv-')) {
      const recipient = activeConversation.participants?.find(
        (p) => (typeof p === 'object' ? p?._id : p) !== user?._id
      );
      if (recipient?._id) {
        try {
          const realConv = await chatService.startConversation(recipient._id);
          if (realConv && realConv._id) {
            targetConv = realConv;
            setActiveConversation(realConv);
            setConversations((prev) => [
              realConv,
              ...prev.filter((c) => c._id !== activeConversation._id && c._id !== realConv._id),
            ]);
          }
        } catch (err) {
          console.error('Failed to create real conversation on send:', err);
        }
      }
    }

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const displayMediaUrl = localPreviewUrl || mediaUrl;

    const optimisticMsg = {
      _id: tempId,
      tempId,
      conversationId: targetConv._id,
      senderId: {
        _id: user?._id || 'self',
        username: user?.username || 'You',
        displayName: user?.displayName || user?.username || 'You',
        avatar: user?.avatar,
      },
      text,
      type,
      mediaId,
      mediaUrl: displayMediaUrl,
      replyTo,
      status: 'sending', // 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
      createdAt: new Date().toISOString(),
      readBy: [{ userId: user?._id, readAt: new Date().toISOString() }],
    };

    // 1. INSTANTLY append to messages state (Zero lag)
    setMessages((prev) => [...prev, optimisticMsg]);

    // 2. INSTANTLY update sidebar conversation list and order to top
    setConversations((prev) => {
      const conv = prev.find((c) => c._id === targetConv._id) || targetConv;
      const updated = {
        ...conv,
        lastMessage: optimisticMsg,
        updatedAt: optimisticMsg.createdAt,
      };
      return [updated, ...prev.filter((c) => c._id !== targetConv._id)];
    });

    // 3. Send payload through HTTP API (HTTP broadcast triggers socket automatically)
    try {
      // Do NOT send transient local blob URLs across the wire
      const wireMediaUrl = mediaUrl && !mediaUrl.startsWith('blob:') ? mediaUrl : null;

      const payload = {
        conversationId: targetConv._id,
        text,
        type,
        mediaId: mediaId || null,
        mediaUrl: wireMediaUrl,
        fileUrl: wireMediaUrl,
        replyTo: replyTo?._id || null,
      };

      const serverMsg = await chatService.sendMessage(payload);

      // 4. Reconcile temporary message with server confirmed message
      if (serverMsg && (serverMsg._id || serverMsg.id)) {
        const sId = String(serverMsg._id || serverMsg.id);
        setMessages((prev) => {
          const alreadyHasServerId = prev.some((m) => String(m._id) === sId);
          if (alreadyHasServerId) {
            return prev.filter((m) => m._id !== tempId && m.tempId !== tempId);
          }
          return prev.map((m) =>
            m._id === tempId || m.tempId === tempId
              ? {
                  ...m,
                  ...serverMsg,
                  _id: sId,
                  status: 'sent',
                  mediaUrl:
                    displayMediaUrl ||
                    serverMsg.mediaUrl ||
                    serverMsg.fileUrl ||
                    (serverMsg.mediaId ? getMediaUrl(serverMsg.mediaId) : null),
                }
              : m
          );
        });
      } else {
        // Fallback: mark as sent
        setMessages((prev) =>
          prev.map((m) => (m._id === tempId ? { ...m, status: 'sent' } : m))
        );
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      // Mark optimistic message as failed so user can retry
      setMessages((prev) =>
        prev.map((m) => (m._id === tempId ? { ...m, status: 'failed' } : m))
      );
    }
  };

  const handleRetryMessage = async (failedMsg) => {
    // Remove failed message and resend
    setMessages((prev) => prev.filter((m) => m._id !== failedMsg._id));
    handleSendMessage(
      failedMsg.text,
      failedMsg.mediaId,
      failedMsg.type,
      failedMsg.replyTo,
      failedMsg.mediaUrl
    );
  };

  const handleAddReaction = async (messageId, emoji) => {
    if (!messageId || !emoji) return;
    const targetIdStr = String(messageId);

    // 1. Optimistic local state update (Zero-delay UI feedback)
    setMessages((prev) =>
      prev.map((m) => {
        const mId = String(m._id || m.id || m.messageId || m.tempId || '');
        if (mId !== targetIdStr) return m;

        const currentReactions = Array.isArray(m.reactions) ? m.reactions : [];
        const existingIdx = currentReactions.findIndex(
          (r) => String(r.userId || r.user?._id || r.user || '') === String(user?._id || '')
        );

        let updatedReactions;
        if (existingIdx >= 0) {
          const currentEmoji = currentReactions[existingIdx].emoji || currentReactions[existingIdx].reaction;
          if (currentEmoji === emoji) {
            // Remove reaction if clicked same emoji again
            updatedReactions = currentReactions.filter((_, idx) => idx !== existingIdx);
          } else {
            // Switch reaction to new emoji
            updatedReactions = currentReactions.map((r, idx) =>
              idx === existingIdx ? { ...r, emoji, reaction: emoji } : r
            );
          }
        } else {
          // Add new reaction
          updatedReactions = [
            ...currentReactions,
            { emoji, reaction: emoji, userId: user?._id, username: user?.displayName || user?.username || 'You' },
          ];
        }
        return { ...m, reactions: updatedReactions };
      })
    );

    // 2. Real-time broadcast via WebSocket
    if (reactToMessageViaSocket) {
      reactToMessageViaSocket(messageId, emoji, activeConversation?._id);
    }

    // 3. Persist via REST API
    try {
      await chatService.reactToMessage(messageId, emoji, activeConversation?._id);
    } catch (err) {
      console.warn('Reaction persistence note:', err);
    }
  };

  const handleEditMessage = async (messageId, newText) => {
    if (!messageId || !newText?.trim()) return;
    const trimmed = newText.trim();

    // 1. Optimistic local update
    setMessages((prev) =>
      prev.map((m) =>
        m._id === messageId || m.tempId === messageId
          ? { ...m, text: trimmed, isEdited: true }
          : m
      )
    );

    // 2. Real-time socket broadcast
    if (editMessageViaSocket) {
      editMessageViaSocket(messageId, trimmed);
    }

    // 3. Persist via API
    try {
      const updated = await chatService.editMessage(messageId, { text: trimmed });
      if (updated && updated._id) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === messageId ? { ...m, ...updated, text: trimmed, isEdited: true } : m
          )
        );
      }
    } catch (err) {
      console.warn('Edit message fallback applied:', err);
    }
  };

  const handleDeleteMessage = async (messageId, deleteForAll = true) => {
    if (!messageId) return;

    // 1. Optimistic local update
    setMessages((prev) => prev.filter((m) => m._id !== messageId && m.tempId !== messageId));

    // 2. Real-time socket broadcast
    if (deleteMessageViaSocket) {
      deleteMessageViaSocket(messageId, deleteForAll);
    }

    // 3. Persist via API
    try {
      await chatService.deleteMessage(messageId, deleteForAll);
    } catch (err) {
      console.warn('Delete message fallback applied:', err);
    }
  };

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTyping = (isTyping) => {
    if (activeConversation) {
      sendTyping(activeConversation._id, isTyping);
    }
  };

  const showSidebar = !isMobile || !activeConversation;
  const showChatArea = !isMobile || !!activeConversation;

  return (
    <div style={{ height: '100dvh', maxHeight: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Navbar />
      <CallModal />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {showSidebar && (
          <ChatSidebar
            isMobile={isMobile}
            conversations={conversations}
            contacts={contacts}
            currentUserId={user?._id}
            activeConversationId={activeConversation?._id}
            onSelectConversation={handleSelectConversation}
            onStartNewChat={handleStartNewChat}
            onlineUserIds={onlineUserIds}
            typingUsers={typingUsers}
            isLoading={isLoading}
          />
        )}
        {showChatArea && (
          <ChatArea
            isMobile={isMobile}
            conversation={activeConversation}
            messages={messages}
            contacts={contacts}
            onBack={() => setActiveConversation(null)}
            onStartNewChat={handleStartNewChat}
            isLoading={isLoading}
            currentUserId={user?._id}
            onSendMessage={handleSendMessage}
            onRetryMessage={handleRetryMessage}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
            onAddReaction={handleAddReaction}
            onTyping={handleTyping}
            onlineUserIds={onlineUserIds}
            typingUser={activeConversation ? typingUsers[activeConversation._id] : undefined}
          />
        )}
      </div>
    </div>
  );
};

export default ChatPage;

