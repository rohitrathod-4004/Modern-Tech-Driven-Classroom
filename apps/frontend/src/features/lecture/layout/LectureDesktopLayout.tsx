import React, { useState } from 'react';
import { Focus, Maximize2 } from 'lucide-react';
import { cn } from '../../../design-system/utils';

interface LectureDesktopLayoutProps {
  header: React.ReactNode;
  media: React.ReactNode;
  timeline: React.ReactNode;
  sidebar: React.ReactNode;
}

export const LectureDesktopLayout: React.FC<LectureDesktopLayoutProps> = ({ header, media, timeline, sidebar }) => {
  const [isStudyMode, setIsStudyMode] = useState(false);

  return (
    <div className="flex h-full flex-col max-w-[1600px] mx-auto relative overflow-hidden bg-background">
      {/* Cinematic Top Header Bar */}
      <div className="sticky top-0 z-50 flex items-start justify-between px-4 sm:px-6 lg:px-8 py-6 bg-background/60 backdrop-blur-xl border-b border-border/40 shadow-sm">
        <div className="flex-1">{header}</div>
        <button 
          onClick={() => setIsStudyMode(!isStudyMode)}
          className={cn(
            "ml-4 shrink-0 flex items-center px-4 py-2 text-sm font-medium rounded-lg border transition-all shadow-sm",
            isStudyMode 
              ? "bg-primary text-primary-foreground border-primary" 
              : "bg-surface hover:bg-surfaceHover text-foreground border-border"
          )}
        >
          {isStudyMode ? <Maximize2 className="w-4 h-4 mr-2" /> : <Focus className="w-4 h-4 mr-2" />}
          {isStudyMode ? 'Exit Study Mode' : 'Study Mode'}
        </button>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 pb-6 flex-1 min-h-0 flex flex-col relative z-10">
        <div className={cn(
          "flex-1 min-h-0 grid gap-8 mt-6 overflow-hidden transition-all duration-500",
        isStudyMode 
          ? "grid-cols-1 lg:grid-cols-[1fr]" // Full focus on study workspace (sidebar)
          : "grid-cols-1 lg:grid-cols-[400px_minmax(0,1fr)] xl:grid-cols-[480px_minmax(0,1fr)]"
      )}>
        {/* Left Column (Sticky Media + Sidebar) */}
        <div className={cn(
          "flex flex-col gap-6 overflow-y-auto pr-2 pb-8",
          isStudyMode ? "max-w-4xl mx-auto w-full" : ""
        )}>
          {media}
          {sidebar}
        </div>

        {/* Right Column (Timeline) - Hidden in Study Mode */}
        {!isStudyMode && (
          <div className="h-full bg-card/50 backdrop-blur-sm rounded-2xl border border-border/40 shadow-xl overflow-hidden flex flex-col transition-all duration-500 origin-right">
            {timeline}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
