import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { Avatar } from './Avatar';
import {
  MessageSquare,
  ShieldAlert,
  LogOut,
  Server,
  Sparkles,
  Settings,
} from 'lucide-react';

export const Navbar = () => {
  const { user, isAdmin, logout, serverUrl, updateServerUrl } = useAuth();
  const { isConnected } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  const [showServerModal, setShowServerModal] = useState(false);
  const [customUrl, setCustomUrl] = useState(serverUrl);

  const handleSaveServer = (e) => {
    e.preventDefault();
    updateServerUrl(customUrl);
    setShowServerModal(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <header
        style={{
          minHeight: '60px',
          height: 'var(--navbar-height, 64px)',
          background: 'var(--bg-glass-strong)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 clamp(10px, 3vw, 24px)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        {/* Brand Logo & Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 24px)' }}>
          <Link
            to="/chat"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--gradient-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px var(--primary-glow)',
                flexShrink: 0,
              }}
            >
              <Sparkles size={18} color="#fff" />
            </div>
            <div>
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 800,
                  fontSize: '1.15rem',
                  background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.02em',
                  display: 'block',
                }}
              >
                DanishChat
              </span>
              <span
                className="hide-mobile"
                style={{
                  display: 'block',
                  fontSize: '0.65rem',
                  color: 'var(--text-muted)',
                  marginTop: '-2px',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Enterprise Real-Time
              </span>
            </div>
          </Link>

          {/* Navigation links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Link
              to="/chat"
              className={`btn ${
                location.pathname.startsWith('/chat') ? 'btn-secondary' : 'btn-ghost'
              }`}
              style={{
                padding: '6px 10px',
                fontSize: '0.82rem',
                border: location.pathname.startsWith('/chat')
                  ? '1px solid var(--primary-glow)'
                  : '1px solid transparent',
              }}
              title="Messages"
            >
              <MessageSquare size={16} />
              <span className="hide-mobile">Messages</span>
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                className={`btn ${
                  location.pathname.startsWith('/admin') ? 'btn-secondary' : 'btn-ghost'
                }`}
                style={{
                  padding: '6px 10px',
                  fontSize: '0.82rem',
                  border: location.pathname.startsWith('/admin')
                    ? '1px solid rgba(245, 158, 11, 0.4)'
                    : '1px solid transparent',
                }}
                title="Admin Console"
              >
                <ShieldAlert size={16} color="var(--warning)" />
                <span className="hide-mobile" style={{ color: 'var(--warning)' }}>Admin</span>
              </Link>
            )}
          </nav>
        </div>

        {/* Right Section: Status, Server Switcher, Profile & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1.5vw, 14px)' }}>
          {/* Real-time Socket Indicator */}
          <div
            onClick={() => setShowServerModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
            title="Configure backend server connection"
          >
            <span
              className={`status-dot ${isConnected ? 'online' : 'offline'}`}
              style={{ width: '8px', height: '8px', flexShrink: 0 }}
            />
            <span className="hide-mobile">{isConnected ? 'Connected' : 'Connecting...'}</span>
            <Server size={13} style={{ opacity: 0.7 }} />
          </div>

          {/* User Details */}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Avatar
                name={user.displayName || user.username}
                avatarUrl={user.avatar}
                size={34}
                isOnline={true}
                showStatus={false}
              />
              <div className="hide-mobile" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#fff', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.displayName || user.username}
                  </span>
                  {user.role === 'ADMIN' ? (
                    <span className="badge badge-warning" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>ADMIN</span>
                  ) : null}
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  @{user.username}
                </span>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="btn btn-ghost btn-icon"
            title="Log Out"
            style={{ width: '34px', height: '34px', color: 'var(--text-muted)' }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Backend URL Modal */}
      {showServerModal && (
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
          onClick={() => setShowServerModal(false)}
        >
          <div
            className="card animate-fade-in"
            style={{ width: '100%', maxWidth: '480px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Settings size={18} color="var(--primary-light)" />
              </div>
              <h3 style={{ fontSize: '1.2rem' }}>Backend Server Configuration</h3>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              Connect this client to your live Render server or your local development instance.
            </p>

            <form onSubmit={handleSaveServer} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <label className="input-label">Server Base URL</label>
                <input
                  type="text"
                  className="input-field"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://danish-chat-1.onrender.com"
                  required
                />
              </div>

              {/* Quick Presets */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                  onClick={() => setCustomUrl('')}
                >
                  ⚡ Vite Proxy (Bypass CORS)
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                  onClick={() => setCustomUrl('https://danish-chat-1.onrender.com')}
                >
                  Direct Render
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                  onClick={() => setCustomUrl('http://localhost:5000')}
                >
                  Localhost (5000)
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowServerModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save & Reconnect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
