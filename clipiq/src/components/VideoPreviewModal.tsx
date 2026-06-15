'use client';

import { ClipSuggestion } from '@/types';
import { TimeSuggestionAdjuster } from './TimeSuggestionAdjuster';

interface VideoPreviewModalProps {
  clip: ClipSuggestion;
  videoId: string;
  isApproved: boolean;
  videoDurationSeconds?: number;
  adjustedTimes?: { start_ms: number; end_ms: number };
  onApprove: (approved: boolean) => void;
  onTimeChange?: (startMs: number, endMs: number) => void;
  onClose: () => void;
}

export default function VideoPreviewModal({
  clip,
  videoId,
  isApproved,
  videoDurationSeconds = 0,
  adjustedTimes,
  onApprove,
  onTimeChange,
  onClose,
}: VideoPreviewModalProps) {
  const currentStart = adjustedTimes?.start_ms ?? clip.start_ms;
  const currentEnd = adjustedTimes?.end_ms ?? clip.end_ms;
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const startSeconds = Math.floor(clip.start_ms / 1000);
  const endSeconds = Math.floor(clip.end_ms / 1000);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--bg)',
          borderRadius: '12px',
          overflow: 'hidden',
          maxWidth: '900px',
          width: '90%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Video Player */}
        <div style={{ position: 'relative', backgroundColor: '#000', aspectRatio: '16 / 9' }}>
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}?start=${startSeconds}&controls=1&modestbranding=1`}
            title={clip.headline}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ border: 'none' }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              right: '16px',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
            }}
          >
            Ends at {formatTime(clip.end_ms)}
          </div>
        </div>

        {/* Content - Scrollable */}
        <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto', flex: 1 }}>
          {/* Metadata */}
          <div>
            <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px', color: 'var(--text)' }}>
              {clip.headline}
            </h3>
            <p
              style={{
                color: 'var(--text)',
                fontStyle: 'italic',
                fontSize: '15px',
                lineHeight: '1.6',
                marginBottom: '16px',
              }}
            >
              "{clip.hook}"
            </p>
            <p style={{ color: 'var(--text-light)', fontSize: '14px', marginBottom: '16px', lineHeight: '1.6' }}>
              {clip.why_clip_worthy}
            </p>
          </div>

          {/* Info Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '24px',
              paddingTop: '16px',
              paddingBottom: '16px',
              borderTop: '1px solid var(--border)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div>
              <p
                style={{
                  color: 'var(--text-light)',
                  fontSize: '11px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '8px',
                }}
              >
                Timestamp
              </p>
              <p style={{ color: 'var(--text)', fontFamily: 'monospace', fontWeight: '600', fontSize: '13px' }}>
                {formatTime(clip.start_ms)} to {formatTime(clip.end_ms)}
              </p>
            </div>
            <div>
              <p
                style={{
                  color: 'var(--text-light)',
                  fontSize: '11px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '8px',
                }}
              >
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
              <p
                style={{
                  color: 'var(--text-light)',
                  fontSize: '11px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '8px',
                }}
              >
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

          {/* Time Adjustment */}
          {videoDurationSeconds > 0 && onTimeChange && (
            <TimeSuggestionAdjuster
              suggestedStartMs={clip.start_ms}
              suggestedEndMs={clip.end_ms}
              adjustedStartMs={currentStart}
              adjustedEndMs={currentEnd}
              durationMs={videoDurationSeconds * 1000}
              onChange={onTimeChange}
            />
          )}

        </div>

        {/* Actions - Fixed at bottom */}
        <div style={{ padding: '24px', display: 'flex', gap: '12px', alignItems: 'center', borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg)' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                flex: 1,
              }}
            >
              <input
                type="checkbox"
                checked={isApproved}
                onChange={(e) => onApprove(e.target.checked)}
                style={{
                  width: '20px',
                  height: '20px',
                  cursor: 'pointer',
                }}
              />
              <span style={{ color: 'var(--text)', fontWeight: '500' }}>
                Approve this clip
              </span>
            </label>
            <button
              onClick={onClose}
              style={{
                padding: '10px 24px',
                backgroundColor: 'var(--bg-gray)',
                color: 'var(--text)',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseOver={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = 'var(--border)';
              }}
              onMouseOut={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = 'var(--bg-gray)';
              }}
            >
              Close
            </button>
        </div>
      </div>
    </div>
  );
}
