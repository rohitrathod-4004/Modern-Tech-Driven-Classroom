export type TimelineNodeType = 'transcript' | 'topic' | 'summary' | 'insight' | 'search_marker';

export interface BaseTimelineNode {
  id: string;
  type: TimelineNodeType;
  absoluteStartTime: number;
  absoluteEndTime: number;
}

export interface TranscriptTimelineNode extends BaseTimelineNode {
  type: 'transcript';
  text: string;
  chunkIndex: number;
  confidenceScore?: number;
}

// Polymorphic timeline support for future AI integration
export interface TopicTimelineNode extends BaseTimelineNode {
  type: 'topic';
  title: string;
  summary: string;
}

export type TimelineNode = TranscriptTimelineNode | TopicTimelineNode;

export interface PaginatedTimelineResponse {
  nodes: TimelineNode[];
  nextCursor: number | null;
  hasMore: boolean;
  totalChunks: number;
}
