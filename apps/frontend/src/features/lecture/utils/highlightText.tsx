import type { ReactNode } from 'react';

/**
 * Safely injects <mark> tags around matching substrings.
 * Preserves original text casing.
 */
export const highlightText = (text: string, query: string): ReactNode => {
  if (!query.trim()) return text;

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <mark key={i} style={{ backgroundColor: '#ffea8a', padding: '0 2px', borderRadius: '2px' }}>
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};
