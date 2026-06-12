'use client';

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
    <div className="card overflow-hidden mb-6">
      {/* Header with type badge and duration */}
      <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold px-3 py-1 bg-primary rounded-full">
            {clip.type}
          </span>
          <span className="text-sm font-medium text-gray-300">
            {clip.duration_seconds}s
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Extract a {clip.duration_seconds}s clip</span>
          <span className="text-sm font-semibold">from {formatTime(clip.start_ms)} to {formatTime(clip.end_ms)}</span>
        </div>
      </div>

      {/* Main content */}
      <div className="p-6">
        {/* Headline */}
        <h3 className="text-2xl font-bold text-dark mb-3">{clip.headline}</h3>

        {/* Hook/Quote */}
        <div className="mb-4">
          <p className="text-dark italic text-base leading-relaxed">"{clip.hook}"</p>
        </div>

        {/* Why clip-worthy */}
        <p className="text-text-light text-sm mb-6">{clip.why_clip_worthy}</p>

        {/* Metadata row */}
        <div className="grid grid-cols-3 gap-4 mb-6 py-4 border-t border-b border-gray-200">
          <div>
            <p className="text-text-light text-xs font-semibold uppercase tracking-wider mb-2">Timestamp</p>
            <p className="text-dark font-mono font-semibold">{formatTime(clip.start_ms)} to {formatTime(clip.end_ms)}</p>
          </div>
          <div>
            <p className="text-text-light text-xs font-semibold uppercase tracking-wider mb-2">Confidence</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${clip.confidence}%` }}
                />
              </div>
              <span className="text-dark font-bold text-sm">{clip.confidence}%</span>
            </div>
          </div>
          <div>
            <p className="text-text-light text-xs font-semibold uppercase tracking-wider mb-2">Best For</p>
            <div className="flex flex-wrap gap-1">
              {clip.suggested_platforms.map((platform) => (
                <span key={platform} className="text-xs bg-primary-light text-primary font-medium px-2 py-0.5 rounded">
                  {platform}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => onAccept(clip)}
            className="flex-1 btn-success flex items-center justify-center gap-2 font-semibold"
          >
            <CheckIcon /> Accept
          </button>
          <button
            onClick={() => onDecline(clip)}
            className="flex-1 btn-danger flex items-center justify-center gap-2 font-semibold"
          >
            <XIcon /> Decline
          </button>
          {onExtract && (
            <button
              onClick={() => onExtract(clip)}
              disabled={isExtracting}
              className="flex-1 btn-primary flex items-center justify-center gap-2 font-semibold"
            >
              <DownloadIcon /> {isExtracting ? 'Extracting...' : 'Extract'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
