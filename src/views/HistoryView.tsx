import { useState } from 'react';
import { HistoryItem } from '../types';
import { History, CheckCircle2, XCircle, Clock, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';

interface HistoryViewProps {
  history: HistoryItem[];
  onSelectProblem: (item: HistoryItem) => void;
}

export default function HistoryView({ history, onSelectProblem }: HistoryViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (history.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full p-8 text-center text-on-surface-variant">
        <History size={48} className="mb-4 opacity-50" />
        <h2 className="text-xl font-headline text-on-surface mb-2">No challenges completed yet</h2>
        <p className="font-body">Start solving problems to build your history.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto p-6 md:p-8 h-full overflow-y-auto scrollbar-hide">
      <h1 className="text-3xl font-headline font-bold text-on-surface mb-8">History</h1>
      <div className="space-y-4">
        {history.map((item) => {
          const isExpanded = expandedId === item.id;
          
          return (
            <div
              key={item.id}
              className={`w-full text-left bg-surface-container-low border border-outline-variant/20 rounded-xl transition-all shadow-sm flex flex-col overflow-hidden ${
                isExpanded ? 'border-outline-variant/40 bg-surface-container' : 'hover:border-outline-variant/40 hover:bg-surface-container'
              }`}
            >
              {/* Header Row - Clickable to expand */}
              <div 
                className="p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
              >
                {/* Left Section: Title & Time */}
                <div className="flex flex-col gap-2">
                  <span className="text-lg font-headline font-bold text-on-surface group-hover:text-primary transition-colors">
                    {item.problem.title}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-label">
                    <Clock size={14} className="opacity-70" />
                    {new Date(item.timestamp).toLocaleString()}
                  </div>
                </div>

                {/* Right Section: Badges & Action */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-2 md:mt-0">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-label uppercase tracking-wider ${
                      item.problem.difficulty === 'Easy' ? 'bg-secondary-container/20 text-secondary border border-secondary-container/30' :
                      item.problem.difficulty === 'Intermediate' ? 'bg-primary-container/20 text-primary border border-primary-container/30' :
                      'bg-error-container/20 text-error border border-error-container/30'
                    }`}>
                      {item.problem.difficulty}
                    </span>
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-label uppercase tracking-wider ${
                      item.status === 'Passed' ? 'bg-secondary-fixed/10 text-secondary border border-secondary/30' : 'bg-error-container/10 text-error border border-error/30'
                    }`}>
                      {item.status === 'Passed' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      {item.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 ml-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectProblem(item);
                      }}
                      className="hidden sm:flex items-center gap-1 text-sm font-label text-on-surface-variant hover:text-primary transition-colors bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant/20 hover:border-primary/30"
                    >
                      Retry <ChevronRight size={16} />
                    </button>
                    <div className="text-on-surface-variant opacity-70 flex justify-center items-center w-8 h-8 rounded-full hover:bg-white/5 transition-colors">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Content View */}
              {isExpanded && (
                <div className="p-5 pt-0 border-t border-outline-variant/10 mt-2 bg-surface-container-low/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    {/* Problem Description Column */}
                    <div>
                      <h4 className="text-sm font-headline font-semibold text-on-surface mb-3 flex items-center gap-2">
                        Problem Description
                      </h4>
                      <div 
                        className="article-content font-body text-sm text-on-surface-variant max-h-[300px] overflow-y-auto pr-3 scrollbar-hide bg-surface-container-lowest p-4 rounded-lg border border-outline-variant/10"
                        dangerouslySetInnerHTML={{ __html: item.problem.descriptionHtml }}
                      />
                    </div>
                    
                    {/* User Code Column */}
                    <div>
                      <h4 className="text-sm font-headline font-semibold text-on-surface mb-3 flex items-center justify-between">
                        <span>Submitted Code ({item.language || 'Python'})</span>
                      </h4>
                      <div className="bg-[#0d1117] p-4 rounded-lg border border-outline-variant/10 max-h-[300px] overflow-y-auto scrollbar-hide">
                        <pre className="font-mono text-xs text-[#c9d1d9] leading-relaxed">
                          <code>{item.userCode || item.problem.starterCode.python}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                  
                  {/* Mobile Retry Button - Only shows when expanded on small screens */}
                  <div className="mt-6 flex sm:hidden">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectProblem(item);
                      }}
                      className="w-full flex items-center justify-center gap-2 text-sm font-label text-primary transition-colors bg-primary-container/10 px-4 py-2.5 rounded-lg border border-primary/20 hover:bg-primary-container/20"
                    >
                      Load Problem into Workspace <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
