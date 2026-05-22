import React from 'react';

export const LectureLoadingShell: React.FC = () => {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem', animation: 'pulse 1.5s infinite ease-in-out' }}>
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 0.3; }
            100% { opacity: 0.6; }
          }
        `}
      </style>
      
      {/* Header Skeleton */}
      <div style={{ marginBottom: '2rem', borderBottom: '1px solid #eaeaea', paddingBottom: '1.5rem' }}>
        <div style={{ width: '40%', height: '32px', background: '#f0f0f0', borderRadius: '4px', marginBottom: '1rem' }} />
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ width: '80px', height: '24px', background: '#f0f0f0', borderRadius: '4px' }} />
          <div style={{ width: '120px', height: '24px', background: '#f0f0f0', borderRadius: '4px' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexDirection: 'column' }}>
        {/* Mobile-first stack mimic */}
        <div style={{ width: '100%', height: '300px', background: '#f0f0f0', borderRadius: '8px' }} />
        
        <div style={{ flex: 1 }}>
          <div style={{ width: '100%', height: '60px', background: '#f0f0f0', borderRadius: '4px', marginBottom: '1rem' }} />
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ width: '100%', height: '80px', background: '#fcfcfc', border: '1px solid #f0f0f0', borderRadius: '8px' }} />
            <div style={{ width: '100%', height: '80px', background: '#fcfcfc', border: '1px solid #f0f0f0', borderRadius: '8px' }} />
            <div style={{ width: '100%', height: '80px', background: '#fcfcfc', border: '1px solid #f0f0f0', borderRadius: '8px' }} />
            <div style={{ width: '100%', height: '80px', background: '#fcfcfc', border: '1px solid #f0f0f0', borderRadius: '8px' }} />
          </div>
        </div>
      </div>
    </div>
  );
};
