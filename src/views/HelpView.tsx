import { Lightbulb } from 'lucide-react';

interface HelpViewProps {
  helpContent: string | null;
}

export default function HelpView({ helpContent }: HelpViewProps) {
  if (!helpContent) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full p-8 text-center text-on-surface-variant">
        <Lightbulb size={48} className="mb-4 opacity-50" />
        <h2 className="text-xl font-headline text-on-surface mb-2">Solve a problem to view explanation</h2>
        <p className="font-body">Click "Explain Solution" while working on a problem to get AI guidance.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 h-full overflow-y-auto scrollbar-hide">
      <h1 className="text-3xl font-headline font-bold text-on-surface mb-8">Algorithm Explanation</h1>
      <div className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-6 shadow-sm">
        <div 
          className="article-content font-body text-sm text-on-surface-variant leading-relaxed"
          dangerouslySetInnerHTML={{ __html: helpContent }}
        />
      </div>
    </div>
  );
}
