import { Settings, Flame, CheckCircle2, Loader2 } from 'lucide-react';
import { UserStats } from '../types';

interface TopbarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  hasActiveProblem: boolean;
  userStats: UserStats;
  onSubmit?: () => void;
  onRun?: () => void;
  isRunning?: boolean;
}

export default function Topbar({ currentView, onViewChange, hasActiveProblem, userStats, onSubmit, onRun, isRunning }: TopbarProps) {
  return (
    <header className="flex justify-between items-center w-full px-6 md:px-10 h-16 bg-surface/70 backdrop-blur-xl sticky top-0 z-50 shadow-[0_1px_0_0_rgba(255,255,255,0.05),0_24px_48px_rgba(6,14,32,0.4)]">
      <div className="flex items-center gap-10 md:gap-16 h-full">
        <div className="text-2xl tracking-tight font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-primary to-primary-container font-label">
          ScholarIDE
        </div>
        <nav className="hidden md:flex items-center gap-8 h-full">
          <button
            onClick={() => onViewChange('generate')}
            className={`font-label h-full flex items-center px-2 transition-all duration-300 hover:bg-white/5 ${
              currentView === 'generate'
                ? 'text-primary border-b-2 border-primary-container'
                : 'text-slate-400 hover:text-secondary'
            }`}
          >
            New Challenge
          </button>
          
          {hasActiveProblem && (
            <button
              onClick={() => onViewChange('problem')}
              className={`font-label h-full flex items-center px-2 transition-all duration-300 hover:bg-white/5 ${
                currentView === 'problem'
                  ? 'text-primary border-b-2 border-primary-container'
                  : 'text-slate-400 hover:text-secondary'
              }`}
            >
              Current Problem
            </button>
          )}

          <button
            onClick={() => onViewChange('history')}
            className={`font-label h-full flex items-center px-2 transition-all duration-300 hover:bg-white/5 ${
              currentView === 'history'
                ? 'text-primary border-b-2 border-primary-container'
                : 'text-slate-400 hover:text-secondary'
            }`}
          >
            History
          </button>
          
          <button
            onClick={() => onViewChange('help')}
            className={`font-label h-full flex items-center px-2 transition-all duration-300 hover:bg-white/5 ${
              currentView === 'help'
                ? 'text-primary border-b-2 border-primary-container'
                : 'text-slate-400 hover:text-secondary'
            }`}
          >
            Help
          </button>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {/* User Stats Display */}
        <div className="hidden lg:flex items-center gap-4 mr-2 bg-surface-container-high/50 rounded-full px-4 py-1.5 border border-outline-variant/20">
          <div className="flex items-center gap-1.5 text-secondary" title="Completed Problems">
            <CheckCircle2 size={16} />
            <span className="font-mono text-sm font-bold">{userStats.completed}</span>
          </div>
          <div className="w-px h-4 bg-outline-variant/30" />
          <div className="flex items-center gap-1 text-tertiary" title="Current Streak">
            <Flame size={16} strokeWidth={2.5} className={userStats.streak > 0 ? "text-orange-500 fill-orange-500/20" : "text-outline"} />
            <span className="font-mono text-sm font-bold">{userStats.streak}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <button 
            onClick={() => onViewChange('settings')}
            className={`p-2 transition-all duration-300 hover:bg-white/5 rounded-md active:scale-95 flex items-center justify-center ${
              currentView === 'settings' ? 'text-secondary bg-white/5' : 'hover:text-secondary'
            }`}
          >
            <Settings size={20} />
          </button>
        </div>
        {hasActiveProblem && (
          <>
            <button 
              onClick={onRun}
              disabled={isRunning}
              className="px-4 py-1.5 text-sm font-label rounded-md bg-secondary text-on-secondary hover:bg-secondary-fixed transition-colors active:scale-95 duration-150 shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              {isRunning ? <Loader2 size={14} className="animate-spin" /> : null}
              Run
            </button>
            <button 
              onClick={onSubmit} 
              disabled={isRunning}
              className="px-4 py-1.5 text-sm font-label rounded-md bg-gradient-to-br from-primary to-primary-container text-on-primary-container hover:brightness-110 transition-all active:scale-95 duration-150 shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {isRunning ? <Loader2 size={14} className="animate-spin" /> : null}
              Submit
            </button>
          </>
        )}
      </div>
    </header>
  );
}
