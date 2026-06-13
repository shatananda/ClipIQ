'use client';

import { useState } from 'react';

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
      <div className="flex flex-col gap-2">
        <input
          type="text"
          placeholder="https://youtu.be/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isLoading}
          className="w-full"
        />
        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="btn-primary w-full font-semibold"
        >
          {isLoading ? '⏳ Analyzing...' : '▶ Analyze'}
        </button>
      </div>
    </form>
  );
}
