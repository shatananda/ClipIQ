'use client';

import { useState } from 'react';
import { PlayIcon, LoadingIcon } from './Icons';

interface VideoInputProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
}

export default function VideoInput({ onAnalyze, isLoading }: VideoInputProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onAnalyze(url);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <input
          type="text"
          placeholder="https://youtu.be/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isLoading}
          className="w-full"
        />
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="btn-primary px-8 font-semibold"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {isLoading ? <LoadingIcon /> : <PlayIcon />}
            Analyze
          </button>
        </div>
      </div>
    </form>
  );
}
