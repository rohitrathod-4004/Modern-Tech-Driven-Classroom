import React from 'react';

interface LectureMobileLayoutProps {
  header: React.ReactNode;
  media: React.ReactNode;
  timeline: React.ReactNode;
  sidebar: React.ReactNode;
}

export const LectureMobileLayout: React.FC<LectureMobileLayoutProps> = ({ header, media, timeline, sidebar }) => {
  return (
    <div className="flex flex-col px-4 py-6 gap-6 w-full max-w-full overflow-x-hidden">
      {header}
      
      {/* Pinned media player */}
      <div className="sticky top-0 z-50 bg-background -mx-4 px-4 pb-4 border-b border-border shadow-sm">
        {media}
      </div>

      <div className="h-[50vh] min-h-[400px] border border-border rounded-xl bg-card overflow-hidden">
        {timeline}
      </div>

      <div className="mt-4">
        {sidebar}
      </div>
    </div>
  );
};
