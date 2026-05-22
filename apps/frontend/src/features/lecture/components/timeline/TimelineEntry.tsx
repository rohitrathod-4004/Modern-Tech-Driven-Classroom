import React, { memo } from 'react';
import type { TimelineNode } from '@classroom/shared';
import { isTranscriptNode } from '../../types/timeline';
import { useTimelineStore } from '../../../../infrastructure/stores/timelineStore';
import { highlightText } from '../../utils/highlightText';
import { cn } from '../../../../design-system/utils';
import { BookmarkPlus } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { api } from '../../../../infrastructure/api';

export interface TimelineEntryProps {
  node: TimelineNode;
  isActive: boolean;
  searchQuery?: string;
  isActiveSearchResult?: boolean;
}

const TimelineEntryComponent: React.FC<TimelineEntryProps> = ({ 
  node, 
  isActive, 
  searchQuery = '', 
  isActiveSearchResult = false 
}) => {
  const seekTo = useTimelineStore(state => state.seekTo);
  const { lectureId } = useParams<{ lectureId: string }>();

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // Cast node to any because text only exists on transcript nodes but absoluteStartTime exists on both
      const nodeText = (node as any).text || '';
      await api.post(`/api/lectures/${lectureId}/bookmarks`, {
        timestamp: node.absoluteStartTime,
        title: nodeText.slice(0, 50) + '...',
        chunkId: node.id
      });
      // Optionally show a toast that bookmark was saved
    } catch (err) {
      console.error('Failed to save bookmark', err);
    }
  };

  // Support polymorphic nodes
  if (!isTranscriptNode(node)) {
    return (
      <div className="p-2 my-2 bg-muted rounded-md text-muted-foreground text-sm italic">
        Unsupported node type: {node.type}
      </div>
    );
  }

  // Formatting absolute time (e.g., 0 -> "0:00")
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      onClick={() => seekTo(node.absoluteStartTime)}
      className={cn(
        "group relative px-4 py-3 mb-1.5 rounded-lg cursor-pointer transition-all duration-300 border-l-[3px]",
        isActiveSearchResult 
          ? "bg-yellow-500/10 text-yellow-500 border-yellow-500 shadow-[0_0_15px_-3px_rgba(234,179,8,0.3)]" 
          : isActive 
            ? "bg-primary/5 text-foreground border-primary glow-subtle" 
            : "bg-transparent hover:bg-secondary/30 text-muted-foreground hover:text-foreground/90 border-transparent"
      )}
    >
      <div className="flex justify-between items-center mb-1">
        <div className="text-[11px] font-mono opacity-50 group-hover:opacity-100 transition-opacity tracking-wider">
          {formatTime(node.absoluteStartTime)}
        </div>
        <button 
          onClick={handleBookmark}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary p-1"
          title="Bookmark this timestamp"
        >
          <BookmarkPlus className="h-4 w-4" />
        </button>
      </div>
      <div className={cn(
        "leading-relaxed text-[15px] tracking-[0.01em]",
        isActiveSearchResult ? "font-medium" : ""
      )}>
        {searchQuery ? highlightText(node.text, searchQuery) : node.text}
      </div>
    </div>
  );
};

// CRITICAL: memo prevents re-rendering thousands of inactive chunks during playback sync
export const TimelineEntry = memo(TimelineEntryComponent, (prevProps, nextProps) => {
  return (
    prevProps.node.id === nextProps.node.id && 
    prevProps.isActive === nextProps.isActive &&
    prevProps.searchQuery === nextProps.searchQuery &&
    prevProps.isActiveSearchResult === nextProps.isActiveSearchResult
  );
});
