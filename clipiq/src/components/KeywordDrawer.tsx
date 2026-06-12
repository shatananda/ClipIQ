'use client';

import { useState } from 'react';
import { ChevronDownIcon, XIcon } from './Icons';

interface KeywordDrawerProps {
  keywords: string[];
  excluded: string[];
  onToggleExcluded: (keyword: string) => void;
  onAddKeyword: (keyword: string) => void;
  onDeleteKeyword?: (keyword: string) => void;
  isLoading?: boolean;
}

export default function KeywordDrawer({
  keywords,
  excluded,
  onToggleExcluded,
  onAddKeyword,
  onDeleteKeyword,
  isLoading,
}: KeywordDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newKeyword.trim()) {
      onAddKeyword(newKeyword);
      setNewKeyword('');
    }
  };

  const activeKeywords = keywords.filter((k) => !excluded.includes(k));

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between font-medium transition"
        style={{ backgroundColor: '#f9f7f3', borderBottom: '1px solid #e8e0d0' }}
      >
        <span style={{ color: '#1a1a1a' }}>Keywords ({activeKeywords.length} active)</span>
        <ChevronDownIcon />
      </button>

      {isOpen && (
        <div className="p-4 bg-white">
          <form onSubmit={handleAddKeyword} className="mb-4 pb-4" style={{ borderBottom: '1px solid #e8e0d0' }}>
            <label className="block text-xs font-semibold mb-2" style={{ color: '#666' }}>ADD KEYWORD</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g., chakra, mudra..."
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                className="flex-1"
              />
              <button
                type="submit"
                className="btn-primary px-4"
              >
                Add
              </button>
            </div>
          </form>

          <div className="max-h-80 overflow-y-auto">
            <div className="flex flex-wrap gap-2">
              {keywords.length === 0 ? (
                <p style={{ color: '#999', fontSize: '14px' }}>No keywords yet</p>
              ) : (
                keywords.map((keyword) => {
                  const isExcluded = excluded.includes(keyword);
                  return (
                    <div
                      key={keyword}
                      className="flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition group"
                      style={{
                        backgroundColor: isExcluded ? '#f0f0f0' : '#fef3e6',
                        color: isExcluded ? '#999' : '#dc9f72',
                        textDecoration: isExcluded ? 'line-through' : 'none',
                      }}
                    >
                      <span
                        className="cursor-pointer flex-1"
                        onClick={() => onToggleExcluded(keyword)}
                        style={{ cursor: 'pointer' }}
                      >
                        {keyword}
                      </span>
                      {onDeleteKeyword && (
                        <button
                          onClick={() => onDeleteKeyword(keyword)}
                          disabled={isLoading}
                          className="opacity-0 group-hover:opacity-100 transition"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title="Delete keyword"
                        >
                          <XIcon />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
