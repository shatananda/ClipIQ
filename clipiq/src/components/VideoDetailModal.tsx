'use client';

import { YouTubeVideo } from '@/types';

interface Props {
  video: YouTubeVideo;
  onClose: () => void;
  onSelectVideo: () => void;
}

export function VideoDetailModal({ video, onClose, onSelectVideo }: Props) {
  const minutes = Math.floor(video.durationSeconds / 60);
  const seconds = video.durationSeconds % 60;
  const durationLabel = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const publishDate = new Date(video.publishedAt);
  const formattedDate = publishDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const viewCountLabel = video.viewCount
    ? (video.viewCount / 1000).toFixed(0) + 'K views'
    : 'No views recorded';

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
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--bg)',
          borderRadius: '8px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            position: 'relative',
            paddingBottom: '56.25%',
            backgroundColor: '#000',
          }}
        >
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${video.videoId}`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 'none',
            }}
          />
        </div>

        <div style={{ padding: '20px', flex: 1 }}>
          <h2
            style={{
              margin: '0 0 12px 0',
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--text)',
            }}
          >
            {video.title}
          </h2>

          <div
            style={{
              display: 'flex',
              gap: '16px',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              marginBottom: '16px',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '12px',
            }}
          >
            <span>{formattedDate}</span>
            <span>{durationLabel}</span>
            <span>{viewCountLabel}</span>
          </div>

          <p
            style={{
              margin: '0 0 20px 0',
              fontSize: '13px',
              color: 'var(--text)',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {video.description || 'No description'}
          </p>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onSelectVideo}
              style={{
                flex: 1,
                padding: '10px 16px',
                backgroundColor: 'var(--primary)',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = 'var(--primary-dark)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = 'var(--primary)';
              }}
            >
              Select this video
            </button>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px 16px',
                backgroundColor: 'var(--bg-light)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
