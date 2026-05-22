import React from 'react';

interface LectureStatusBadgeProps {
  status: string;
}

import { cn } from '../../../design-system/utils';

export const LectureStatusBadge: React.FC<LectureStatusBadgeProps> = ({ status }) => {
  const getStyles = () => {
    switch (status) {
      case 'recording':
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case 'transcribing':
      case 'ai_processing':
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case 'ready':
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case 'failed':
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 uppercase tracking-wide",
      getStyles()
    )}>
      {status.replace('_', ' ')}
    </span>
  );
};
