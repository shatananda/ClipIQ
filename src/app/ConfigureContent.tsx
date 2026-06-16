'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProcessingProgress from '@/components/ProcessingProgress';
import { ClipIQState } from '@/types';

type ProcessingStage = 'idle' | 'downloading' | 'transcribing' | 'analyzing' | 'complete';

export default function ConfigureContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const videoId = searchParams.get('videoId');
  const title = searchParams.get('title') ? decodeURIComponent(searchParams.get('title')!) : '';

  const [burnCaptions, setBurnCaptions] = useState(true);
  const [captionFontSize, setCaptionFontSize] = useState(14);
  const [cropPosition, setCropPosition] = useState<'left' | 'center' | 'right'>('center');
  const [stage, setStage] = useState<ProcessingStage>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (!data.isLoggedIn) {
        router.push('/');
      }
    };

    checkAuth();

    if (!videoId) {
      router.push('/videos');
    }
  }, [router, videoId]);

  const handleStartAnalysis = async () => {
    if (!videoId) return;

    try {
      setError(null);
      setStage('downloading');

      const downloadRes = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: `https://www.youtube.com/watch?v=${videoId}` }),
      });

      if (!downloadRes.ok) {
        throw new Error('Failed to download video');
      }

      const downloadData = await downloadRes.json();
      const { videoPath, durationSeconds } = downloadData;

      setStage('transcribing');

      const transcribeRes = await fetch('/api/transcribe', {
        method: 'POST',
        body: JSON.stringify({ videoId, videoPath }),
      });

      if (!transcribeRes.ok) {
        throw new Error('Failed to transcribe video');
      }

      const transcribeData = await transcribeRes.json();
      const { paragraphs } = transcribeData;

      setStage('analyzing');

      const keywordsRes = await fetch('/api/keywords');
      const keywordsData = await keywordsRes.json();
      const keywords = keywordsData.keywords || [];

      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ paragraphs, keywords }),
      });

      if (!analyzeRes.ok) {
        throw new Error('Failed to analyze video');
      }

      const analyzeData = await analyzeRes.json();
      const { clips } = analyzeData;

      setStage('complete');

      const state: ClipIQState = {
        clips,
        videoPath,
        videoId,
        title,
      };

      sessionStorage.setItem('clipiq_state', JSON.stringify(state));
      sessionStorage.setItem(
        'clipiq_config',
        JSON.stringify({
          burnCaptions,
          captionFontSize,
          cropPosition,
          durationSeconds,
        })
      );

      setTimeout(() => {
        router.push('/review');
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setStage('idle');
    }
  };

  if (!videoId) {
    return null;
  }

  return (
    <main style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 700, color: 'var(--text)' }}>
        Configure Analysis
      </h1>
      <p style={{ margin: '0 0 32px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
        {title}
      </p>
      <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
        Choose how you want your clips formatted. These settings apply to all clips from this video.
      </p>

      <div
        style={{
          position: 'relative',
          paddingBottom: '56.25%',
          backgroundColor: '#000',
          borderRadius: '8px',
          overflow: 'hidden',
          marginBottom: '24px',
        }}
      >
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}`}
          title={title}
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

      {error && (
        <div
          style={{
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '13px',
          }}
        >
          {error}
        </div>
      )}

      {stage === 'idle' ? (
        <div
          style={{
            backgroundColor: 'var(--bg-light)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* Crop orientation - First */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
              Crop orientation
            </label>
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
              Where to position your subject in the 9:16 vertical frame (TikTok/Reels style)
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['left', 'center', 'right'] as const).map((pos) => (
                <button
                  key={pos}
                  onClick={() => setCropPosition(pos)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    backgroundColor: cropPosition === pos ? 'var(--primary)' : 'var(--bg)',
                    color: cropPosition === pos ? '#fff' : 'var(--text)',
                    border: `1px solid ${cropPosition === pos ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          {/* Caption controls - Side by side */}
          <div>
            <div style={{ marginBottom: '12px' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>
                Captions
              </p>
              <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Add transcript text as captions to your clips (recommended for platform algorithms)
              </p>
            </div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              {/* Burn captions checkbox */}
              <div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={burnCaptions}
                    onChange={(e) => setBurnCaptions(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  Add captions
                </label>
              </div>

            {/* Caption font size - Only shown when captions enabled */}
            {burnCaptions && (
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                  Font size: {captionFontSize}px
                </label>
                <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Recommended: 16–20px for mobile readability
                </p>
                <input
                  type="range"
                  min="14"
                  max="24"
                  value={captionFontSize}
                  onChange={(e) => setCaptionFontSize(parseInt(e.target.value, 10))}
                  style={{ width: '100%' }}
                />
              </div>
            )}
            </div>
          </div>

          <button
            onClick={handleStartAnalysis}
            style={{
              padding: '12px 24px',
              backgroundColor: 'var(--primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: '12px',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = 'var(--primary-dark)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = 'var(--primary)';
            }}
          >
            Start Analysis
          </button>
        </div>
      ) : (
        <ProcessingProgress stage={stage} />
      )}
    </main>
  );
}
