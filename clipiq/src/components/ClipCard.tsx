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
    <div className="card p-6 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-bold text-dark">{clip.headline}</h3>
            <span className="text-xs font-bold px-3 py-1 bg-primary-light text-primary rounded-full whitespace-nowrap">
              {clip.confidence}%
            </span>
          </div>
          <p className="text-text-light text-sm">{clip.why_clip_worthy}</p>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 bg-primary text-white rounded-lg whitespace-nowrap ml-4">
          {clip.type}
        </span>
      </div>

      <div className="bg-primary-light rounded-lg p-4 mb-4 border-l-4 border-primary">
        <p className="text-dark italic text-sm">"{clip.hook}"</p>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4 text-sm">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-text-light text-xs font-semibold uppercase tracking-wide">Duration</p>
          <p className="text-dark font-bold text-lg mt-1">{clip.duration_seconds}s</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 col-span-2">
          <p className="text-text-light text-xs font-semibold uppercase tracking-wide">Timestamp</p>
          <p className="text-dark font-mono text-sm mt-1">{formatTime(clip.start_ms)} → {formatTime(clip.end_ms)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-text-light text-xs font-semibold uppercase tracking-wide">Confidence</p>
          <p className="text-dark font-bold text-lg mt-1">{clip.confidence}%</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-text-light text-xs font-semibold uppercase tracking-wide mb-2">Best For</p>
        <div className="flex flex-wrap gap-2">
          {clip.suggested_platforms.map((platform) => (
            <span key={platform} className="text-xs bg-primary-light text-primary font-medium px-3 py-1 rounded-full">
              {platform}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => onAccept(clip)}
          className="flex-1 btn-success flex items-center justify-center gap-2"
        >
          <CheckIcon /> Accept
        </button>
        <button
          onClick={() => onDecline(clip)}
          className="flex-1 btn-danger flex items-center justify-center gap-2"
        >
          <XIcon /> Decline
        </button>
        {onExtract && (
          <button
            onClick={() => onExtract(clip)}
            disabled={isExtracting}
            className="flex-1 btn-primary flex items-center justify-center gap-2"
          >
            <DownloadIcon /> {isExtracting ? 'Extracting...' : 'Extract'}
          </button>
        )}
      </div>
    </div>
  );
}
