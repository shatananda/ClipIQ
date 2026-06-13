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
    return <div className="text-center py-12">No clips selected.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="card" style={{ padding: '24px' }}>
        <h2 className="text-2xl font-bold text-dark mb-2">Summary</h2>
        <p className="text-gray-600 mb-4">{clips.length} clips selected for extraction</p>
        <button
          onClick={handleAnalyzeAnother}
          className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:opacity-90"
        >
          Analyze Another Video
        </button>
      </div>

      <div className="space-y-4">
        {clips.map((clip) => (
          <div key={clip.id} className="card" style={{ padding: '24px' }}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-dark">{clip.headline}</h3>
                <p className="text-gray-600 text-sm">{clip.type}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs font-medium uppercase">Duration</p>
                <p className="text-dark font-semibold">{clip.duration_seconds}s</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs font-medium uppercase">Confidence</p>
                <p className="text-dark font-semibold">{clip.confidence}%</p>
              </div>
            </div>

            <button
              onClick={() => handleDownload(`clip_${clip.id}_${clip.headline.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:opacity-90"
            >
              <DownloadIcon /> Download Clip
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
