import React from 'react';

interface EmptyLectureStateProps {
  title: string;
  description: string;
}

export const EmptyLectureState: React.FC<EmptyLectureStateProps> = ({ title, description }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 2rem',
      background: '#fafafa',
      border: '1px dashed #d9d9d9',
      borderRadius: '8px',
      color: '#595959',
      textAlign: 'center'
    }}>
      <h3 style={{ margin: '0 0 0.5rem 0', color: '#262626' }}>{title}</h3>
      <p style={{ margin: 0, fontSize: '0.95rem' }}>{description}</p>
    </div>
  );
};
