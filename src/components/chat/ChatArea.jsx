import React, { useState, useRef, useEffect } from 'react';
import { Avatar } from '../common/Avatar';
import { AuthenticatedImage } from '../common/AuthenticatedImage';
import { getMediaUrl } from '../../services/api';
import { fileService } from '../../services/fileService';
import {
  Send,
  Paperclip,
  Phone,
  Video,
  MoreVertical,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  Edit2,
  Trash2,
  FileText,
  Smile,
  Mic,
  Reply,
  Copy,
  Download,
  X,
  Search,
  ChevronDown,
  Play,
  Pause,
  Image as ImageIcon,
  Headphones,
} from 'lucide-react';

// Popular WhatsApp Emojis
const EMOJI_LIST = [
  '😀', '😂', '🤣', '😍', '🥰', '😘', '😎', '🥳', '🤔', '🙄',
  '😭', '😱', '🔥', '✨', '🎉', '💯', '❤️', '🧡', '💛', '💚',
  '💙', '💜', '🖤', '🤍', '👍', '👎', '👏', '🙌', '🙏', '💪',
  '🤝', '✌️', '🚀', '⭐', '☕', '🍕', '💡', '📌', '✅'
];

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

// Format day header
const formatDayHeader = (dateStr) => {
  if (!dateStr) return 'TODAY';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'TODAY';
    const now = new Date();
    const d1 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const d2 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'TODAY';
    if (diffDays === 1) return 'YESTERDAY';
    return date
      .toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
      .toUpperCase();
  } catch {
    return 'TODAY';
  }
};

