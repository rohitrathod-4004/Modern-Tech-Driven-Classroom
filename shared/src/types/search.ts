export type SearchResultType = 'lecture' | 'topic' | 'transcript';

export interface SearchResultDto {
  id: string;
  type: SearchResultType;
  title: string;
  courseId?: string;
  lectureId: string;
  timestamp?: number;
  preview?: string; // HTML string with <mark> tags
  score?: number;
}
