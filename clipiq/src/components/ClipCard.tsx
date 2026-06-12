'use client';

import { useState } from 'react';
import { ClipSuggestion } from '@/types';
import { CheckIcon, XIcon, DownloadIcon } from './Icons';

interface ClipCardProps {
  clip: ClipSuggestion;
  onAccept: (clip: ClipSuggestion) => void;
  onDecline: (clip: ClipSuggestion) => void;
  onExtract?: (clip: ClipSuggestion) => void;
  isExtracting?: boolean;
}

export default function ClipCard({ clip, onAccept, onDecline, onExtract, isExtracting }: ClipCardProps) {
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-dark mb-2">{clip.headline}</h3>
          <p className="text-gray-600 text-sm mb-3">{clip.why_clip_worthy}</p>
        </div>
        <span className="text-sm font-medium px-3 py-1 bg-blue-100 text-primary rounded-full whitespace-nowrap ml-4">
          {clip.type}
        </span>
      </div>

      <p className="text-dark italic mb-4">"{clip.hook}"</p>

      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
        <div>
          <p className="text-gray-500 text-xs font-medium uppercase">Duration</p>
          <p className="text-dark font-semibold">{clip.duration_seconds}s</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs font-medium uppercase">Timestamp</p>
          <p className="text-dark font-mono text-xs">{formatTime(clip.start_ms)} - {formatTime(clip.end_ms)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs font-medium uppercase">Confidence</p>
          <p className="text-dark font-semibold">{clip.confidence}%</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-gray-500 text-xs font-medium uppercase mb-2">Suggested Platforms</p>
        <div className="flex flex-wrap gap-2">
          {clip.suggested_platforms.map((platform) => (
            <span key={platform} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
              {platform}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onAccept(clip)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
        >
          <CheckIcon /> Accept
        </button>
        <button
          onClick={() => onDecline(clip)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
        >
          <XIcon /> Decline
        </button>
        {onExtract && (
          <button
            onClick={() => onExtract(clip)}
            disabled={isExtracting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition"
          >
            <DownloadIcon /> {isExtracting ? 'Extracting...' : 'Extract'}
          </button>
        )}
      </div>
    </div>
  );
}
