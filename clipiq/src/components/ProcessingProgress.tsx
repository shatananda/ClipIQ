'use client';

interface ProcessingProgressProps {
  stage: 'idle' | 'downloading' | 'transcribing' | 'analyzing' | 'complete';
  estimatedWait?: number;
}

export default function ProcessingProgress({ stage, estimatedWait }: ProcessingProgressProps) {
  const stages = [
    { id: 'downloading', label: 'Downloading Video', duration: 30 },
    { id: 'transcribing', label: 'Transcribing Audio', duration: 60 },
    { id: 'analyzing', label: 'Analyzing with AI', duration: 20 },
  ];

  const currentIndex = stages.findIndex((s) => s.id === stage);
  const progress = ((currentIndex + 1) / stages.length) * 100;

  if (stage === 'idle' || stage === 'complete') {
    return null;
  }

  return (
    <div
      className="card"
      style={{
        padding: '24px',
        marginBottom: '24px',
        backgroundColor: 'rgba(91, 108, 246, 0.05)',
        borderColor: 'var(--primary)',
      }}
    >
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontWeight: '600', color: 'var(--text)' }}>
            {stages[currentIndex]?.label}
          </span>
          <span style={{ fontSize: '13px', color: 'var(--text-light)' }}>
            ~{estimatedWait || stages[currentIndex]?.duration || 0}s
          </span>
        </div>
        <div
          style={{
            width: '100%',
            height: '6px',
            borderRadius: '3px',
            backgroundColor: 'var(--border)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              backgroundColor: 'var(--primary)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', fontSize: '13px' }}>
        {stages.map((s, idx) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
                backgroundColor:
                  idx < currentIndex
                    ? 'var(--success)'
                    : idx === currentIndex
                      ? 'var(--primary)'
                      : 'var(--bg-gray)',
                color: idx < currentIndex || idx === currentIndex ? 'white' : 'var(--text-light)',
              }}
            >
              {idx < currentIndex ? '✓' : idx + 1}
            </div>
            <span style={{ color: 'var(--text)' }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
