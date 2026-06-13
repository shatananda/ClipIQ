'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ClipCard from '@/components/ClipCard';
import { ClipIQState, ClipSuggestion } from '@/types';
import { DownloadIcon } from '@/components/Icons';

export default function DownloadPage() {
  const router = useRouter();
  const [state, setState] = useState<ClipIQState | null>(null);
  const [approvedClips, setApprovedClips] = useState<ClipSuggestion[]>([]);
  const [downloading, setDownloading] = useState<Set<number>>(new Set());
  const [allDownloading, setAllDownloading] = useState(false);

  useEffect(() => {
    const clipiqState = sessionStorage.getItem('clipiq_state');
    const approvedClipsStr = sessionStorage.getItem('approved_clips');

    if (!clipiqState || !approvedClipsStr) {
      router.push('/');
      return;
    }

    setState(JSON.parse(clipiqState));
    setApprovedClips(JSON.parse(approvedClipsStr));
  }, [router]);

  const generateMetadataText = (clip: ClipSuggestion): string => {
    const lines = [
      `HEADLINE: ${clip.headline}`,
      ``,
      `HOOK: "${clip.hook}"`,
      ``,
      `WHY CLIP-WORTHY: ${clip.why_clip_worthy}`,
      ``,
      `TYPE: ${clip.type}`,
      `DURATION: ${clip.duration_seconds}s`,
      `TIMESTAMP: ${formatTime(clip.start_ms)} to ${formatTime(clip.end_ms)}`,
      `CONFIDENCE: ${clip.confidence}%`,
      `BEST FOR: ${clip.suggested_platforms.join(', ')}`,
    ];
    return lines.join('\n');
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const downloadMetadata = (clip: ClipSuggestion) => {
    const metadata = generateMetadataText(clip);
    const blob = new Blob([metadata], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${clip.headline.toLowerCase().replace(/\s+/g, '_')}_metadata.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleDownloadClip = async (clip: ClipSuggestion) => {
    if (!state) return;

    const newDownloading = new Set(downloading);
    newDownloading.add(clip.id);
    setDownloading(newDownloading);

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoPath: state.videoPath, clip }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const videoUrl = data.downloadUrl || `/api/download-clip/${clip.id}`;
      const a = document.createElement('a');
      a.href = videoUrl;
      a.download = data.filename || `${clip.headline}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      newDownloading.delete(clip.id);
      setDownloading(newDownloading);
    }
  };

  const handleDownloadAll = async () => {
    setAllDownloading(true);
    try {
      for (const clip of approvedClips) {
        // Download metadata first
        downloadMetadata(clip);

        // Then download video with slight delay
        if (!state) return;
        await new Promise((resolve) => setTimeout(resolve, 500));

        try {
          const res = await fetch('/api/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoPath: state.videoPath, clip }),
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.error);

          const videoUrl = data.downloadUrl || `/api/download-clip/${clip.id}`;
          const a = document.createElement('a');
          a.href = videoUrl;
          a.download = data.filename || `${clip.headline}.mp4`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Error downloading clip ${clip.id}:`, error);
          // Silently fail - user can try again
        }
      }
    } finally {
      setAllDownloading(false);
    }
  };

  if (!state || approvedClips.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-light)', marginBottom: '16px' }}>
            No approved clips to download
          </p>
          <button
            onClick={() => router.push('/')}
            style={{
              padding: '10px 16px',
              backgroundColor: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Analyze Another Video
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: 'var(--text)' }}>
          Download Your Clips
        </h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '16px' }}>
          {approvedClips.length} clip{approvedClips.length !== 1 ? 's' : ''} approved and ready to download
        </p>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button
            onClick={() => router.push('/review')}
            style={{
              padding: '10px 16px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontWeight: '500',
              backgroundColor: 'transparent',
              color: 'var(--text)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = 'var(--bg-gray)';
            }}
            onMouseOut={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
            }}
          >
            Back to Review
          </button>
          <button
            onClick={handleDownloadAll}
            disabled={allDownloading}
            style={{
              padding: '10px 16px',
              backgroundColor: allDownloading ? 'var(--text-light)' : 'var(--primary)',
              color: 'white',
              borderRadius: '8px',
              fontWeight: '500',
              border: 'none',
              cursor: allDownloading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => {
              if (!allDownloading) (e.target as HTMLButtonElement).style.opacity = '0.9';
            }}
            onMouseOut={(e) => {
              if (!allDownloading) (e.target as HTMLButtonElement).style.opacity = '1';
            }}
          >
            <DownloadIcon /> {allDownloading ? 'Downloading...' : 'Download All'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {approvedClips.map((clip) => (
          <div key={clip.id} className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px', color: 'var(--text)' }}>
                  {clip.headline}
                </h3>
                <p
                  style={{
                    color: 'var(--text)',
                    fontStyle: 'italic',
                    fontSize: '14px',
                    marginBottom: '12px',
                  }}
                >
                  "{clip.hook}"
                </p>
                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-light)' }}>
                  <span>{clip.type}</span>
                  <span>{clip.duration_seconds}s</span>
                  <span>{clip.confidence}%</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => handleDownloadClip(clip)}
                  disabled={downloading.has(clip.id) || allDownloading}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: downloading.has(clip.id) ? 'var(--text-light)' : 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '500',
                    cursor: downloading.has(clip.id) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseOver={(e) => {
                    if (!downloading.has(clip.id) && !allDownloading) {
                      (e.target as HTMLButtonElement).style.opacity = '0.9';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!downloading.has(clip.id) && !allDownloading) {
                      (e.target as HTMLButtonElement).style.opacity = '1';
                    }
                  }}
                >
                  <DownloadIcon /> {downloading.has(clip.id) ? 'Downloading...' : 'Download MP4'}
                </button>
                <button
                  onClick={() => downloadMetadata(clip)}
                  disabled={downloading.has(clip.id) || allDownloading}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: 'var(--bg-gray)',
                    color: 'var(--text)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontWeight: '500',
                    cursor: downloading.has(clip.id) || allDownloading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseOver={(e) => {
                    if (!downloading.has(clip.id) && !allDownloading) {
                      (e.target as HTMLButtonElement).style.backgroundColor = 'var(--border)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!downloading.has(clip.id) && !allDownloading) {
                      (e.target as HTMLButtonElement).style.backgroundColor = 'var(--bg-gray)';
                    }
                  }}
                >
                  <DownloadIcon /> Metadata
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
