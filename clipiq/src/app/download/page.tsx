'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ClipCard from '@/components/ClipCard';
import { ClipIQState, ClipSuggestion } from '@/types';
import { DownloadIcon } from '@/components/Icons';

interface ClipDownloadPrefs {
  mp4: boolean;
  metadata: boolean;
}

export default function DownloadPage() {
  const router = useRouter();
  const [state, setState] = useState<ClipIQState | null>(null);
  const [approvedClips, setApprovedClips] = useState<ClipSuggestion[]>([]);
  const [downloading, setDownloading] = useState<Set<number>>(new Set());
  const [allDownloading, setAllDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadPrefs, setDownloadPrefs] = useState<Record<number, ClipDownloadPrefs>>({});
  const [downloadProgress, setDownloadProgress] = useState<{ current: number; total: number } | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [extractedFiles, setExtractedFiles] = useState<Record<number, string>>({});

  useEffect(() => {
    const clipiqState = sessionStorage.getItem('clipiq_state');
    const approvedClipsStr = sessionStorage.getItem('approved_clips');

    if (!clipiqState || !approvedClipsStr) {
      router.push('/');
      return;
    }

    const parsedClips = JSON.parse(approvedClipsStr);
    setState(JSON.parse(clipiqState));
    setApprovedClips(parsedClips);

    // Initialize download preferences with both checked by default
    const prefs: Record<number, ClipDownloadPrefs> = {};
    parsedClips.forEach((clip: ClipSuggestion) => {
      prefs[clip.id] = { mp4: true, metadata: true };
    });
    setDownloadPrefs(prefs);
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
    if (!state) {
      setError('No video state available');
      return;
    }

    const prefs = downloadPrefs[clip.id];
    if (!prefs || (!prefs.mp4 && !prefs.metadata)) {
      return;
    }

    const newDownloading = new Set(downloading);
    newDownloading.add(clip.id);
    setDownloading(newDownloading);

    try {
      // Download metadata if selected
      if (prefs.metadata) {
        downloadMetadata(clip);
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      // Download MP4 if selected
      if (prefs.mp4) {
        // Use batch-extract for consistency (single clip in array)
        const res = await fetch('/api/batch-extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoPath: state.videoPath,
            clips: [clip],
            videoId: state.videoId,
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`API error: ${res.status} ${text.slice(0, 100)}`);
        }

        const data = await res.json();
        if (!data.success || data.extracted === 0) {
          throw new Error(data.error || data.results[0]?.error || 'Failed to extract clip');
        }

        const filename = data.results[0].filename;
        const videoUrl = `/api/serve-clip/${filename}`;
        const a = document.createElement('a');
        a.href = videoUrl;
        a.download = filename || `${clip.headline}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to download clip';
      console.error('Download error:', error);
      setError(`Error downloading "${clip.headline}": ${errorMsg}`);
    } finally {
      newDownloading.delete(clip.id);
      setDownloading(newDownloading);
    }
  };

  const handleDownloadAll = async () => {
    if (!state) {
      setError('No video state available');
      return;
    }

    setAllDownloading(true);
    setProcessingStatus('Generating clips...');
    setError(null);

    try {
      // Step 1: Batch extract all clips
      const extractRes = await fetch('/api/batch-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoPath: state.videoPath,
          clips: approvedClips,
          videoId: state.videoId,
        }),
      });

      if (!extractRes.ok) {
        const text = await extractRes.text();
        throw new Error(`Batch extraction failed: ${extractRes.status} ${text.slice(0, 100)}`);
      }

      const extractData = await extractRes.json();
      if (!extractData.success) {
        throw new Error(extractData.error || 'Batch extraction failed');
      }

      // Map filenames by clip ID
      const fileMap: Record<number, string> = {};
      extractData.results.forEach((result: any) => {
        if (result.success) {
          fileMap[result.id] = result.filename;
        }
      });
      setExtractedFiles(fileMap);

      // Step 2: Download all files
      setProcessingStatus(null);
      setDownloadProgress({ current: 0, total: approvedClips.length });

      for (let idx = 0; idx < approvedClips.length; idx++) {
        const clip = approvedClips[idx];
        setDownloadProgress({ current: idx + 1, total: approvedClips.length });

        const prefs = downloadPrefs[clip.id];
        if (!prefs || (!prefs.mp4 && !prefs.metadata)) {
          continue;
        }

        // Download metadata
        if (prefs.metadata) {
          downloadMetadata(clip);
          await new Promise((resolve) => setTimeout(resolve, 300));
        }

        // Download video if it was successfully extracted
        if (prefs.mp4 && fileMap[clip.id]) {
          const videoUrl = `/api/serve-clip/${fileMap[clip.id]}`;
          const a = document.createElement('a');
          a.href = videoUrl;
          a.download = fileMap[clip.id];
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Download all error:', error);
      setError(`Error: ${errorMsg}`);
    } finally {
      setAllDownloading(false);
      setDownloadProgress(null);
      setProcessingStatus(null);
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
      {error && (
        <div style={{
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          border: '1px solid rgba(220, 38, 38, 0.5)',
          borderRadius: '8px',
          padding: '16px',
          color: '#dc2626',
          fontSize: '14px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#dc2626',
                cursor: 'pointer',
                fontSize: '20px',
                padding: '0',
                width: '24px',
                height: '24px',
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}
      <div className="card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: 'var(--text)' }}>
          Download Your Clips
        </h2>
        <p style={{ color: 'var(--text-light)', marginBottom: '16px' }}>
          {approvedClips.length} clip{approvedClips.length !== 1 ? 's' : ''} approved and ready to download
        </p>

        {(processingStatus || downloadProgress) && (
          <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: 'rgba(91, 108, 246, 0.05)', borderRadius: '8px', border: '1px solid var(--primary)' }}>
            {processingStatus && (
              <>
                <p style={{ color: 'var(--text)', fontWeight: '500', marginBottom: '12px', fontSize: '15px' }}>
                  ⏳ Generating {approvedClips.length} clip{approvedClips.length !== 1 ? 's' : ''}...
                </p>
                <p style={{ color: 'var(--text-light)', fontSize: '13px', marginBottom: '8px' }}>
                  Extracting and encoding {approvedClips.length} video{approvedClips.length !== 1 ? 's' : ''} with captions. This may take a few minutes.
                </p>
                <p style={{ color: 'var(--text-light)', fontSize: '12px' }}>
                  Expected downloads: {approvedClips.length} MP4 video{approvedClips.length !== 1 ? 's' : ''} + {approvedClips.length} metadata file{approvedClips.length !== 1 ? 's' : ''}
                </p>
              </>
            )}
            {downloadProgress && !processingStatus && (
              <>
                <p style={{ color: 'var(--text)', fontWeight: '500', marginBottom: '8px', fontSize: '14px' }}>
                  📥 Downloading: {downloadProgress.current} of {downloadProgress.total} ({Math.round((downloadProgress.current / downloadProgress.total) * 100)}%)
                </p>
              </>
            )}
            <div style={{
              width: '100%',
              height: '6px',
              backgroundColor: 'var(--border)',
              borderRadius: '3px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: processingStatus ? '100%' : `${(downloadProgress?.current || 0) / (downloadProgress?.total || 1) * 100}%`,
                backgroundColor: 'var(--primary)',
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        )}

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
            <DownloadIcon /> {allDownloading ? 'Processing...' : `Download All (${approvedClips.length} clips)`}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '200px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={downloadPrefs[clip.id]?.mp4 ?? true}
                      onChange={(e) => {
                        setDownloadPrefs({
                          ...downloadPrefs,
                          [clip.id]: { ...(downloadPrefs[clip.id] || { mp4: true, metadata: true }), mp4: e.target.checked }
                        });
                      }}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span style={{ color: 'var(--text)', fontWeight: '500', fontSize: '14px' }}>Download MP4</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={downloadPrefs[clip.id]?.metadata ?? true}
                      onChange={(e) => {
                        setDownloadPrefs({
                          ...downloadPrefs,
                          [clip.id]: { ...(downloadPrefs[clip.id] || { mp4: true, metadata: true }), metadata: e.target.checked }
                        });
                      }}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span style={{ color: 'var(--text)', fontWeight: '500', fontSize: '14px' }}>Download Metadata</span>
                  </label>
                </div>
                <button
                  onClick={() => handleDownloadClip(clip)}
                  disabled={downloading.has(clip.id) || allDownloading || (!(downloadPrefs[clip.id]?.mp4 ?? true) && !(downloadPrefs[clip.id]?.metadata ?? true))}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: downloading.has(clip.id) ? 'var(--text-light)' : 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '500',
                    cursor: downloading.has(clip.id) || (!(downloadPrefs[clip.id]?.mp4 ?? true) && !(downloadPrefs[clip.id]?.metadata ?? true)) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseOver={(e) => {
                    if (!downloading.has(clip.id) && !allDownloading && ((downloadPrefs[clip.id]?.mp4 ?? true) || (downloadPrefs[clip.id]?.metadata ?? true))) {
                      (e.target as HTMLButtonElement).style.opacity = '0.9';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!downloading.has(clip.id) && !allDownloading) {
                      (e.target as HTMLButtonElement).style.opacity = '1';
                    }
                  }}
                >
                  <DownloadIcon /> {downloading.has(clip.id) ? 'Downloading...' : 'Download'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
