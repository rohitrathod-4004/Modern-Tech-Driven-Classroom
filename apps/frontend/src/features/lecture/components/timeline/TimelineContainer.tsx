import React from 'react';
import { SmartTimeline } from './SmartTimeline';
import { SearchNavigator } from './SearchNavigator';
import { SearchEmptyState } from './SearchEmptyState';
import { TimelineControls } from './TimelineControls';

import type { VirtuosoHandle } from 'react-virtuoso';

interface TimelineContainerProps {
  courseId: string;
  lectureId: string;
  virtuosoRef: React.RefObject<VirtuosoHandle | null>;
}

export const TimelineContainer: React.FC<TimelineContainerProps> = ({ courseId, lectureId, virtuosoRef }) => {
  return (
    <div className="flex flex-col h-full w-full border-t lg:border-t-0 lg:border-l border-border bg-card">
      <SearchNavigator virtuosoRef={virtuosoRef} />
      
      <div className="relative flex-1 overflow-hidden">
        <SmartTimeline courseId={courseId} lectureId={lectureId} virtuosoRef={virtuosoRef} />
        <SearchEmptyState />
        <TimelineControls />
      </div>
    </div>
  );
};