// Custom Voice Note Player Component
const VoiceNotePlayer = ({ audioUrl, duration }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
        setTotalDuration(audio.duration);
      }
    };
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const toggleSpeed = () => {
    if (!audioRef.current) return;
    const speeds = [1, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const newSpeed = speeds[nextIdx];
    audioRef.current.playbackRate = newSpeed;
    setPlaybackSpeed(newSpeed);
  };

  const formatSecs = (sec) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '220px', padding: '4px 0' }}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      <button
        type="button"
        onClick={togglePlay}
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)',
          border: 'none',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'all 0.15s',
        }}
      >
        {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: '2px' }} />}
      </button>

      {/* Waveform Representation */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '22px' }}>
          {[14, 20, 10, 18, 22, 12, 16, 20, 14, 10, 18, 22, 15, 12, 18, 22, 16, 12, 18, 14, 10, 16, 20, 12].map(
            (height, idx) => {
              const barPercent = (idx / 24) * 100;
              const isActive = barPercent <= progressPercent;
              return (
                <div
                  key={idx}
                  className={`wa-wave-bar ${isActive ? 'active' : ''}`}
                  style={{ height: `${height}px`, flex: 1 }}
                />
              );
            }
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', opacity: 0.8 }}>
          <span>{formatSecs(currentTime)}</span>
          <span>{formatSecs(totalDuration || 0)}</span>
        </div>
      </div>

      {/* Speed Selector */}
      <button
        type="button"
        onClick={toggleSpeed}
        style={{
          background: 'rgba(255,255,255,0.12)',
          border: 'none',
          color: '#fff',
          borderRadius: '12px',
          padding: '2px 7px',
          fontSize: '0.7rem',
          fontWeight: 700,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        {playbackSpeed}x
      </button>
    </div>
  );
};

export const ChatArea = ({
  conversation,
  messages,
  contacts = [],
  onStartNewChat,
  isLoading,
  currentUserId,
  onSendMessage,
  onRetryMessage,
  onEditMessage,
  onDeleteMessage,
  onAddReaction,
  onTyping,
  onlineUserIds = new Set(),
  typingUser,
}) => {
  const [inputText, setInputText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [activeMenuMessageId, setActiveMenuMessageId] = useState(null);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);

  // WhatsApp Features State
  const [replyingTo, setReplyingTo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Voice Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Popup Refs for click-outside detection
  const emojiPickerRef = useRef(null);
  const attachMenuRef = useRef(null);
  const emojiBtnRef = useRef(null);
  const attachBtnRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        showEmojiPicker &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target) &&
        emojiBtnRef.current &&
        !emojiBtnRef.current.contains(e.target)
      ) {
        setShowEmojiPicker(false);
      }

      if (
        showAttachMenu &&
        attachMenuRef.current &&
        !attachMenuRef.current.contains(e.target) &&
        attachBtnRef.current &&
        !attachBtnRef.current.contains(e.target)
      ) {
        setShowAttachMenu(false);
      }

      if (activeMenuMessageId) {
        setActiveMenuMessageId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker, showAttachMenu, activeMenuMessageId]);

  const toggleEmojiPicker = () => {
    setShowEmojiPicker((prev) => !prev);
    setShowAttachMenu(false);
  };

  const toggleAttachMenu = () => {
    setShowAttachMenu((prev) => !prev);
    setShowEmojiPicker(false);
  };

  // Recipient info
  const recipient = conversation?.participants?.find(
    (p) => {
      const pId = typeof p === 'object' ? p?._id : p;
      return pId && pId !== currentUserId;
    }
  ) || (typeof conversation?.participants?.[0] === 'object' ? conversation?.participants?.[0] : null);
  const isRecipientOnline = recipient?._id
    ? (onlineUserIds?.has?.(recipient._id) || onlineUserIds?.has?.(String(recipient._id)) || !!recipient?.isOnline)
    : false;

  // Auto scroll to bottom
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (!showScrollBottom) {
      scrollToBottom('smooth');
    }
  }, [messages?.length, typingUser]);

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 150;
    setShowScrollBottom(isScrolledUp);
  };

  // Live Typing notification handler
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (showEmojiPicker) setShowEmojiPicker(false);
    if (showAttachMenu) setShowAttachMenu(false);
    onTyping(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 2000);
  };

  // Instant message submission
  const handleSend = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isUploading) return;

    const currentReply = replyingTo;
    setInputText('');
    setReplyingTo(null);
    setShowEmojiPicker(false);
    onTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    await onSendMessage(trimmed, null, 'TEXT', currentReply);
    scrollToBottom('smooth');
  };

  // Voice Recorder Handlers
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Microphone access is required for voice notes: ' + err.message);
    }
  };

  const cancelVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setRecordingSeconds(0);
    audioChunksRef.current = [];
  };

  const sendVoiceRecording = async () => {
    if (!mediaRecorderRef.current || !isRecording) return;
    const currentReply = replyingTo;
    setReplyingTo(null);

    clearInterval(recordingTimerRef.current);
    setIsRecording(false);

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const audioFile = new File([audioBlob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });
      const blobUrl = URL.createObjectURL(audioBlob);

      try {
        let uploaded = null;
        try {
          uploaded = await fileService.uploadFile(audioFile, 'VOICE_NOTE', conversation._id, recordingSeconds);
        } catch {
          // Fallback if upload offline
        }

        const uploadedMediaId =
          uploaded?._id ||
          uploaded?.id ||
          uploaded?.fileId ||
          uploaded?.mediaId ||
          uploaded?.file?._id ||
          uploaded?.media?._id ||
          null;

        const serverUrl =
          uploaded?.url ||
          uploaded?.fileUrl ||
          uploaded?.mediaUrl ||
          uploaded?.path ||
          uploaded?.secure_url ||
          uploaded?.file?.url ||
          uploaded?.file?.path ||
          (uploadedMediaId ? getMediaUrl(uploadedMediaId) : null);

        await onSendMessage(
          '🎤 Voice message',
          uploadedMediaId,
          'VOICE_NOTE',
          currentReply,
          serverUrl,
          blobUrl
        );
      } catch (err) {
        alert('Failed to send voice note: ' + err.message);
      } finally {
        audioChunksRef.current = [];
      }
    };

    mediaRecorderRef.current.stop();
  };

  // File / Image Attachment Upload
  const handleFileUpload = async (e, typeOverride = null) => {
    const file = e.target.files?.[0];
    if (!file || !conversation) return;

    setShowAttachMenu(false);
    setIsUploading(true);
    const currentReply = replyingTo;
    setReplyingTo(null);

    try {
      let mediaType = typeOverride || 'FILE';
      if (!typeOverride) {
        if (file.type.startsWith('image/')) mediaType = 'IMAGE';
        else if (file.type.startsWith('video/')) mediaType = 'VIDEO';
        else if (file.type.startsWith('audio/')) mediaType = 'VOICE_NOTE';
      }

      const localBlobUrl = URL.createObjectURL(file);
      let uploaded = null;
      try {
        uploaded = await fileService.uploadFile(file, mediaType, conversation._id);
      } catch (err) {
        console.warn('Backend file upload fallback to local URL:', err);
      }

      const uploadedMediaId =
        uploaded?._id ||
        uploaded?.id ||
        uploaded?.fileId ||
        uploaded?.mediaId ||
        uploaded?.file?._id ||
        uploaded?.media?._id ||
        null;

      const serverUrl =
        uploaded?.url ||
        uploaded?.fileUrl ||
        uploaded?.mediaUrl ||
        uploaded?.path ||
        uploaded?.secure_url ||
        uploaded?.file?.url ||
        uploaded?.file?.path ||
        (uploadedMediaId ? getMediaUrl(uploadedMediaId) : null);

      await onSendMessage(
        file.name,
        uploadedMediaId,
        mediaType,
        currentReply,
        serverUrl,
        localBlobUrl
      );
    } catch (err) {
      alert('Upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSaveEdit = async (messageId) => {
    if (!editText.trim()) return;
    await onEditMessage(messageId, editText.trim());
    setEditingMessageId(null);
    setEditText('');
  };

  const copyMessage = (text) => {
    if (text) navigator.clipboard.writeText(text);
    setActiveMenuMessageId(null);
  };

  // Filter & deduplicate messages (Safe against undefined properties and duplicate server events)
  const uniqueMessages = [];
  const seenKeys = new Set();
  for (const m of messages || []) {
    if (!m) continue;
    const key = m._id || m.tempId;
    if (key && seenKeys.has(key)) continue;
    if (key) seenKeys.add(key);
    uniqueMessages.push(m);
  }

  const displayedMessages = uniqueMessages.filter((m) => {
    if (!searchQuery.trim()) return true;
    return (m.text || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Loading state
  if (isLoading && !conversation) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#111b21',
          color: '#8696a0',
          padding: '24px',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(0, 168, 132, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}
        >
          <Send size={28} color="#00a884" style={{ opacity: 0.9 }} />
        </div>
        <h4 style={{ color: '#e9edef', margin: '0 0 8px 0', fontSize: '1.1rem' }}>Connecting to WhatsApp...</h4>
        <p style={{ fontSize: '0.85rem', color: '#8696a0' }}>Loading conversations and contacts</p>
      </div>
    );
  }

  // Active Welcome Dashboard when no conversation is opened
  if (!conversation) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#111b21',
          color: '#8696a0',
          padding: '32px',
          textAlign: 'center',
          position: 'relative',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            background: 'rgba(0, 168, 132, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            border: '1px solid rgba(0, 168, 132, 0.3)',
          }}
        >
          <Send size={38} color="#00a884" />
        </div>

        <h2 style={{ fontSize: '1.6rem', color: '#e9edef', marginBottom: '8px', fontWeight: 600 }}>
          WhatsApp Web
        </h2>
        <p style={{ maxWidth: '420px', fontSize: '0.92rem', color: '#8696a0', lineHeight: 1.5, marginBottom: '24px' }}>
          Send and receive real-time messages, voice notes, photos, and files with end-to-end security.
        </p>

        {/* Available Contacts Quick-Start List */}
        {contacts && contacts.length > 0 && (
          <div style={{ maxWidth: '480px', width: '100%', marginBottom: '28px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#aebac1', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '12px' }}>
              Select a Contact to Message
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              {contacts.slice(0, 6).map((c) => (
                <div
                  key={c._id}
                  onClick={() => onStartNewChat && onStartNewChat(c)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    background: '#1f2c34',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    border: '1px solid rgba(255,255,255,0.06)',
                    transition: 'all 0.15s',
                  }}
                  className="card-hover"
                >
                  <Avatar name={c.displayName || c.username} avatarUrl={c.avatar} size={36} />
                  <div style={{ textAlign: 'left', minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#e9edef', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.displayName || c.username}
                    </span>
                    <span style={{ fontSize: '0.74rem', color: '#00a884' }}>Click to chat</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#8696a0' }}>
          <span>🔒 End-to-end encrypted</span>
        </div>
      </div>
    );
  }

  return (
    <main
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 68px)',
        background: 'var(--bg-main)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* WhatsApp Header */}
      <header
        style={{
          height: '68px',
          padding: '0 20px',
          background: '#1f2c34',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar
            name={recipient?.displayName || recipient?.username || 'User'}
            avatarUrl={recipient?.avatar}
            size={42}
            isOnline={isRecipientOnline}
            showStatus={true}
          />
          <div style={{ textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.05rem', margin: 0, color: '#e9edef' }}>
              {recipient?.displayName || recipient?.username}
            </h3>
            <span
              style={{
                fontSize: '0.76rem',
                color: typingUser ? '#25d366' : isRecipientOnline ? '#25d366' : '#8696a0',
                fontWeight: 500,
              }}
            >
              {typingUser ? `${typingUser} is typing...` : isRecipientOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {/* In-Chat Search & Call Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setShowSearch((prev) => !prev)}
            className="btn btn-ghost btn-icon"
            style={{ color: '#aebac1' }}
            title="Search in conversation"
          >
            <Search size={18} />
          </button>
          <button
            onClick={() => alert(`Starting voice call with ${recipient?.displayName || recipient?.username}...`)}
            className="btn btn-ghost btn-icon"
            style={{ color: '#aebac1' }}
            title="Voice Call"
          >
            <Phone size={18} />
          </button>
          <button
            onClick={() => alert(`Starting video call with ${recipient?.displayName || recipient?.username}...`)}
            className="btn btn-ghost btn-icon"
            style={{ color: '#aebac1' }}
            title="Video Call"
          >
            <Video size={18} />
          </button>
        </div>
      </header>

      {/* Search Bar Overlay */}
      {showSearch && (
        <div
          className="animate-fade-in"
          style={{
            padding: '10px 16px',
            background: '#111b21',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 15,
          }}
        >
          <Search size={16} color="#8696a0" />
          <input
            type="text"
            className="input-field"
            style={{ padding: '6px 12px', fontSize: '0.85rem' }}
            placeholder="Search messages in this chat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          {searchQuery && (
            <span style={{ fontSize: '0.78rem', color: '#8696a0', whiteSpace: 'nowrap' }}>
              {displayedMessages.length} results
            </span>
          )}
          <button
            className="btn btn-ghost btn-icon"
            style={{ width: '32px', height: '32px' }}
            onClick={() => {
              setShowSearch(false);
              setSearchQuery('');
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* WhatsApp Chat Area / Wallpaper */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        onClick={() => {
          if (showEmojiPicker) setShowEmojiPicker(false);
          if (showAttachMenu) setShowAttachMenu(false);
          if (activeMenuMessageId) setActiveMenuMessageId(null);
        }}
        className="wa-chat-bg"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {displayedMessages.length === 0 ? (
          <div style={{ margin: 'auto', textAlign: 'center', color: '#8696a0' }}>
            <div className="wa-date-pill" style={{ display: 'inline-block', marginBottom: '12px' }}>
              {searchQuery ? 'NO MATCHING MESSAGES' : 'START OF CONVERSATION'}
            </div>
            <p style={{ fontSize: '0.88rem' }}>
              {searchQuery ? 'Try searching with a different term' : 'Messages are end-to-end synchronized.'}
            </p>
          </div>
        ) : (
          displayedMessages.map((msg, idx) => {
            const senderObj = typeof msg.senderId === 'object' ? msg.senderId : (typeof msg.sender === 'object' ? msg.sender : null);
            const senderIdStr = senderObj ? (senderObj._id || senderObj.id || senderObj.userId) : (msg.senderId || msg.sender || msg.userId);
            const myIdStr = currentUserId ? String(currentUserId) : '';
            const isMe =
              (senderIdStr && String(senderIdStr) === myIdStr) ||
              senderIdStr === 'self' ||
              msg.status === 'sending';
            const msgId = String(msg._id || msg.id || msg.messageId || msg.tempId || `msg-${idx}`);
            const isMenuOpen = activeMenuMessageId === msgId;
            const isEditing = editingMessageId === msgId;
            const isHovered = hoveredMessageId === msgId;

            // Day separator check
            const prevMsg = displayedMessages[idx - 1];
            const prevDate = prevMsg ? new Date(prevMsg.createdAt).toDateString() : null;
            const currDate = new Date(msg.createdAt || Date.now()).toDateString();
            const showDayHeader = prevDate !== currDate;

            // Resolve media URL with all fallbacks
            let mediaUrl = msg.mediaUrl || msg.fileUrl || msg.url || msg.path;
            if (!mediaUrl && msg.mediaId) {
              if (typeof msg.mediaId === 'object') {
                mediaUrl = msg.mediaId.url || msg.mediaId.path || msg.mediaId.fileUrl || msg.mediaId.secure_url || getMediaUrl(msg.mediaId._id || msg.mediaId.id);
              } else {
                mediaUrl = getMediaUrl(msg.mediaId);
              }
            } else if (mediaUrl) {
              mediaUrl = getMediaUrl(mediaUrl);
            }

            // Determine if message is an image, voice note, or file
            const typeUpper = String(msg.type || msg.mediaType || '').toUpperCase();
            const textStr = String(msg.text || '');
            const isImage =
              typeUpper === 'IMAGE' ||
              typeUpper === 'PHOTO' ||
              typeUpper === 'PICTURE' ||
              /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(textStr) ||
              /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(String(mediaUrl || ''));

            const isVoiceNote =
              typeUpper === 'VOICE_NOTE' ||
              /\.(webm|mp3|wav|ogg|m4a|aac)$/i.test(textStr) ||
              /\.(webm|mp3|wav|ogg|m4a|aac)$/i.test(String(mediaUrl || ''));

            const isFile =
              !isImage &&
              !isVoiceNote &&
              (typeUpper === 'FILE' || Boolean(msg.mediaId || (mediaUrl && !isImage && !isVoiceNote)));

            // If text is purely the attachment's filename (e.g. "Screenshot 2026-09-10.png"), hide the redundant text subtitle
            const isTextOnlyFilename = isImage && /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(textStr);

            // Group reactions by emoji
            const reactionMap = {};
            if (Array.isArray(msg.reactions)) {
              msg.reactions.forEach((r) => {
                const emoji = typeof r === 'string' ? r : (r?.emoji || r?.reaction);
                if (!emoji) return;
                const rUserId = typeof r === 'object' ? (r.userId || r.user?._id || r.user) : null;
                const isMyReaction = rUserId && String(rUserId) === myIdStr;
                if (!reactionMap[emoji]) {
                  reactionMap[emoji] = { emoji, count: 0, hasMyReaction: false };
                }
                reactionMap[emoji].count += (r?.count || 1);
                if (isMyReaction) reactionMap[emoji].hasMyReaction = true;
              });
            }
            const reactionGroups = Object.values(reactionMap);

            return (
              <React.Fragment key={msgId || idx}>
                {/* Day Header Divider */}
                {showDayHeader && (
                  <div style={{ display: 'flex', justifyContent: 'center', margin: '14px 0 8px 0' }}>
                    <span className="wa-date-pill">{formatDayHeader(msg.createdAt)}</span>
                  </div>
                )}

                {/* Message Bubble Row */}
                <div
                  onMouseEnter={() => setHoveredMessageId(msgId)}
                  onMouseLeave={() => setHoveredMessageId((prev) => (prev === msgId ? null : prev))}
                  style={{
                    display: 'flex',
                    justifyContent: isMe ? 'flex-end' : 'flex-start',
                    position: 'relative',
                    margin: '3px 0',
                  }}
                >

                  {/* Bubble Container */}
                  <div
                    className={isMe ? 'wa-bubble-sent' : 'wa-bubble-received'}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setActiveMenuMessageId(msgId);
                    }}
                    style={{
                      maxWidth: '72%',
                      minWidth: '130px',
                      padding: '8px 12px 6px 12px',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      opacity: msg.status === 'sending' ? 0.85 : 1,
                    }}
                  >
                    {/* Hover Dropdown Chevron Button */}
                    {!isEditing && (
                      <button
                        type="button"
                        className="wa-msg-dropdown-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuMessageId(isMenuOpen ? null : msgId);
                        }}
                        title="Message menu"
                      >
                        <ChevronDown size={14} />
                      </button>
                    )}

                    {/* Quoted Message Preview (if reply) */}
                    {msg.replyTo && (
                      <div className="wa-quote-box">
                        <span style={{ fontWeight: 700, color: '#25d366', fontSize: '0.75rem', display: 'block' }}>
                          {typeof msg.replyTo === 'object' && msg.replyTo.senderId?.displayName
                            ? msg.replyTo.senderId.displayName
                            : 'Replied Message'}
                        </span>
                        <span
                          style={{
                            color: '#d1d7db',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: 'block',
                          }}
                        >
                          {typeof msg.replyTo === 'object' ? msg.replyTo.text : msg.replyTo}
                        </span>
                      </div>
                    )}

                    {/* Inline Message Edit */}
                    {isEditing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '240px', padding: '4px 0' }}>
                        <textarea
                          className="input-field"
                          style={{
                            padding: '8px 12px',
                            fontSize: '0.88rem',
                            resize: 'vertical',
                            minHeight: '48px',
                            borderRadius: '8px',
                            background: 'rgba(0,0,0,0.25)',
                            border: '1px solid #00a884',
                            color: '#e9edef',
                          }}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSaveEdit(msgId);
                            } else if (e.key === 'Escape') {
                              setEditingMessageId(null);
                            }
                          }}
                          autoFocus
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.72rem', color: '#8696a0', marginRight: 'auto' }}>
                            Enter to save • Esc to cancel
                          </span>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                            onClick={() => setEditingMessageId(null)}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ padding: '4px 12px', fontSize: '0.78rem', fontWeight: 600 }}
                            onClick={() => handleSaveEdit(msgId)}
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Voice Note Player */}
                        {isVoiceNote && (
                          <VoiceNotePlayer audioUrl={mediaUrl || (msg.mediaId ? getMediaUrl(msg.mediaId) : '')} duration={msg.duration || 10} />
                        )}

                        {/* Image Display with Lightbox Trigger */}
                        {isImage && (
                          <AuthenticatedImage
                            src={mediaUrl}
                            mediaId={msg.mediaId || msg.fileId || msg.media || msg.file}
                            filename={msg.text}
                            alt={msg.text || 'Chat image'}
                            style={{
                              marginBottom: '6px',
                              maxWidth: '380px',
                            }}
                            onClick={(loadedSrc) => {
                              const activeSrc =
                                loadedSrc ||
                                mediaUrl ||
                                (msg.mediaId ? getMediaUrl(msg.mediaId) : `/uploads/${msg.text}`);
                              setLightboxImage(activeSrc);
                            }}
                          />
                        )}

                        {/* File / Document Attachment */}
                        {isFile && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '8px 12px',
                              background: 'rgba(0,0,0,0.22)',
                              borderRadius: '6px',
                              marginBottom: '4px',
                            }}
                          >
                            <FileText size={22} color="#25d366" />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <span
                                style={{
                                  fontSize: '0.86rem',
                                  fontWeight: 600,
                                  display: 'block',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {msg.text || 'Document'}
                              </span>
                              {msg.size && <span style={{ fontSize: '0.7rem', color: '#8696a0' }}>{msg.size}</span>}
                            </div>
                            {(mediaUrl || msg.mediaId) && (
                              <a
                                href={mediaUrl || getMediaUrl(msg.mediaId)}
                                download
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: '#8696a0', display: 'flex', alignItems: 'center' }}
                              >
                                <Download size={16} />
                              </a>
                            )}
                          </div>
                        )}

                        {/* Text Message Content (Only show if not just the image file name) */}
                        {!isVoiceNote && msg.text && !isTextOnlyFilename && (
                          <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: '1.42', wordBreak: 'break-word', paddingRight: isMe ? '18px' : '0' }}>
                            {msg.text}
                          </p>
                        )}

                        {/* Footer: Timestamp & WhatsApp Status Checkmarks */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: '4px',
                            marginTop: '3px',
                            fontSize: '0.68rem',
                            color: '#8696a0',
                            float: 'right',
                          }}
                        >
                          {msg.isEdited && <span style={{ fontStyle: 'italic', marginRight: '2px' }}>edited</span>}
                          <span>
                            {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>

                          {/* WhatsApp Delivery / Read Ticks */}
                          {isMe && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '2px' }}>
                              {msg.status === 'failed' ? (
                                <button
                                  type="button"
                                  onClick={() => onRetryMessage(msg)}
                                  title="Failed to send. Click to retry."
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#ef4444',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                  }}
                                >
                                  <AlertCircle size={13} />
                                </button>
                              ) : msg.status === 'sending' ? (
                                <Clock size={12} color="#8696a0" />
                              ) : msg.readBy && msg.readBy.length > 1 ? (
                                <CheckCheck size={15} color="#53bdeb" title="Read" />
                              ) : msg.status === 'delivered' ? (
                                <CheckCheck size={15} color="#8696a0" title="Delivered" />
                              ) : (
                                <Check size={14} color="#8696a0" title="Sent" />
                              )}
                            </span>
                          )}
                        </div>
                      </>
                    )}

                    {/* Reactions Display */}
                    {reactionGroups.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                        {reactionGroups.map((rGroup, rIdx) => (
                          <span
                            key={rIdx}
                            className={`wa-reaction-badge ${rGroup.hasMyReaction ? 'active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddReaction(msgId, rGroup.emoji);
                            }}
                            title={rGroup.hasMyReaction ? `You reacted with ${rGroup.emoji} (click to remove)` : `Reacted with ${rGroup.emoji}`}
                          >
                            <span>{rGroup.emoji}</span>
                            {rGroup.count > 1 && (
                              <span style={{ fontSize: '0.7rem', fontWeight: 600, opacity: 0.9 }}>
                                {rGroup.count}
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Message Context Action Dropdown */}
                    {isMenuOpen && (
                      <div
                        className="wa-msg-menu"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Quick Reaction Row inside menu */}
                        <div style={{ display: 'flex', gap: '4px', padding: '4px 6px 8px 6px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '4px' }}>
                          {REACTION_EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              className="wa-reaction-btn"
                              style={{ fontSize: '1.1rem' }}
                              onClick={() => {
                                onAddReaction(msgId, emoji);
                                setActiveMenuMessageId(null);
                              }}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>

                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ width: '100%', justifyContent: 'flex-start', padding: '6px 10px', fontSize: '0.82rem', gap: '8px' }}
                          onClick={() => {
                            setReplyingTo(msg);
                            setActiveMenuMessageId(null);
                          }}
                        >
                          <Reply size={14} />
                          Reply
                        </button>
                        {msg.text && (
                          <button
                            type="button"
                            className="btn btn-ghost"
                            style={{ width: '100%', justifyContent: 'flex-start', padding: '6px 10px', fontSize: '0.82rem', gap: '8px' }}
                            onClick={() => copyMessage(msg.text)}
                          >
                            <Copy size={14} />
                            Copy Text
                          </button>
                        )}
                        {isMe && msg.type !== 'VOICE_NOTE' && msg.text && (
                          <button
                            type="button"
                            className="btn btn-ghost"
                            style={{ width: '100%', justifyContent: 'flex-start', padding: '6px 10px', fontSize: '0.82rem', gap: '8px' }}
                            onClick={() => {
                              setEditingMessageId(msgId);
                              setEditText(msg.text || '');
                              setActiveMenuMessageId(null);
                            }}
                          >
                            <Edit2 size={14} />
                            Edit Message
                          </button>
                        )}
                        {isMe && (
                          <button
                            type="button"
                            className="btn btn-ghost"
                            style={{ width: '100%', justifyContent: 'flex-start', padding: '6px 10px', fontSize: '0.82rem', color: '#ef4444', gap: '8px' }}
                            onClick={() => {
                              if (confirm('Delete this message for everyone?')) {
                                onDeleteMessage(msgId, true);
                              }
                              setActiveMenuMessageId(null);
                            }}
                          >
                            <Trash2 size={14} />
                            Delete Message
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll-to-Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom('smooth')}
          style={{
            position: 'absolute',
            bottom: '90px',
            right: '24px',
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: '#202c33',
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#aebac1',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 30,
            transition: 'transform 0.15s',
          }}
          title="Scroll to latest"
        >
          <ChevronDown size={20} />
        </button>
      )}

      {/* Quoted Reply Banner Bar */}
      {replyingTo && (
        <div
          className="animate-fade-in"
          style={{
            padding: '10px 20px',
            background: '#1f2c34',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderLeft: '4px solid #25d366',
          }}
        >
          <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#25d366', display: 'block' }}>
              Replying to {typeof replyingTo.senderId === 'object' ? replyingTo.senderId.displayName : 'User'}
            </span>
            <span
              style={{
                fontSize: '0.82rem',
                color: '#8696a0',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
              }}
            >
              {replyingTo.text || 'Attachment'}
            </span>
          </div>
          <button
            className="btn btn-ghost btn-icon"
            style={{ width: '28px', height: '28px', color: '#8696a0' }}
            onClick={() => setReplyingTo(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* WhatsApp Emoji Picker Tray */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="animate-fade-in"
          style={{
            position: 'absolute',
            bottom: '78px',
            left: '20px',
            background: '#202c33',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            zIndex: 60,
            width: '320px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              paddingBottom: '6px',
            }}
          >
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#8696a0' }}>Emojis</span>
            <button
              className="btn btn-ghost"
              style={{ padding: '2px', color: '#8696a0' }}
              onClick={() => setShowEmojiPicker(false)}
            >
              <X size={14} />
            </button>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(8, 1fr)',
              gap: '6px',
              maxHeight: '180px',
              overflowY: 'auto',
            }}
          >
            {EMOJI_LIST.map((emoji) => (
              <button
                key={emoji}
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.3rem',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  transition: 'transform 0.1s',
                }}
                onClick={() => setInputText((prev) => prev + emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* WhatsApp Attachment Menu */}
      {showAttachMenu && (
        <div ref={attachMenuRef} className="wa-attach-menu">
          <button
            type="button"
            className="wa-attach-item"
            onClick={() => {
              setShowAttachMenu(false);
              imageInputRef.current?.click();
            }}
          >
            <ImageIcon size={18} color="#00a884" />
            <span>Photos & Videos</span>
          </button>
          <button
            type="button"
            className="wa-attach-item"
            onClick={() => {
              setShowAttachMenu(false);
              fileInputRef.current?.click();
            }}
          >
            <FileText size={18} color="#7f66ff" />
            <span>Document / File</span>
          </button>
          <button
            type="button"
            className="wa-attach-item"
            onClick={() => {
              setShowAttachMenu(false);
              audioInputRef.current?.click();
            }}
          >
            <Headphones size={18} color="#f59e0b" />
            <span>Audio File</span>
          </button>
        </div>
      )}

      {/* WhatsApp Message Input Bar */}
      <footer
        style={{
          padding: '12px 20px',
          background: '#202c33',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          position: 'relative',
        }}
      >
        {/* Hidden File Inputs */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={(e) => handleFileUpload(e, 'FILE')}
        />
        <input
          type="file"
          ref={imageInputRef}
          accept="image/*,video/*"
          style={{ display: 'none' }}
          onChange={(e) => handleFileUpload(e, 'IMAGE')}
        />
        <input
          type="file"
          ref={audioInputRef}
          accept="audio/*"
          style={{ display: 'none' }}
          onChange={(e) => handleFileUpload(e, 'VOICE_NOTE')}
        />

        {isRecording ? (
          /* Live Voice Recording Bar */
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#111b21',
              borderRadius: '24px',
              padding: '8px 16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                className="animate-pulse-recording"
                style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }}
              />
              <span style={{ fontSize: '0.9rem', color: '#e9edef', fontWeight: 600 }}>
                {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#8696a0' }}>Recording audio...</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                style={{ color: '#ef4444', width: '36px', height: '36px' }}
                onClick={cancelVoiceRecording}
                title="Cancel recording"
              >
                <Trash2 size={18} />
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ borderRadius: '50%', width: '38px', height: '38px', padding: 0, background: '#00a884' }}
                onClick={sendVoiceRecording}
                title="Send voice note"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        ) : (
          /* Standard Input Bar */
          <>
            {/* Emoji Trigger */}
            <button
              ref={emojiBtnRef}
              type="button"
              className="btn btn-ghost btn-icon"
              style={{ color: showEmojiPicker ? '#00a884' : '#8696a0', width: '36px', height: '36px' }}
              onClick={toggleEmojiPicker}
              title="Emojis"
            >
              <Smile size={22} />
            </button>

            {/* Attachments Menu Trigger */}
            <button
              ref={attachBtnRef}
              type="button"
              className="btn btn-ghost btn-icon"
              style={{ color: showAttachMenu ? '#00a884' : '#8696a0', width: '36px', height: '36px' }}
              onClick={toggleAttachMenu}
              title="Attach File"
              disabled={isUploading}
            >
              <Paperclip size={20} />
            </button>

            {/* Input Form */}
            <form onSubmit={handleSend} style={{ flex: 1, display: 'flex' }}>
              <input
                type="text"
                className="input-field"
                style={{
                  width: '100%',
                  background: '#2a3942',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  color: '#e9edef',
                  fontSize: '0.94rem',
                }}
                placeholder={isUploading ? 'Uploading file...' : 'Type a message'}
                value={inputText}
                onChange={handleInputChange}
                disabled={isUploading}
              />
            </form>

            {/* Send or Voice Record Trigger */}
            {inputText.trim() ? (
              <button
                type="button"
                onClick={handleSend}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: '#00a884',
                  border: 'none',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                  transition: 'transform 0.15s',
                }}
                title="Send message"
              >
                <Send size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={startVoiceRecording}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: '#00a884',
                  border: 'none',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                  transition: 'transform 0.15s',
                }}
                title="Hold or click to record voice note"
              >
                <Mic size={20} />
              </button>
            )}
          </>
        )}
      </footer>

      {/* Fullscreen Image Lightbox */}
      {lightboxImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.92)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '24px',
          }}
          onClick={() => setLightboxImage(null)}
        >
          <div
            style={{
              position: 'absolute',
              top: '20px',
              right: '24px',
              display: 'flex',
              gap: '12px',
              zIndex: 110,
            }}
          >
            <a
              href={lightboxImage}
              download
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-icon"
              onClick={(e) => e.stopPropagation()}
            >
              <Download size={20} />
            </a>
            <button
              type="button"
              className="btn btn-secondary btn-icon"
              onClick={() => setLightboxImage(null)}
            >
              <X size={20} />
            </button>
          </div>
          <AuthenticatedImage
            src={lightboxImage}
            alt="Full view"
            style={{
              maxWidth: '90vw',
              maxHeight: '85vh',
              borderRadius: '8px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
              background: 'transparent',
            }}
            onClick={(e) => e?.stopPropagation && e.stopPropagation()}
          />
        </div>
      )}
    </main>
  );
};

export default ChatArea;
