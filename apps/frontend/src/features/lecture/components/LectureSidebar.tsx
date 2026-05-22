import React, { useState, useEffect } from 'react';
import { SummaryPanel } from './future/SummaryPanel';
import { InsightsPanel } from './future/InsightsPanel';
import { RagAssistantPanel } from './future/RagAssistantPanel';
import { NotesPanel } from './future/NotesPanel';
import { QuizPanel } from './future/QuizPanel';
import { FlashcardsPanel } from './future/FlashcardsPanel';
import { cn } from '../../../design-system/utils';

export const LectureSidebar: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ai' | 'study' | 'notes'>(() => {
    return (localStorage.getItem('lectureSidebarTab') as 'ai' | 'study' | 'notes') || 'ai';
  });

  useEffect(() => {
    localStorage.setItem('lectureSidebarTab', activeTab);
  }, [activeTab]);

  return (
    <aside className="flex flex-col gap-4 w-full">
      <div className="flex bg-muted/50 p-1 rounded-lg overflow-x-auto hide-scrollbar">
        <button 
          onClick={() => setActiveTab('ai')}
          className={cn(
            "flex-none px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
            activeTab === 'ai' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          AI Insights
        </button>
        <button 
          onClick={() => setActiveTab('study')}
          className={cn(
            "flex-none px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
            activeTab === 'study' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Study Materials
        </button>
        <button 
          onClick={() => setActiveTab('notes')}
          className={cn(
            "flex-none px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
            activeTab === 'notes' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Personal Notes
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {activeTab === 'ai' && (
          <>
            <SummaryPanel />
            <InsightsPanel />
            <RagAssistantPanel />
          </>
        )}
        {activeTab === 'study' && (
          <>
            <FlashcardsPanel />
            <QuizPanel />
          </>
        )}
        {activeTab === 'notes' && (
          <NotesPanel />
        )}
      </div>
    </aside>
  );
};
