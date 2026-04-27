import { Sparkles, Code2 } from 'lucide-react';
import { UserStats, Settings } from '../types';

interface DifficultySelectionViewProps {
  onSelect: (difficulty: 'Easy' | 'Intermediate' | 'Hard') => void;
  userStats: UserStats;
  settings: Settings;
}

export default function DifficultySelectionView({ onSelect, userStats, settings }: DifficultySelectionViewProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full w-full bg-surface p-6 overflow-y-auto">
      <div className="max-w-3xl w-full text-center space-y-8 py-10">
        <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-2">
          <Sparkles className="w-12 h-12 text-primary" />
        </div>
        
        <div className="animate-[fade-in-up_0.4s_ease-out_forwards]">
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-on-surface">
            Choose Your Path
          </h1>
        </div>

        <p className="text-on-surface-variant font-body text-lg max-w-xl mx-auto">
          Select your expertise and AI will generate a tailored challenge for you.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <button
            onClick={() => onSelect('Easy')}
            className="group flex flex-col items-center p-8 bg-surface-container-low border border-outline-variant/20 rounded-xl hover:bg-surface-container hover:border-secondary-container/50 transition-all duration-300 shadow-sm hover:shadow-[0_8px_32px_rgba(0,165,114,0.1)] relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-secondary-container/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
            <span className="text-secondary-container bg-secondary-container/20 px-3 py-1 rounded text-sm font-label uppercase tracking-wider mb-4 relative z-10 box-border border-b border-transparent">
              Easy
            </span>
            <p className="text-on-surface-variant font-body text-sm text-center relative z-10">
              Basic arrays, loops, warmups
            </p>
          </button>

          <button
            onClick={() => onSelect('Intermediate')}
            className="group flex flex-col items-center p-8 bg-surface-container-low border border-outline-variant/20 rounded-xl hover:bg-surface-container hover:border-primary-container/50 transition-all duration-300 shadow-sm hover:shadow-[0_8px_32px_rgba(55,93,241,0.1)] relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-primary-container/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
            <span className="text-primary bg-primary/20 px-3 py-1 rounded text-sm font-label uppercase tracking-wider mb-4 relative z-10 box-border border-b border-transparent">
              Intermediate
            </span>
            <p className="text-on-surface-variant font-body text-sm text-center relative z-10">
              Trees, graphs, dynamic programming
            </p>
          </button>

          <button
            onClick={() => onSelect('Hard')}
            className="group flex flex-col items-center p-8 bg-surface-container-low border border-outline-variant/20 rounded-xl hover:bg-surface-container hover:border-error/50 transition-all duration-300 shadow-sm hover:shadow-[0_8px_32px_rgba(255,180,171,0.1)] relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-error/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
            <span className="text-error bg-error/20 px-3 py-1 rounded text-sm font-label uppercase tracking-wider mb-4 relative z-10 box-border border-b border-transparent">
              Hard
            </span>
            <p className="text-on-surface-variant font-body text-sm text-center relative z-10">
              Advanced algorithms, optimization
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
