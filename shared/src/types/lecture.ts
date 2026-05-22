export type LectureStatus = 'recording' | 'transcribing' | 'ai_processing' | 'ready' | 'failed';
export type AiStatus = 'pending' | 'queued' | 'summarizing' | 'embedding' | 'indexing' | 'generating_study_materials' | 'completed' | 'failed';

export interface LectureTopicDto {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  summary?: string;
}

export interface QuizQuestionDto {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface FlashcardDto {
  id: string;
  front: string;
  back: string;
}

export interface LectureDto {
  id: string;
  courseId: string;
  teacherId: string;
  title: string;
  status: LectureStatus;
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
  chunkCount: number;
  transcriptionLanguage?: string;
  
  // Phase 3A: AI Extensions
  aiStatus?: AiStatus;
  summary?: {
    short: string;
    detailed: string;
  };
  topics?: LectureTopicDto[];
  processingError?: {
    stage: string;
    message: string;
    timestamp: string;
  };
  
  createdAt: string;
  updatedAt: string;
}
