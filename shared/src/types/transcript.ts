export interface TranscriptChunkDto {
  id: string;
  lectureId: string;
  courseId: string;
  chunkIndex: number;
  text: string;
  startTime: number;
  endTime: number;
  confidenceScore?: number;
  latencyMs?: number;
  processingProvider?: string;
  createdAt: string;
  updatedAt: string;
}
