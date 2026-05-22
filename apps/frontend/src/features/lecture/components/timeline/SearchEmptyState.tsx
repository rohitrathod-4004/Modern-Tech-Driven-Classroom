import React from 'react';
import { useTimelineStore } from '../../../../infrastructure/stores/timelineStore';

export const SearchEmptyState: React.FC = () => {
  const searchQuery = useTimelineStore(state => state.searchQuery);
  const searchResults = useTimelineStore(state => state.searchResults);

  if (searchQuery.trim().length === 0 || searchResults.length > 0) return null;

  return (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#888', background: '#fafafa', fontStyle: 'italic' }}>
      No matching transcript segments found.
    </div>
  );
};
