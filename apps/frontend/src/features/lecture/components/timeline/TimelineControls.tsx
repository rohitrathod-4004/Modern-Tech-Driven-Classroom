import React from 'react';
import { useTimelineStore } from '../../../../infrastructure/stores/timelineStore';

export const TimelineControls: React.FC = () => {
  const userScrolled = useTimelineStore(state => state.userScrolled);
  const enableAutoScroll = useTimelineStore(state => state.enableAutoScroll);

  if (!userScrolled) return null;

  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 10,
      background: 'rgba(0,0,0,0.7)',
      padding: '0.5rem 1rem',
      borderRadius: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    }}>
      <span style={{ color: 'white', fontSize: '0.85rem' }}>Auto-scroll paused</span>
      <button 
        onClick={enableAutoScroll}
        style={{
          background: '#1890ff',
          color: 'white',
          border: 'none',
          padding: '0.25rem 0.75rem',
          borderRadius: '12px',
          fontSize: '0.85rem',
          cursor: 'pointer',
          fontWeight: 500
        }}
      >
        Resume Sync
      </button>
    </div>
  );
};
