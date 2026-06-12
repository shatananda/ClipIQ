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

  const handleDeleteKeyword = async (keyword: string) => {
    try {
      await fetch('/api/keywords/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword }),
      });
      setKeywords(keywords.filter((k) => k !== keyword));
      setExcluded(excluded.filter((k) => k !== keyword));
    } catch (e) {
      console.error('Error deleting keyword:', e);
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
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '12px', color: 'var(--text)' }}>
          Analyze Your Videos
        </h2>
        <p style={{ fontSize: '15px', color: 'var(--text-light)', lineHeight: '1.6' }}>
          Paste a YouTube URL and we'll find the best short-form clips for TikTok, Instagram Reels, and YouTube Shorts.
        </p>
      </div>

      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '12px', color: 'var(--text)' }}>
          YouTube URL
        </label>
        <VideoInput onAnalyze={handleAnalyze} isLoading={loading} />
      </div>

      <ProcessingProgress stage={stage} />

      <div className="card" style={{ padding: '24px', marginTop: '24px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '12px', color: 'var(--text)' }}>
          Keywords
        </label>
        <KeywordDrawer
          keywords={keywords}
          excluded={excluded}
          onToggleExcluded={handleToggleExcluded}
          onAddKeyword={handleAddKeyword}
          onDeleteKeyword={handleDeleteKeyword}
          isLoading={loading}
        />
      </div>
    </div>
  );
}
