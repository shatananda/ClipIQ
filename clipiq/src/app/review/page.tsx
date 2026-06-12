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
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-dark mb-2">{state.title}</h2>
        <p className="text-gray-600 mb-4">Review and accept clips to extract</p>
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
          >
            Analyze Another Video
          </button>
          <button
            onClick={handleProceedToSummary}
            className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:opacity-90"
          >
            Proceed to Summary ({accepted.length} clips)
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {state.clips.map((clip) => (
          <ClipCard
            key={clip.id}
            clip={clip}
            onAccept={handleAccept}
            onDecline={handleDecline}
            onExtract={handleExtract}
            isExtracting={extracting === clip.id}
          />
        ))}
      </div>
    </div>
  );
}
