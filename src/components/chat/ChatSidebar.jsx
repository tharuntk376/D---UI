import React, { useState } from 'react';
import { Avatar } from '../common/Avatar';
import { Search, Plus, MessageSquare, Users, Circle } from 'lucide-react';

export const ChatSidebar = ({
  isMobile,
  conversations,
  contacts,
  currentUserId,
  activeConversationId,
  onSelectConversation,
  onStartNewChat,
  onlineUserIds,
  typingUsers,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState('chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  // Helper to extract the other participant
  const getRecipient = (conv) => {
    if (!conv || !Array.isArray(conv.participants)) return null;
    return (
      conv.participants.find((p) => {
        const pId = typeof p === 'object' ? p?._id : p;
        return pId && pId !== currentUserId;
      }) || (typeof conv.participants[0] === 'object' ? conv.participants[0] : null)
    );
  };

  const filteredConversations = (conversations || []).filter((conv) => {
    if (!conv) return false;
    const recipient = getRecipient(conv);
    const name = recipient?.displayName || recipient?.username || conv.name || '';
    return name.toLowerCase().includes((searchQuery || '').toLowerCase());
  });

  const filteredContacts = (contacts || []).filter((c) => {
    if (!c) return false;
    const name = c.displayName || c.username || '';
    return (
      c._id !== currentUserId &&
      name.toLowerCase().includes((searchQuery || '').toLowerCase())
    );
  });

  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <aside
      style={{
        width: isMobile ? '100%' : '360px',
        minWidth: isMobile ? '100%' : '300px',
        maxWidth: isMobile ? '100%' : '380px',
        height: '100%',
        background: 'var(--bg-card)',
        borderRight: isMobile ? 'none' : '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      {/* Top action header */}
      <div style={{ padding: '14px 14px 10px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '1.25rem' }}>Messages</h2>
          <button
            onClick={() => setShowNewChatModal(true)}
            className="btn btn-primary btn-icon"
            style={{ width: '34px', height: '34px' }}
            title="Start New Conversation"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            className="input-field"
            style={{
              paddingLeft: '38px',
              paddingTop: '8px',
              paddingBottom: '8px',
              fontSize: '0.88rem',
              borderRadius: 'var(--radius-full)',
            }}
            placeholder="Search conversations & contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            padding: '4px',
            marginTop: '12px',
          }}
        >
          <button
            onClick={() => setActiveTab('chats')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '6px 10px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: activeTab === 'chats' ? 'var(--bg-surface-elevated)' : 'transparent',
              color: activeTab === 'chats' ? '#fff' : 'var(--text-secondary)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <MessageSquare size={14} />
            <span>Chats ({conversations.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '6px 10px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: activeTab === 'contacts' ? 'var(--bg-surface-elevated)' : 'transparent',
              color: activeTab === 'contacts' ? '#fff' : 'var(--text-secondary)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <Users size={14} />
            <span>Contacts ({contacts.length})</span>
          </button>
        </div>
      </div>

      {/* Conversation or Contacts List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {isLoading ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div className="animate-spin" style={{ display: 'inline-block', marginBottom: '8px' }}>
              <Circle size={24} color="var(--primary)" />
            </div>
            <p style={{ fontSize: '0.85rem' }}>Loading conversations...</p>
          </div>
        ) : activeTab === 'chats' ? (
          filteredConversations.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <MessageSquare size={36} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                No conversations yet
              </p>
              <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                Select a contact or click + to start messaging!
              </p>
              <button
                onClick={() => setActiveTab('contacts')}
                className="btn btn-secondary"
                style={{ marginTop: '16px', fontSize: '0.8rem', padding: '6px 14px' }}
              >
                Browse Contacts
              </button>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const recipient = getRecipient(conv);
              const isSelected = conv._id === activeConversationId;
              const isOnline = recipient?._id
                ? (onlineUserIds?.has?.(recipient._id) || onlineUserIds?.has?.(String(recipient._id)) || !!recipient?.isOnline)
                : false;
              const isTyping = typingUsers[conv._id];
              const lastMsgText = typeof conv.lastMessage === 'object' && conv.lastMessage?.text
                ? conv.lastMessage.text
                : typeof conv.lastMessage === 'object' && conv.lastMessage?.type === 'IMAGE'
                ? '📷 Photo'
                : typeof conv.lastMessage === 'object' && conv.lastMessage?.type === 'VOICE_NOTE'
                ? '🎤 Voice message'
                : typeof conv.lastMessage === 'object' && conv.lastMessage?.type === 'FILE'
                ? '📎 File attachment'
                : 'No messages yet';

              const unreadCount = (conv.unreadCounts && currentUserId && conv.unreadCounts[currentUserId]) || 0;

              return (
                <div
                  key={conv._id}
                  onClick={() => onSelectConversation(conv)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                    border: isSelected ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid transparent',
                    marginBottom: '4px',
                    transition: 'all 0.15s',
                  }}
                  className={isSelected ? '' : 'card-hover'}
                >
                  <Avatar
                    name={recipient?.displayName || recipient?.username || 'User'}
                    avatarUrl={recipient?.avatar}
                    size={46}
                    isOnline={isOnline}
                    showStatus={true}
                  />

                  <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: '0.92rem',
                          color: isSelected ? '#fff' : 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {recipient?.displayName || recipient?.username || 'Chat'}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                        {formatTime(conv.updatedAt || conv.createdAt)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3px' }}>
                      <p
                        style={{
                          fontSize: '0.8rem',
                          color: isTyping ? 'var(--primary-light)' : 'var(--text-secondary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          margin: 0,
                          fontStyle: isTyping ? 'italic' : 'normal',
                        }}
                      >
                        {isTyping ? `${isTyping} is typing...` : lastMsgText}
                      </p>

                      {unreadCount > 0 && (
                        <span
                          style={{
                            background: 'var(--primary)',
                            color: '#fff',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: 'var(--radius-full)',
                            marginLeft: '6px',
                            flexShrink: 0,
                          }}
                        >
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )
        ) : (
          // Contacts Tab
          filteredContacts.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '0.88rem' }}>No contacts found</p>
            </div>
          ) : (
            filteredContacts.map((contact) => {
              const isOnline = contact?._id
                ? (onlineUserIds?.has?.(contact._id) || onlineUserIds?.has?.(String(contact._id)) || !!contact?.isOnline)
                : false;
              return (
                <div
                  key={contact._id}
                  onClick={() => onStartNewChat(contact)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    marginBottom: '4px',
                    transition: 'all 0.15s',
                  }}
                  className="card-hover"
                >
                  <Avatar
                    name={contact.displayName || contact.username}
                    avatarUrl={contact.avatar}
                    size={42}
                    isOnline={isOnline}
                    showStatus={true}
                  />

                  <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>
                        {contact.displayName || contact.username}
                      </span>
                      {contact.role === 'ADMIN' && (
                        <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
                          ADMIN
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      @{contact.username} • {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              );
            })
          )
        )}
      </div>

      {/* New Chat Picker Modal */}
      {showNewChatModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
          onClick={() => setShowNewChatModal(false)}
        >
          <div
            className="card animate-fade-in"
            style={{ width: '100%', maxWidth: '420px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.2rem' }}>Start New Chat</h3>
              <button
                className="btn btn-ghost"
                style={{ padding: '4px 8px' }}
                onClick={() => setShowNewChatModal(false)}
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Choose a contact from your directory to begin messaging.
            </p>

            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {contacts.filter((c) => c._id !== currentUserId).map((c) => (
                <div
                  key={c._id}
                  onClick={() => {
                    onStartNewChat(c);
                    setShowNewChatModal(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  className="card-hover"
                >
                  <Avatar
                    name={c.displayName || c.username}
                    avatarUrl={c.avatar}
                    size={38}
                    isOnline={c?._id ? (onlineUserIds?.has?.(c._id) || onlineUserIds?.has?.(String(c._id)) || !!c?.isOnline) : false}
                    showStatus={true}
                  />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{c.displayName || c.username}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>@{c.username}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
