'use client';

import { useState, useEffect } from 'react';

interface Props {
  suggestedStartMs: number;
  suggestedEndMs: number;
  adjustedStartMs: number;
  adjustedEndMs: number;
  durationMs: number;
  confidence?: number;
  platforms?: string[];
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

export function TimeSuggestionAdjuster({
  suggestedStartMs,
  suggestedEndMs,
  adjustedStartMs,
  adjustedEndMs,
  durationMs,
  confidence,
  platforms,
  onChange,
}: Props) {
  const [localStart, setLocalStart] = useState(formatTime(adjustedStartMs));
  const [localEnd, setLocalEnd] = useState(formatTime(adjustedEndMs));

  useEffect(() => {
    setLocalStart(formatTime(adjustedStartMs));
    setLocalEnd(formatTime(adjustedEndMs));
  }, [adjustedStartMs, adjustedEndMs]);

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
  const suggestedDuration = suggestedEndMs - suggestedStartMs;
  const adjustedDuration = endParsed - startParsed;
  const durationDiff = adjustedDuration - suggestedDuration;

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-light)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {/* AI Suggestion (Read-only) */}
      <div style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
        <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
          AI Suggestions
        </p>
        <div style={{ display: 'flex', gap: '16px', fontSize: '13px', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Start: </span>
              <span style={{ color: 'var(--text)', fontWeight: '600', fontFamily: 'monospace' }}>
                {formatTime(suggestedStartMs)}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>End: </span>
              <span style={{ color: 'var(--text)', fontWeight: '600', fontFamily: 'monospace' }}>
                {formatTime(suggestedEndMs)}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Duration: </span>
              <span style={{ color: 'var(--text)', fontWeight: '600', fontFamily: 'monospace' }}>
                {formatTime(suggestedDuration)}
              </span>
            </div>
          </div>

          {/* Right side: Confidence & Platforms */}
          {(confidence !== undefined || platforms) && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
              {confidence !== undefined && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                  <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    Confidence
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div
                      style={{
                        width: '50px',
                        backgroundColor: 'var(--bg-gray)',
                        borderRadius: '2px',
                        height: '4px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          backgroundColor: 'var(--primary)',
                          width: `${confidence}%`,
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text)', minWidth: '32px' }}>
                      {confidence}%
                    </span>
                  </div>
                </div>
              )}
              {platforms && platforms.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                  <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    Best For
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {platforms.map((platform) => (
                      <span
                        key={platform}
                        style={{
                          fontSize: '11px',
                          backgroundColor: 'rgba(91, 108, 246, 0.1)',
                          color: 'var(--primary)',
                          fontWeight: '600',
                          padding: '2px 6px',
                          borderRadius: '3px',
                        }}
                      >
                        {platform}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Adjustment Controls */}
      <div>
        <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
          Fine-tune timing
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Start Time */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text)', marginBottom: '6px', display: 'block' }}>
              Start Time
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
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

          {/* End Time */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text)', marginBottom: '6px', display: 'block' }}>
              End Time
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
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
        </div>

        {/* Duration Info */}
        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>Duration: </span>
            <span style={{ color: 'var(--text)', fontWeight: '600', fontFamily: 'monospace' }}>
              {formatTime(adjustedDuration)}
            </span>
          </div>
          {durationDiff !== 0 && (
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Difference: </span>
              <span style={{ color: durationDiff > 0 ? '#10b981' : '#ef4444', fontWeight: '600', fontFamily: 'monospace' }}>
                {durationDiff > 0 ? '+' : ''}{formatTime(durationDiff)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
