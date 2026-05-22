import React from 'react';
import { LectureStatusBadge } from './LectureStatusBadge';

interface LectureMetadataProps {
  lecture: any;
}

import { Clock, Layers, Calendar } from 'lucide-react';

export const LectureMetadata: React.FC<LectureMetadataProps> = ({ lecture }) => {
  return (
    <div className="flex flex-wrap gap-4 items-center text-sm text-muted-foreground">
      <LectureStatusBadge status={lecture.status} />
      
      <div className="flex items-center gap-1.5">
        <Clock className="w-4 h-4" />
        <span className="font-medium text-foreground">Duration:</span>
        <span>{lecture.durationSeconds ? `${Math.floor(lecture.durationSeconds / 60)}m ${lecture.durationSeconds % 60}s` : 'Ongoing'}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <Layers className="w-4 h-4" />
        <span className="font-medium text-foreground">Chunks:</span>
        <span>{lecture.chunkCount}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <Calendar className="w-4 h-4" />
        <span className="font-medium text-foreground">Recorded:</span>
        <span>{new Date(lecture.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
};
