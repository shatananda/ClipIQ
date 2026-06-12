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
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '12px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'none',
          border: 'none',
          fontSize: '14px',
          fontWeight: '500',
          color: 'var(--text)',
          cursor: 'pointer',
          borderBottom: isOpen ? '1px solid var(--border)' : 'none',
        }}
      >
        <span>{activeKeywords.length} selected</span>
        <ChevronDownIcon />
      </button>

      {isOpen && (
        <div style={{ paddingTop: '12px' }}>
          <form onSubmit={handleAddKeyword} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Add keyword..."
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                type="submit"
                className="btn-primary"
                style={{ padding: '10px 16px' }}
              >
                Add
              </button>
            </div>
          </form>

          <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {keywords.length === 0 ? (
                <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>No keywords</p>
              ) : (
                keywords.map((keyword) => {
                  const isExcluded = excluded.includes(keyword);
                  return (
                    <div
                      key={keyword}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '500',
                        backgroundColor: isExcluded ? 'var(--bg-gray)' : 'var(--primary-light)',
                        color: isExcluded ? 'var(--text-light)' : 'white',
                        textDecoration: isExcluded ? 'line-through' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        group: 'group',
                      }}
                      className="group"
                    >
                      <span
                        onClick={() => onToggleExcluded(keyword)}
                        style={{ cursor: 'pointer', flex: 1 }}
                      >
                        {keyword}
                      </span>
                      {onDeleteKeyword && (
                        <button
                          onClick={() => onDeleteKeyword(keyword)}
                          disabled={isLoading}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            padding: '0',
                            display: 'flex',
                            alignItems: 'center',
                            opacity: isLoading ? '0.5' : '0.7',
                            transition: 'opacity 0.15s ease',
                          }}
                          className="group-hover:opacity-100"
                          title="Delete"
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
