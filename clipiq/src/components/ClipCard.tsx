'use client';

import { ClipSuggestion } from '@/types';

interface ClipCardProps {
  clip: ClipSuggestion;
  onPreview: (clip: ClipSuggestion) => void;
  isApproved?: boolean;
}

export default function ClipCard({ clip, onPreview, isApproved }: ClipCardProps) {
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="card" style={{
      marginBottom: '24px',
      overflow: 'hidden',
      border: isApproved ? '2px solid var(--success)' : '2px solid var(--border)',
      position: 'relative',
    }}>
      {/* Header with type badge and duration */}
      <div
        style={{
          backgroundColor: '#1a1f36',
          color: 'white',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
        }}
      >
        {/* Approval Indicator */}
        {isApproved && (
          <div style={{
            position: 'absolute',
            top: '50%',
            right: '24px',
            transform: 'translateY(-50%)',
            background: 'var(--success)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
          }}>
            ✓ Approved
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              fontSize: '13px',
              fontWeight: '600',
              padding: '6px 12px',
              backgroundColor: 'var(--primary)',
              borderRadius: '20px',
            }}
          >
            {clip.type}
          </span>
          <span style={{ fontSize: '13px', fontWeight: '500', color: '#ccc' }}>
            {clip.duration_seconds}s
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
          <span style={{ color: '#999' }}>Extract a {clip.duration_seconds}s clip</span>
          <span style={{ fontWeight: '600' }}>
            from {formatTime(clip.start_ms)} to {formatTime(clip.end_ms)}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div style={{ padding: '24px' }}>
        {/* Headline */}
        <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px', color: 'var(--text)' }}>
          {clip.headline}
        </h3>

        {/* Hook/Quote */}
        <div style={{ marginBottom: '16px' }}>
          <p
            style={{
              color: 'var(--text)',
              fontStyle: 'italic',
              fontSize: '15px',
              lineHeight: '1.6',
            }}
          >
            "{clip.hook}"
          </p>
        </div>

        {/* Why clip-worthy */}
        <p style={{ color: 'var(--text-light)', fontSize: '14px', marginBottom: '24px', lineHeight: '1.6' }}>
          {clip.why_clip_worthy}
        </p>

        {/* Metadata row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px',
            marginBottom: '24px',
            paddingTop: '16px',
            paddingBottom: '16px',
            borderTop: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div>
            <p style={{ color: 'var(--text-light)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              Timestamp
            </p>
            <p style={{ color: 'var(--text)', fontFamily: 'monospace', fontWeight: '600', fontSize: '13px' }}>
              {formatTime(clip.start_ms)} to {formatTime(clip.end_ms)}
            </p>
          </div>
          <div>
            <p style={{ color: 'var(--text-light)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              Confidence
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  flex: 1,
                  backgroundColor: 'var(--bg-gray)',
                  borderRadius: '3px',
                  height: '6px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    backgroundColor: 'var(--primary)',
                    width: `${clip.confidence}%`,
                  }}
                />
              </div>
              <span style={{ color: 'var(--text)', fontWeight: '700', fontSize: '13px' }}>
                {clip.confidence}%
              </span>
            </div>
          </div>
          <div>
            <p style={{ color: 'var(--text-light)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              Best For
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {clip.suggested_platforms.map((platform) => (
                <span
                  key={platform}
                  style={{
                    fontSize: '12px',
                    backgroundColor: 'rgba(91, 108, 246, 0.1)',
                    color: 'var(--primary)',
                    fontWeight: '500',
                    padding: '4px 8px',
                    borderRadius: '4px',
                  }}
                >
                  {platform}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => onPreview(clip)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: '600',
              backgroundColor: 'var(--primary)',
              color: 'white',
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => {
              (e.target as HTMLButtonElement).style.opacity = '0.9';
            }}
            onMouseOut={(e) => {
              (e.target as HTMLButtonElement).style.opacity = '1';
            }}
          >
            Preview
          </button>
        </div>
      </div>
    </div>
  );
}
