import type { TimelineNode, TranscriptTimelineNode } from '@classroom/shared';

// Frontend type guards to safely interact with polymorphic nodes
export const isTranscriptNode = (node: TimelineNode): node is TranscriptTimelineNode => {
  return node.type === 'transcript';
};
