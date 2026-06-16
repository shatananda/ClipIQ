'use client';

import { useState, useEffect } from 'react';

interface Props {
  startMs: number;
  endMs: number;
  durationMs: number;
  onChange: (startMs: number, endMs: number) => void;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = Math.floor((ms % 1000) / 100);
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds}`;
}

function parseTime(str: string): number {
  const parts = str.match(/(\d+):(\d+)(?:\.(\d))?/);
  if (!parts) return 0;
  const minutes = parseInt(parts[1], 10);
  const seconds = parseInt(parts[2], 10);
  const tenths = parts[3] ? parseInt(parts[3], 10) : 0;
  return (minutes * 60 + seconds) * 1000 + tenths * 100;
}

export function TimeAdjuster({ startMs, endMs, durationMs, onChange }: Props) {
  const [localStart, setLocalStart] = useState(formatTime(startMs));
  const [localEnd, setLocalEnd] = useState(formatTime(endMs));

  useEffect(() => {
    setLocalStart(formatTime(startMs));
    setLocalEnd(formatTime(endMs));
  }, [startMs, endMs]);

  const handleStartChange = (newStart: string) => {
    setLocalStart(newStart);
    const parsed = parseTime(newStart);
    if (parsed >= 0 && parsed < parseTime(localEnd)) {
      onChange(parsed, parseTime(localEnd));
    }
  };

  const handleEndChange = (newEnd: string) => {
    setLocalEnd(newEnd);
    const parsed = parseTime(newEnd);
    if (parsed > parseTime(localStart) && parsed <= durationMs) {
      onChange(parseTime(localStart), parsed);
    }
  };

  const handleStartSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = parseInt(e.target.value, 10);
    if (newStart < parseTime(localEnd)) {
      setLocalStart(formatTime(newStart));
      onChange(newStart, parseTime(localEnd));
    }
  };

  const handleEndSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = parseInt(e.target.value, 10);
    if (newEnd > parseTime(localStart)) {
      setLocalEnd(formatTime(newEnd));
      onChange(parseTime(localStart), newEnd);
    }
  };

  const startParsed = parseTime(localStart);
  const endParsed = parseTime(localEnd);

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-light)',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        padding: '12px',
        marginTop: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div>
        <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>
          Start Time
        </label>
        <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
          <input
            type="text"
            value={localStart}
            onChange={(e) => handleStartChange(e.target.value)}
            placeholder="M:SS.s"
            style={{
              width: '80px',
              padding: '6px',
              fontSize: '13px',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              fontFamily: 'monospace',
            }}
          />
          <input
            type="range"
            min="0"
            max={durationMs}
            value={startParsed}
            onChange={handleStartSlider}
            style={{ flex: 1 }}
          />
        </div>
      </div>

      <div>
        <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>
          End Time
        </label>
        <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
          <input
            type="text"
            value={localEnd}
            onChange={(e) => handleEndChange(e.target.value)}
            placeholder="M:SS.s"
            style={{
              width: '80px',
              padding: '6px',
              fontSize: '13px',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              fontFamily: 'monospace',
            }}
          />
          <input
            type="range"
            min="0"
            max={durationMs}
            value={endParsed}
            onChange={handleEndSlider}
            style={{ flex: 1 }}
          />
        </div>
      </div>

      <div
        style={{
          fontSize: '12px',
          color: 'var(--text-secondary)',
          paddingTop: '4px',
          borderTop: '1px solid var(--border)',
        }}
      >
        Duration: {formatTime(endParsed - startParsed)}
      </div>
    </div>
  );
}
