'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClipSuggestion } from '@/types';
import { DownloadIcon } from '@/components/Icons';

export default function SummaryPage() {
  const router = useRouter();
  const [clips, setClips] = useState<ClipSuggestion[]>([]);

  useEffect(() => {
    const clipsJson = sessionStorage.getItem('accepted_clips');
    if (!clipsJson) {
      router.push('/');
      return;
    }
    setClips(JSON.parse(clipsJson));
  }, [router]);

  const handleDownload = (filename: string) => {
    const a = document.createElement('a');
    a.href = `/api/serve-clip/${filename}`;
    a.download = filename;
    a.click();
  };

  const handleAnalyzeAnother = () => {
    sessionStorage.removeItem('clipiq_state');
    sessionStorage.removeItem('accepted_clips');
    router.push('/');
  };

  if (clips.length === 0) {
    return <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-light)' }}>No clips selected.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: 'var(--text)' }}>
          Summary
        </h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '16px' }}>
          {clips.length} clips selected for extraction
        </p>
        <button
          onClick={handleAnalyzeAnother}
          style={{
            padding: '10px 16px',
            backgroundColor: 'var(--primary)',
            color: 'white',
            borderRadius: '8px',
            fontWeight: '500',
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
          Analyze Another Video
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {clips.map((clip) => (
          <div key={clip.id} className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text)', marginBottom: '4px' }}>
                  {clip.headline}
                </h3>
                <p style={{ color: 'var(--text-light)', fontSize: '13px' }}>{clip.type}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px', fontSize: '13px' }}>
              <div>
                <p style={{ color: 'var(--text-light)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Duration
                </p>
                <p style={{ color: 'var(--text)', fontWeight: '600' }}>{clip.duration_seconds}s</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-light)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Confidence
                </p>
                <p style={{ color: 'var(--text)', fontWeight: '600' }}>{clip.confidence}%</p>
              </div>
            </div>

            <button
              onClick={() => handleDownload(`clip_${clip.id}_${clip.headline.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                backgroundColor: 'var(--primary)',
                color: 'white',
                borderRadius: '8px',
                fontWeight: '500',
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
              <DownloadIcon /> Download Clip
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
