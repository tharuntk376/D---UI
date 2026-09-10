import React from 'react';
import { getMediaUrl } from '../../services/api';

export const Avatar = ({
  name = 'User',
  avatarUrl,
  size = 40,
  isOnline = false,
  showStatus = false,
}) => {
  const safeName =
    typeof name === 'string' && name.trim()
      ? name
      : typeof name === 'object' && name
      ? name.displayName || name.username || 'User'
      : 'User';

  const words = String(safeName).trim().split(/\s+/).filter(Boolean);
  const initials =
    words.length > 0
      ? words
          .map((w) => (w && w[0] ? w[0] : ''))
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : 'U';

  const fullUrl = typeof avatarUrl === 'string' && avatarUrl ? getMediaUrl(avatarUrl) : null;

  return (
    <div
      className="avatar"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        fontSize: `${Math.floor(size * 0.38)}px`,
      }}
    >
      {fullUrl ? (
        <img
          src={fullUrl}
          alt={name}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      ) : (
        <span>{initials}</span>
      )}

      {showStatus && (
        <span
          className={`avatar-indicator ${isOnline ? 'online' : 'offline'}`}
          style={{
            width: `${Math.max(10, Math.floor(size * 0.28))}px`,
            height: `${Math.max(10, Math.floor(size * 0.28))}px`,
            backgroundColor: isOnline ? 'var(--success)' : 'var(--text-muted)',
          }}
        />
      )}
    </div>
  );
};
