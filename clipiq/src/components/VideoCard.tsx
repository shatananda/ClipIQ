'use client';

import { YouTubeVideo, VideoStatus } from '@/types';

interface Props {
  video: YouTubeVideo;
  status: VideoStatus;
  onSelect: () => void;
  onShowDetail: () => void;
}

export function VideoCard({ video, status, onSelect, onShowDetail }: Props) {
  const publishDate = new Date(video.publishedAt);
  const now = new Date();
  const diffMs = now.getTime() - publishDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let relativeDate = 'Today';
  if (diffDays === 1) relativeDate = '1 day ago';
  else if (diffDays < 7) relativeDate = `${diffDays} days ago`;
  else if (diffDays < 30) relativeDate = `${Math.floor(diffDays / 7)} weeks ago`;
  else if (diffDays < 365) relativeDate = `${Math.floor(diffDays / 30)} months ago`;
  else relativeDate = `${Math.floor(diffDays / 365)} years ago`;

  const formattedDate = publishDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const minutes = Math.floor(video.durationSeconds / 60);
  const seconds = video.durationSeconds % 60;
  const durationLabel = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const statusColor = status === 'clipped' ? '#10b981' : status === 'analyzed' ? '#3b82f6' : undefined;
  const statusLabel = status === 'clipped' ? 'Clipped' : status === 'analyzed' ? 'Analyzed' : undefined;

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-light)',
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'pointer',
        border: '1px solid var(--border)',
      }}
    >
      <div
        onClick={onShowDetail}
        style={{
          position: 'relative',
          paddingBottom: '56.25%',
          backgroundColor: '#000',
          cursor: 'pointer',
        }}
      >
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: '#fff',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 500,
          }}
        >
          {durationLabel}
        </div>
        {statusLabel && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              backgroundColor: statusColor,
              color: '#fff',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            {statusLabel}
          </div>
        )}
      </div>

      <div style={{ padding: '12px' }}>
        <h3
          style={{
            margin: '0 0 8px 0',
            fontSize: '14px',
            fontWeight: 500,
            color: 'var(--text)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: '1.4',
          }}
        >
          {video.title}
        </h3>

        <div
          style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            marginBottom: '12px',
          }}
        >
          <div>{formattedDate} · {relativeDate}</div>
        </div>

        <button
          onClick={onSelect}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: 'var(--primary)',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = 'var(--primary-dark)';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = 'var(--primary)';
          }}
        >
          Select
        </button>
      </div>
    </div>
  );
}
