'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import VideoInput from '@/components/VideoInput';
import ProcessingProgress from '@/components/ProcessingProgress';
import KeywordDrawer from '@/components/KeywordDrawer';
import { ClipIQState } from '@/types';

type ProcessingStage = 'idle' | 'downloading' | 'transcribing' | 'analyzing' | 'complete';

export default function Home() {
  const router = useRouter();
  const [keywords, setKeywords] = useState<string[]>([]);
  const [excluded, setExcluded] = useState<string[]>([]);
  const [stage, setStage] = useState<ProcessingStage>('idle');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadKeywords();
  }, []);

  const loadKeywords = async () => {
    try {
      const res = await fetch('/api/keywords');
      const data = await res.json();
      setKeywords(data.keywords || []);
      const excludedRes = await fetch('/api/keywords/excluded');
      const excludedData = await excludedRes.json();
      setExcluded(excludedData.excluded || []);
    } catch (e) {
      console.error('Error loading keywords:', e);
    }
  };

  const handleToggleExcluded = async (keyword: string) => {
    try {
      await fetch('/api/keywords/exclude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword }),
      });
      const newExcluded = excluded.includes(keyword)
        ? excluded.filter((k) => k !== keyword)
        : [...excluded, keyword];
      setExcluded(newExcluded);
    } catch (e) {
      console.error('Error toggling keyword:', e);
    }
  };

  const handleAddKeyword = async (keyword: string) => {
    try {
      await fetch('/api/keywords/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword }),
      });
      if (!keywords.includes(keyword)) {
        setKeywords([...keywords, keyword]);
      }
    } catch (e) {
      console.error('Error adding keyword:', e);
    }
  };

  const handleAnalyze = async (url: string) => {
    setLoading(true);
    setStage('downloading');

    try {
      const downloadRes = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const downloadData = await downloadRes.json();
      if (!downloadData.success) throw new Error(downloadData.error);
      const { videoId, videoPath, title } = downloadData;

      setStage('transcribing');
      const transcribeRes = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, videoPath }),
      });
      const transcribeData = await transcribeRes.json();
      if (!transcribeData.success) throw new Error(transcribeData.error);
      const { paragraphs } = transcribeData;

      setStage('analyzing');
      const activeKeywords = keywords.filter((k) => !excluded.includes(k));
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paragraphs, keywords: activeKeywords }),
      });
      const analyzeData = await analyzeRes.json();
      if (!analyzeData.success) throw new Error(analyzeData.error);
      const { clips } = analyzeData;

      const state: ClipIQState = { clips, videoPath, videoId, title };
      sessionStorage.setItem('clipiq_state', JSON.stringify(state));

      setStage('complete');
      router.push('/review');
    } catch (error) {
      console.error('Pipeline error:', error);
      setStage('idle');
      alert(error instanceof Error ? error.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card p-8 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Clip Opportunities</h1>
        <p className="text-gray-600 text-sm">Paste a YouTube URL and we'll analyze it to find the best clips for TikTok, Instagram Reels, and YouTube Shorts.</p>
      </div>

      <div className="card p-8 mb-6">
        <label className="block text-sm font-semibold text-gray-900 mb-3">YouTube URL</label>
        <VideoInput onAnalyze={handleAnalyze} isLoading={loading} />
      </div>

      <ProcessingProgress stage={stage} />

      {keywords.length > 0 && (
        <div className="card p-8">
          <label className="block text-sm font-semibold text-gray-900 mb-3">Keywords (Optional)</label>
          <KeywordDrawer
            keywords={keywords}
            excluded={excluded}
            onToggleExcluded={handleToggleExcluded}
            onAddKeyword={handleAddKeyword}
            isLoading={loading}
          />
        </div>
      )}
    </div>
  );
}
