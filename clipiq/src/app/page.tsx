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
      // Download
      setStage('downloading');
      const downloadRes = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const downloadData = await downloadRes.json();
      if (!downloadData.success) throw new Error(downloadData.error);
      const { videoId, videoPath, title } = downloadData;

      // Transcribe
      setStage('transcribing');
      const transcribeRes = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, videoPath }),
      });
      const transcribeData = await transcribeRes.json();
      if (!transcribeData.success) throw new Error(transcribeData.error);
      const { paragraphs } = transcribeData;

      // Analyze
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

      // Save to sessionStorage and redirect
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
    <div className="py-12">
      <div className="mb-12">
        <h2 className="text-4xl font-bold text-dark mb-3">Analyze Your Videos</h2>
        <p className="text-text-light text-lg">Paste a YouTube URL to find short-form clip opportunities for TikTok, Instagram Reels, and YouTube Shorts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center text-primary font-bold">1</div>
              <h3 className="text-xl font-semibold text-dark">Enter YouTube URL</h3>
            </div>
            <VideoInput onAnalyze={handleAnalyze} isLoading={loading} />
            <p className="text-text-light text-sm mt-4">Paste any public YouTube video link. We'll download, transcribe, and analyze it.</p>
          </div>

          <ProcessingProgress stage={stage} />
        </div>

        <div className="card p-8 h-fit sticky top-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center text-primary font-bold">2</div>
            <h3 className="text-lg font-semibold text-dark">Filter Keywords</h3>
          </div>
          <KeywordDrawer
            keywords={keywords}
            excluded={excluded}
            onToggleExcluded={handleToggleExcluded}
            onAddKeyword={handleAddKeyword}
            isLoading={loading}
          />
          <p className="text-text-light text-sm mt-4">Select keywords to focus the analysis. Excluded keywords won't be used.</p>
        </div>
      </div>
    </div>
  );
}
