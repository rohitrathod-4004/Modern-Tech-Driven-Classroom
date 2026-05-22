import type { TimelineNode } from '@classroom/shared';

/**
 * Performs an O(log n) binary search to find the active chunk index based on playback time.
 * Remains stateless, pure, and decoupled from React state.
 */
export const findActiveChunkIndex = (nodes: TimelineNode[], currentTime: number): number => {
  if (!nodes || nodes.length === 0) return -1;

  let left = 0;
  let right = nodes.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const node = nodes[mid];

    // Check if currentTime falls within this node's absolute bounds
    if (currentTime >= node.absoluteStartTime && currentTime < node.absoluteEndTime) {
      return mid;
    }

    if (currentTime < node.absoluteStartTime) {
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }

  return -1;
};
