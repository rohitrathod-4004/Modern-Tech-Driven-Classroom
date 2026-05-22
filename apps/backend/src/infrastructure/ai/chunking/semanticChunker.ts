import { TranscriptChunk, ITranscriptChunk } from '../../../models/TranscriptChunk';

export interface SemanticBlock {
  text: string;
  absoluteStartTime: number;
  absoluteEndTime: number;
  startChunkId: string;
}

export async function aggregateLectureTranscript(lectureId: string): Promise<SemanticBlock[]> {
  const chunks = await TranscriptChunk.find({ lectureId })
    .sort({ chunk_index: 1 })
    .lean();

  if (!chunks || chunks.length === 0) {
    return [];
  }

  // We group raw 3-second chunks into larger blocks for embedding and RAG.
  // Grouping by roughly 2-3 minutes (e.g., 120-180 seconds)
  const TARGET_BLOCK_DURATION_SEC = 120;
  
  const blocks: SemanticBlock[] = [];
  let currentBlockText = '';
  let currentStartTime = -1;
  let currentStartChunkId = '';
  
  for (const chunk of chunks) {
    if (currentStartTime === -1) {
      currentStartTime = chunk.start_time;
      currentStartChunkId = chunk._id.toString();
    }

    currentBlockText += (currentBlockText ? ' ' : '') + chunk.text.trim();
    
    // Calculate how long this block currently is
    const blockDuration = chunk.end_time - currentStartTime;

    // If block exceeds target duration, or if it's the last chunk, push to blocks
    if (blockDuration >= TARGET_BLOCK_DURATION_SEC || chunk === chunks[chunks.length - 1]) {
      blocks.push({
        text: currentBlockText,
        absoluteStartTime: currentStartTime,
        absoluteEndTime: chunk.end_time,
        startChunkId: currentStartChunkId,
      });

      // Reset
      currentBlockText = '';
      currentStartTime = -1;
    }
  }

  return blocks;
}
