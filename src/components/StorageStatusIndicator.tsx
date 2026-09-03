import React, { useState, useEffect } from 'react';
import { Database, Check, RefreshCw, HardDrive } from 'lucide-react';

interface StorageStatusIndicatorProps {
  onClick?: () => void;
  lastSavedIso?: string | null;
  className?: string;
  isSaving?: boolean;
}

export const StorageStatusIndicator: React.FC<StorageStatusIndicatorProps> = ({
  onClick,
  lastSavedIso,
  className = '',
  isSaving = false,
}) => {
  const [timeAgo, setTimeAgo] = useState<string>('just now');

  useEffect(() => {
    const updateLabel = () => {
      if (!lastSavedIso) {
        setTimeAgo('synced');
        return;
      }
      const diffMs = Date.now() - new Date(lastSavedIso).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 5) {
        setTimeAgo('just now');
      } else if (diffSec < 60) {
        setTimeAgo(`${diffSec}s ago`);
      } else if (diffSec < 3600) {
        const mins = Math.floor(diffSec / 60);
        setTimeAgo(`${mins}m ago`);
      } else {
        setTimeAgo(new Date(lastSavedIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    };

    updateLabel();
    const interval = setInterval(updateLabel, 5000);
    return () => clearInterval(interval);
  }, [lastSavedIso]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group px-2.5 py-1 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-[11px] font-medium text-slate-300 hover:text-emerald-300 transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${className}`}
      title="Continuous IndexedDB & LocalStorage persistence active. Click to view revision history snapshots."
    >
      <div className="relative flex items-center justify-center">
        {isSaving ? (
          <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin" />
        ) : (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 group-hover:scale-125 transition-transform" />
            <span className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping opacity-60" />
          </>
        )}
      </div>

      <Database className="w-3 h-3 text-slate-400 group-hover:text-emerald-400 transition-colors" />

      <span className="hidden sm:inline font-mono text-[10px] text-slate-400 group-hover:text-slate-200">
        Saved {timeAgo}
      </span>
      <span className="sm:hidden font-mono text-[10px] text-emerald-400">
        Saved
      </span>
    </button>
  );
};
