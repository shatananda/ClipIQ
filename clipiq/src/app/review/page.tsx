'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ClipCard from '@/components/ClipCard';
import { ClipIQState, ClipSuggestion } from '@/types';

export default function ReviewPage() {
  const router = useRouter();
  const [state, setState] = useState<ClipIQState | null>(null);
  const [accepted, setAccepted] = useState<ClipSuggestion[]>([]);
  const [extracting, setExtracting] = useState<number | null>(null);

  useEffect(() => {
    const clipiqState = sessionStorage.getItem('clipiq_state');
    if (!clipiqState) {
      router.push('/');
      return;
    }
    setState(JSON.parse(clipiqState));
  }, [router]);

  const handleAccept = (clip: ClipSuggestion) => {
    if (!accepted.find((c) => c.id === clip.id)) {
      setAccepted([...accepted, clip]);
    }
  };

  const handleDecline = (clip: ClipSuggestion) => {
    setAccepted(accepted.filter((c) => c.id !== clip.id));
  };

  const handleExtract = async (clip: ClipSuggestion) => {
    if (!state) return;

    setExtracting(clip.id);
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoPath: state.videoPath, clip }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      alert(`Clip extracted: ${data.filename}`);
    } catch (error) {
      console.error('Extract error:', error);
      alert(error instanceof Error ? error.message : 'Extraction failed');
    } finally {
      setExtracting(null);
    }
  };

  const handleProceedToSummary = () => {
    sessionStorage.setItem('accepted_clips', JSON.stringify(accepted));
    router.push('/summary');
  };

  if (!state) {
    return <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-light)' }}>Loading...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: 'var(--text)' }}>
          {state.title}
        </h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '16px' }}>
          Review and accept clips to extract
        </p>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button
            onClick={() => router.push('/')}
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
            Analyze Another Video
          </button>
          <button
            onClick={handleProceedToSummary}
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
            Proceed to Summary ({accepted.length} clips)
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {state.clips.map((clip) => {
          const isAccepted = accepted.some((c) => c.id === clip.id);
          return (
            <ClipCard
              key={clip.id}
              clip={clip}
              onAccept={handleAccept}
              onDecline={handleDecline}
              onExtract={handleExtract}
              isExtracting={extracting === clip.id}
              isAccepted={isAccepted}
            />
          );
        })}
      </div>
    </div>
  );
}
