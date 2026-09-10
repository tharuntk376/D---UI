import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiBaseUrl, getMediaUrl } from '../../services/api';
import { ImageIcon, Download, RefreshCw } from 'lucide-react';

const blobCache = new Map();

export const AuthenticatedImage = ({
  src,
  mediaId,
  filename,
  alt = 'Image',
  style = {},
  className = '',
  onClick,
}) => {
  const [imageSrc, setImageSrc] = useState(() => {
    // Check cache first
    const primaryKey = src || (typeof mediaId === 'string' ? mediaId : null) || filename;
    if (primaryKey && blobCache.has(primaryKey)) {
      return blobCache.get(primaryKey);
    }
    // Only return immediate data: or http: (non-blob) URLs that don't need auth
    if (src && src.startsWith('data:')) {
      return src;
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(!imageSrc);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadAuthenticatedImage = async () => {
      const token = localStorage.getItem('accessToken');
      const baseUrl = getApiBaseUrl().replace(/\/$/, '');

      // 1. Build prioritized list of candidate URLs
      const candidates = [];

      // Extract mediaId string or object
      let idStr = null;
      if (mediaId) {
        if (typeof mediaId === 'object') {
          idStr = mediaId._id || mediaId.id || mediaId.fileId || mediaId.mediaId;
          const directObjUrl = mediaId.url || mediaId.fileUrl || mediaId.path || mediaId.secure_url;
          if (directObjUrl) candidates.push(directObjUrl);
        } else if (typeof mediaId === 'string') {
          idStr = mediaId;
        }
      }

      if (src) candidates.push(src);

      if (idStr) {
        if (idStr.startsWith('http') || idStr.startsWith('/')) {
          candidates.push(getMediaUrl(idStr));
        } else {
          candidates.push(`/api/files/getfileaccess/${idStr}`);
          candidates.push(`/api/media/getmedia/${idStr}`);
          candidates.push(`/api/files/${idStr}`);
          candidates.push(`/api/files/download/${idStr}`);
          candidates.push(`/api/media/${idStr}`);
          if (baseUrl) {
            candidates.push(`${baseUrl}/api/files/getfileaccess/${idStr}`);
            candidates.push(`${baseUrl}/api/media/getmedia/${idStr}`);
          }
        }
      }

      const cleanFilename = filename ? filename.replace(/^.*[\\/]/, '') : null;
      if (cleanFilename && /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(cleanFilename)) {
        candidates.push(`/uploads/${encodeURIComponent(cleanFilename)}`);
        candidates.push(`/uploads/${cleanFilename}`);
        candidates.push(`/api/uploads/${encodeURIComponent(cleanFilename)}`);
        candidates.push(`/api/files/download/${encodeURIComponent(cleanFilename)}`);
        if (baseUrl) {
          candidates.push(`${baseUrl}/uploads/${encodeURIComponent(cleanFilename)}`);
          candidates.push(`${baseUrl}/uploads/${cleanFilename}`);
        }
      }

      // Check cache first for all candidates
      for (const cand of candidates) {
        if (cand && blobCache.has(cand)) {
          if (isMounted) {
            setImageSrc(blobCache.get(cand));
            setIsLoading(false);
            setHasError(false);
          }
          return;
        }
      }

      // 2. Try candidates with authentication
      for (const cand of candidates) {
        if (!cand) continue;

        // If candidate is a local blob URL created in this session, verify it
        if (cand.startsWith('blob:')) {
          try {
            const check = await fetch(cand);
            if (check.ok) {
              const blob = await check.blob();
              if (blob.size > 0) {
                if (isMounted) {
                  setImageSrc(cand);
                  setIsLoading(false);
                  setHasError(false);
                }
                return;
              }
            }
          } catch {
            // Blob expired or belongs to another session; continue to next candidate
          }
          continue;
        }

        try {
          const res = await axios.get(cand, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            responseType: 'blob',
            timeout: 9000,
          });

          if (res.data && res.data.size > 0) {
            // If backend returned JSON (e.g. { success: true, data: { fileUrl: "..." } })
            if (res.data.type && res.data.type.includes('json')) {
              try {
                const text = await res.data.text();
                const json = JSON.parse(text);
                const directUrl =
                  json.url ||
                  json.fileUrl ||
                  json.fileAccessUrl ||
                  json.data?.url ||
                  json.data?.fileUrl ||
                  json.data?.fileAccessUrl ||
                  json.data?.path ||
                  json.data?.mediaUrl ||
                  json.mediaUrl;

                if (directUrl && typeof directUrl === 'string') {
                  if (directUrl.startsWith('http://') || directUrl.startsWith('https://')) {
                    blobCache.set(cand, directUrl);
                    if (isMounted) {
                      setImageSrc(directUrl);
                      setIsLoading(false);
                      setHasError(false);
                    }
                    return;
                  } else {
                    // Fetch direct URL with auth
                    const innerRes = await axios.get(directUrl, {
                      headers: token ? { Authorization: `Bearer ${token}` } : {},
                      responseType: 'blob',
                      timeout: 9000,
                    });
                    if (innerRes.data && innerRes.data.size > 0) {
                      const objectUrl = URL.createObjectURL(innerRes.data);
                      blobCache.set(cand, objectUrl);
                      if (isMounted) {
                        setImageSrc(objectUrl);
                        setIsLoading(false);
                        setHasError(false);
                      }
                      return;
                    }
                  }
                }
              } catch {
                // Not valid json
              }
            } else if (
              res.data.type?.startsWith('image/') ||
              res.data.type === 'application/octet-stream' ||
              !res.data.type
            ) {
              const objectUrl = URL.createObjectURL(res.data);
              blobCache.set(cand, objectUrl);
              if (isMounted) {
                setImageSrc(objectUrl);
                setIsLoading(false);
                setHasError(false);
              }
              return;
            }
          }
        } catch {
          // Candidate failed, try next
        }
      }

      // If all candidate fetches failed
      if (isMounted) {
        setHasError(true);
        setIsLoading(false);
      }
    };

    setIsLoading(true);
    setHasError(false);
    loadAuthenticatedImage();

    return () => {
      isMounted = false;
    };
  }, [src, mediaId, filename]);

  const handleImageError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleClick = (e) => {
    if (onClick) {
      onClick(imageSrc || src || (mediaId ? getMediaUrl(mediaId) : null), e);
    }
  };

  if (hasError) {
    const displayName = filename || alt || 'Image attachment';
    const downloadHref =
      imageSrc ||
      (src && !src.startsWith('blob:') ? src : null) ||
      (mediaId ? getMediaUrl(mediaId) : filename ? `/uploads/${filename}` : null);

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 14px',
          background: 'rgba(0,0,0,0.28)',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.08)',
          minWidth: '220px',
          ...style,
        }}
        className={className}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            background: 'rgba(0, 168, 132, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <ImageIcon size={20} color="#00a884" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              fontSize: '0.84rem',
              fontWeight: 600,
              color: '#e9edef',
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {displayName}
          </span>
          <span style={{ fontSize: '0.72rem', color: '#8696a0' }}>Photo attachment</span>
        </div>
        {downloadHref && (
          <a
            href={downloadHref}
            target="_blank"
            rel="noreferrer"
            download={displayName}
            style={{ color: '#8696a0', padding: '6px', display: 'flex', alignItems: 'center' }}
            onClick={(e) => e.stopPropagation()}
            title="Download image"
          >
            <Download size={16} />
          </a>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: '8px',
        overflow: 'hidden',
        background: 'rgba(0,0,0,0.18)',
        minHeight: isLoading ? '160px' : 'auto',
        minWidth: '180px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
      className={className}
      onClick={handleClick}
    >
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: 'rgba(0,0,0,0.25)',
            zIndex: 2,
            minHeight: '160px',
          }}
        >
          <RefreshCw size={22} color="#00a884" className="animate-spin" style={{ opacity: 0.85 }} />
          <span style={{ fontSize: '0.74rem', color: '#8696a0' }}>Loading photo...</span>
        </div>
      )}
      {imageSrc && !isLoading && (
        <img
          src={imageSrc}
          alt={alt}
          onLoad={() => setIsLoading(false)}
          onError={handleImageError}
          style={{
            width: '100%',
            maxHeight: '340px',
            display: 'block',
            borderRadius: '8px',
            objectFit: 'cover',
            transition: 'opacity 0.2s',
            opacity: isLoading ? 0 : 1,
          }}
        />
      )}
    </div>
  );
};

