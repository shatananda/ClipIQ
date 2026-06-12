'use client';

import { useState } from 'react';
import { ChevronDownIcon } from './Icons';

interface KeywordDrawerProps {
  keywords: string[];
  excluded: string[];
  onToggleExcluded: (keyword: string) => void;
  onAddKeyword: (keyword: string) => void;
  isLoading?: boolean;
}

export default function KeywordDrawer({
  keywords,
  excluded,
  onToggleExcluded,
  onAddKeyword,
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
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between font-medium text-dark transition"
      >
        <span>Keywords ({activeKeywords.length} active)</span>
        <ChevronDownIcon />
      </button>

      {isOpen && (
        <div className="p-4 bg-white border-t border-gray-300">
          <form onSubmit={handleAddKeyword} className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add custom keyword..."
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                className="flex-1 px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary text-dark"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded font-medium hover:opacity-90"
              >
                +
              </button>
            </div>
          </form>

          <div className="max-h-64 overflow-y-auto">
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword) => {
                const isExcluded = excluded.includes(keyword);
                return (
                  <button
                    key={keyword}
                    onClick={() => onToggleExcluded(keyword)}
                    disabled={isLoading}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                      isExcluded
                        ? 'bg-gray-200 text-gray-600 line-through'
                        : 'bg-blue-100 text-primary hover:bg-blue-200'
                    } disabled:opacity-50`}
                  >
                    {keyword}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
