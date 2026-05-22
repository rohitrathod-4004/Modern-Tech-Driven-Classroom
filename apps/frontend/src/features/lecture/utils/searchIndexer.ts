import type { TimelineNode } from '@classroom/shared';
import { isTranscriptNode } from '../types/timeline';

/**
 * Precomputes normalized searchable strings.
 * Ensures O(n) search while preserving absolute timeline array mapping.
 */
export const buildSearchIndex = (nodes: TimelineNode[]): string[] => {
  return nodes.map(node => {
    if (isTranscriptNode(node)) {
      return node.text.toLowerCase().replace(/\s+/g, ' ').trim();
    }
    // Return empty string for non-searchable nodes (like Topic nodes in the future)
    return '';
  });
};
