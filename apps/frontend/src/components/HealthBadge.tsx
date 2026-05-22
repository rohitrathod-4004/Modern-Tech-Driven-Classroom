import React, { useEffect, useState } from 'react';
import { api } from '../infrastructure/api';
import { cn } from '../design-system/utils';

export const HealthBadge: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const { data } = await api.get('/health');
        setHealth(data);
        setError(false);
      } catch (err) {
        setError(true);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, []);

  if (import.meta.env.MODE === 'production') return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 p-2 bg-card border border-border rounded-lg shadow-lg text-xs font-mono select-none">
      <div className="flex items-center gap-1.5">
        <div className={cn("w-2 h-2 rounded-full", error || health?.server !== 'ok' ? "bg-red-500 animate-pulse" : "bg-green-500")} />
        <span className="text-muted-foreground">API</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className={cn("w-2 h-2 rounded-full", error || health?.mongodb !== 'ok' ? "bg-red-500 animate-pulse" : "bg-green-500")} />
        <span className="text-muted-foreground">DB</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className={cn("w-2 h-2 rounded-full", error || health?.redis !== 'ok' ? "bg-red-500 animate-pulse" : "bg-green-500")} />
        <span className="text-muted-foreground">Redis</span>
      </div>
    </div>
  );
};
