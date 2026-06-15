'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ClipCard from '@/components/ClipCard';
import VideoPreviewModal from '@/components/VideoPreviewModal';
import { TimeAdjuster } from '@/components/TimeAdjuster';
import { ClipIQState, ClipSuggestion, CropPosition, ApprovedClip } from '@/types';

export default function ReviewPage() {
  const router = useRouter();
  const [state, setState] = useState<ClipIQState | null>(null);
  const [approved, setApproved] = useState<Set<number>>(new Set());
  const [cropPositions, setCropPositions] = useState<Record<number, CropPosition>>({});
  const [captionSettings, setCaptionSettings] = useState<Record<number, boolean>>({});
  const [fontSizes, setFontSizes] = useState<Record<number, number>>({});
  const [adjustedTimes, setAdjustedTimes] = useState<Record<number, { start_ms: number; end_ms: number }>>({});
  const [previewingClip, setPreviewingClip] = useState<ClipSuggestion | null>(null);
  const [videoDurationSeconds, setVideoDurationSeconds] = useState(0);

  useEffect(() => {
    const clipiqState = sessionStorage.getItem('clipiq_state');
    if (!clipiqState) {
      router.push('/');
      return;
    }
    const parsedState = JSON.parse(clipiqState);
    setState(parsedState);

    const config = sessionStorage.getItem('clipiq_config');
    if (config) {
      const parsedConfig = JSON.parse(config);
      setVideoDurationSeconds(parsedConfig.durationSeconds || 0);
    }

    const initialAdjustedTimes: Record<number, { start_ms: number; end_ms: number }> = {};
    parsedState.clips.forEach((clip: ClipSuggestion) => {
      initialAdjustedTimes[clip.id] = {
        start_ms: clip.start_ms,
        end_ms: clip.end_ms,
      };
    });
    setAdjustedTimes(initialAdjustedTimes);
  }, [router]);

  const handlePreview = (clip: ClipSuggestion) => {
    setPreviewingClip(clip);
  };

  const handleApprove = (isApproved: boolean, cropPosition: CropPosition, burnCaptions: boolean = true, captionFontSize: number = 18) => {
    if (!previewingClip) return;
    console.log('handleApprove called:', { clipId: previewingClip.id, isApproved, cropPosition, burnCaptions, captionFontSize });
    const newApproved = new Set(approved);
    if (isApproved) {
      newApproved.add(previewingClip.id);
      const newCropPositions = { ...cropPositions, [previewingClip.id]: cropPosition };
      const newCaptionSettings = { ...captionSettings, [previewingClip.id]: burnCaptions };
      const newFontSizes = { ...fontSizes, [previewingClip.id]: captionFontSize };
      console.log('Setting cropPositions:', newCropPositions);
      console.log('Setting captionSettings:', newCaptionSettings);
      console.log('Setting fontSizes:', newFontSizes);
      setCropPositions(newCropPositions);
      setCaptionSettings(newCaptionSettings);
      setFontSizes(newFontSizes);
    } else {
      newApproved.delete(previewingClip.id);
    }
    setApproved(newApproved);
  };

  const handleProceedToDownload = () => {
    if (!state) return;
    const approvedClips: ApprovedClip[] = state.clips.filter((clip) => approved.has(clip.id)).map((clip) => {
      const adjusted = adjustedTimes[clip.id] || { start_ms: clip.start_ms, end_ms: clip.end_ms };
      return {
        ...clip,
        start_ms: adjusted.start_ms,
        end_ms: adjusted.end_ms,
        duration_seconds: (adjusted.end_ms - adjusted.start_ms) / 1000,
        cropPosition: cropPositions[clip.id] || 'center',
        burnCaptions: captionSettings[clip.id] !== false,
        captionFontSize: fontSizes[clip.id] || 18
      };
    });
    sessionStorage.setItem('approved_clips', JSON.stringify(approvedClips));
    sessionStorage.setItem('clipiq_state', JSON.stringify(state));
    localStorage.setItem(`clipiq_status_${state.videoId}`, 'analyzed');
    router.push('/download');
  };

  if (!state) {
    return <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-light)' }}>Loading...</div>;
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: 'var(--text)' }}>
            {state.title}
          </h2>
          <p style={{ color: 'var(--text-light)', marginBottom: '16px' }}>
            Preview clips and approve the ones you want to download
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
              onClick={handleProceedToDownload}
              disabled={approved.size === 0}
              style={{
                padding: '10px 16px',
                backgroundColor: approved.size === 0 ? 'var(--text-light)' : 'var(--primary)',
                color: 'white',
                borderRadius: '8px',
                fontWeight: '500',
                border: 'none',
                cursor: approved.size === 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseOver={(e) => {
                if (approved.size > 0) (e.target as HTMLButtonElement).style.opacity = '0.9';
              }}
              onMouseOut={(e) => {
                if (approved.size > 0) (e.target as HTMLButtonElement).style.opacity = '1';
              }}
            >
              Go to Download ({approved.size} clips)
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {state.clips.map((clip) => (
            <ClipCard
              key={clip.id}
              clip={clip}
              onPreview={handlePreview}
              isApproved={approved.has(clip.id)}
              adjustedTimes={adjustedTimes[clip.id]}
              videoDurationSeconds={videoDurationSeconds}
              onTimeChange={(startMs, endMs) => {
                setAdjustedTimes({
                  ...adjustedTimes,
                  [clip.id]: { start_ms: startMs, end_ms: endMs },
                });
              }}
            />
          ))}
        </div>
      </div>

      {previewingClip && (
        <VideoPreviewModal
          clip={previewingClip}
          videoId={state.videoId}
          isApproved={approved.has(previewingClip.id)}
          cropPosition={cropPositions[previewingClip.id] || 'center'}
          burnCaptions={captionSettings[previewingClip.id] !== false}
          captionFontSize={fontSizes[previewingClip.id] || 18}
          onApprove={handleApprove}
          onClose={() => setPreviewingClip(null)}
        />
      )}
    </>
  );
}
