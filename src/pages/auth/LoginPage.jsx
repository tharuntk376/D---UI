import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Sparkles, Lock, Mail, ArrowRight, Server, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';
import { authService } from '../../services/authService';

export const LoginPage = () => {
  const { login, serverUrl } = useAuth();
  const navigate = useNavigate();

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Forgot password flow state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState('request');
  const [forgotMessage, setForgotMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const loggedUser = await login({ loginId, password });
      if (loggedUser?.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/chat');
      }
    } catch (err) {
      setError(err.message || 'Failed to authenticate. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillCredentials = (role) => {
    if (role === 'admin') {
      setLoginId('admin');
      setPassword('admin123');
    } else {
      setLoginId('user1');
      setPassword('user123');
    }
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setForgotMessage(null);
    try {
      const token = await authService.forgotPassword({ email: forgotEmail });
      setResetToken(token);
      setForgotStep('reset');
      setForgotMessage(`Reset token generated! Copy or use below.`);
    } catch (err) {
      setForgotMessage(err.message || 'Failed to request reset token');
    }
  };

  const handlePerformReset = async (e) => {
    e.preventDefault();
    setForgotMessage(null);
    try {
      await authService.resetPassword({ resetToken, newPassword });
      alert('Password reset successful! You can now log in.');
      setShowForgotModal(false);
      setForgotStep('request');
    } catch (err) {
      setForgotMessage(err.message || 'Failed to reset password');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at top, #1e1b4b 0%, #0b0d14 60%)',
        position: 'relative',
        padding: 'clamp(14px, 3vw, 24px)',
      }}
    >
      {/* Background glowing orbs */}
      <div
        style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
          top: '10%',
          left: '15%',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(217, 70, 239, 0.12) 0%, transparent 70%)',
          bottom: '10%',
          right: '15%',
          pointerEvents: 'none',
        }}
      />

      <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 10 }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '14px',
              background: 'var(--gradient-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px var(--primary-glow)',
              marginBottom: '12px',
            }}
          >
            <Sparkles size={26} color="#fff" />
          </div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '4px' }}>Welcome Back</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Sign in to access your chats and administration portal
          </p>
        </div>

        {/* Login Card */}
        <div className="card glass-panel" style={{ padding: 'clamp(18px, 4vw, 32px)' }}>
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                fontSize: '0.85rem',
                marginBottom: '20px',
              }}
            >
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="input-group">
              <label className="input-label">Username or Email</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                  placeholder="e.g. user1@dchat.local or username"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  required
                />
                <Mail
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
              </div>
            </div>

            <div className="input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="input-label">Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary-light)',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                  }}
                >
                  Forgot Password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Lock
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '0.95rem', marginTop: '4px' }}
              disabled={loading}
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Quick Fill Credentials */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
            <span
              style={{
                display: 'block',
                textAlign: 'center',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                marginBottom: '10px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Fill Credentials (API Auth)
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.78rem', padding: '8px 10px' }}
                onClick={() => handleFillCredentials('user')}
              >
                <UserCheck size={14} color="var(--primary-light)" />
                <span>Fill User Account</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.78rem', padding: '8px 10px' }}
                onClick={() => handleFillCredentials('admin')}
              >
                <ShieldCheck size={14} color="var(--warning)" />
                <span>Fill Admin Account</span>
              </button>
            </div>
          </div>
        </div>

        {/* Server Target Indicator */}
        <div
          style={{
            marginTop: '20px',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
          }}
        >
          <Server size={14} />
          <span>Connecting to:</span>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
            {serverUrl || 'Vite Proxy (https://danish-chat-1.onrender.com)'}
          </span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
          onClick={() => setShowForgotModal(false)}
        >
          <div
            className="card animate-fade-in"
            style={{ width: '100%', maxWidth: '440px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>
              {forgotStep === 'request' ? 'Reset Password' : 'Enter New Password'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              {forgotStep === 'request'
                ? 'Enter your account email to receive a password reset token.'
                : 'Enter the reset token along with your new password.'}
            </p>

            {forgotMessage && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  color: 'var(--primary-light)',
                  fontSize: '0.82rem',
                  marginBottom: '16px',
                  wordBreak: 'break-all',
                }}
              >
                {forgotMessage}
              </div>
            )}

            {forgotStep === 'request' ? (
              <form onSubmit={handleRequestReset} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="input-group">
                  <label className="input-label">Registered Email</label>
                  <input
                    type="email"
                    className="input-field"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="user1@dchat.local"
                    required
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowForgotModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Get Reset Token
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handlePerformReset} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="input-group">
                  <label className="input-label">Reset Token</label>
                  <input
                    type="text"
                    className="input-field"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">New Password</label>
                  <input
                    type="password"
                    className="input-field"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowForgotModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Update Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
