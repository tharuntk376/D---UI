import React from 'react';
import { useSocket } from '../../hooks/useSocket';
import { Phone, PhoneOff, Video } from 'lucide-react';

export const CallModal = () => {
  const { incomingCall, dismissCall } = useSocket();

  if (!incomingCall) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 200,
        width: '340px',
      }}
      className="animate-fade-in"
    >
      <div
        className="card"
        style={{
          border: '1px solid rgba(99, 102, 241, 0.4)',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.8), 0 0 20px var(--primary-glow)',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulseGlow 1.5s infinite',
            }}
          >
            {incomingCall.isVideo ? <Video size={24} color="#fff" /> : <Phone size={24} color="#fff" />}
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--primary-light)', fontWeight: 700 }}>
              Incoming {incomingCall.isVideo ? 'Video' : 'Voice'} Call
            </span>
            <h4 style={{ fontSize: '1.1rem', margin: '2px 0 0 0' }}>
              {incomingCall.callerName || 'Unknown Contact'}
            </h4>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={dismissCall}
            className="btn btn-danger"
            style={{ flex: 1, padding: '10px' }}
          >
            <PhoneOff size={16} />
            Decline
          </button>
          <button
            onClick={() => {
              alert('Call answered! (WebRTC Media Stream connects with audio/video hardware)');
              dismissCall();
            }}
            className="btn btn-primary"
            style={{ flex: 1, padding: '10px', background: 'var(--success)' }}
          >
            <Phone size={16} />
            Answer
          </button>
        </div>
      </div>
    </div>
  );
};
