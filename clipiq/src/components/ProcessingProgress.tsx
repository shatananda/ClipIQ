'use client';

interface ProcessingProgressProps {
  stage: 'idle' | 'downloading' | 'transcribing' | 'analyzing' | 'complete';
  estimatedWait?: number;
}

export default function ProcessingProgress({ stage, estimatedWait }: ProcessingProgressProps) {
  const stages = [
    { id: 'downloading', label: 'Downloading Video', duration: 30 },
    { id: 'transcribing', label: 'Transcribing Audio', duration: 60 },
    { id: 'analyzing', label: 'Analyzing with Claude', duration: 20 },
  ];

  const currentIndex = stages.findIndex((s) => s.id === stage);
  const progress = ((currentIndex + 1) / stages.length) * 100;

  if (stage === 'idle' || stage === 'complete') {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-primary rounded-lg p-6 mb-6">
      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <span className="font-semibold text-dark">{stages[currentIndex]?.label}</span>
          <span className="text-sm text-gray-600">
            ~{estimatedWait || stages[currentIndex]?.duration || 0}s remaining
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-primary h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        {stages.map((s, idx) => (
          <div key={s.id} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                idx < currentIndex
                  ? 'bg-green-600 text-white'
                  : idx === currentIndex
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-600'
              }`}
            >
              {idx < currentIndex ? '✓' : idx + 1}
            </div>
            <span className="text-gray-700">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
