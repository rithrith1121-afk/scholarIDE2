import React from 'react';
import { ChevronDown, AlignLeft, RotateCcw, Info, ChevronUp, X, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Problem, Settings, TestCaseResult } from '../types';

interface ProblemViewProps {
  problem: Problem;
  onExplainSolution: (problem: Problem, code: string) => void;
  settings: Settings;
  userCode: string;
  setUserCode: (code: string) => void;
  output: string;
  errors: string;
  isRunning: boolean;
  activeTab: 'results' | 'output' | 'errors';
  setActiveTab: (tab: 'results' | 'output' | 'errors') => void;
  onLanguageChange: (lang: Settings['language']) => void;
  testResults: TestCaseResult[];
}

export default function ProblemView({ 
  problem, 
  onExplainSolution, 
  settings,
  userCode,
  setUserCode,
  output,
  errors,
  isRunning,
  activeTab,
  setActiveTab,
  onLanguageChange,
  testResults,
}: ProblemViewProps) {
  
  const languages: Settings['language'][] = ['python', 'java', 'cpp', 'c', 'javascript'];
  
  const handleResetCode = () => {
    if (window.confirm('Reset code to starter template?')) {
      setUserCode(problem.starterCode[settings.language]);
    }
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as Settings['language'];
    if (userCode.trim() !== '' && userCode !== problem.starterCode[settings.language]) {
      if (window.confirm(`Switching to ${newLang} will replace your current code. Continue?`)) {
        onLanguageChange(newLang);
      }
    } else {
      onLanguageChange(newLang);
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Left Panel: Problem Description */}
      <section className="w-2/5 bg-surface-container-low flex flex-col overflow-y-auto scrollbar-hide p-8 relative">
        <div className="max-w-2xl mx-auto w-full">
          <h1 className="font-headline text-3xl font-bold text-on-surface mb-4">{problem.title}</h1>
          <div className="flex flex-wrap gap-2 mb-8">
            <span className={`px-2 py-1 rounded text-xs font-label uppercase tracking-wider ${
              problem.difficulty === 'Easy' ? 'bg-secondary-container/20 text-secondary-container' :
              problem.difficulty === 'Intermediate' ? 'bg-primary-container/20 text-primary' :
              'bg-error-container/20 text-error'
            }`}>
              {problem.difficulty}
            </span>
            {problem.tags.map(tag => (
              <span key={tag} className="bg-surface-container-high text-on-surface-variant px-2 py-1 rounded text-xs font-label border border-outline-variant/15">
                {tag}
              </span>
            ))}
          </div>

          <div 
            className="font-body text-on-surface-variant leading-relaxed space-y-4 mb-8 text-sm article-content"
            dangerouslySetInnerHTML={{ __html: problem.descriptionHtml }}
          />

          {problem.examples.map((example, index) => (
            <div key={index}>
              <h3 className="font-headline text-lg font-semibold text-on-surface mb-3">Example {index + 1}:</h3>
              <div className="bg-surface-container-highest p-4 rounded-lg mb-6 shadow-sm border border-outline-variant/15">
                <p className="font-label text-sm text-on-surface-variant mb-1 whitespace-pre-wrap">
                  <span className="text-on-surface">Input:</span> {example.input}
                </p>
                <p className="font-label text-sm text-on-surface-variant mb-1 whitespace-pre-wrap">
                  <span className="text-on-surface">Output:</span> {example.output}
                </p>
                {example.explanation && (
                  <p className="font-label text-sm text-outline mt-2 pt-2 border-t border-outline-variant/15">
                    <span className="text-on-surface">Explanation:</span> {example.explanation}
                  </p>
                )}
              </div>
            </div>
          ))}

          <h3 className="font-headline text-lg font-semibold text-on-surface mb-3">Constraints:</h3>
          <ul className="list-disc list-inside font-label text-sm text-on-surface-variant space-y-2 mb-8 ml-2">
            {problem.constraints.map((constraint, i) => (
              <li key={i}>
                <code className="text-primary-fixed-dim bg-surface-container-highest px-1.5 py-0.5 rounded border border-outline-variant/15">
                  {constraint}
                </code>
              </li>
            ))}
          </ul>

          <div className="flex gap-4 mt-12 mb-8 border-t border-outline-variant/20 pt-8">
            <button
              onClick={() => onExplainSolution(problem, userCode)}
              className="flex-1 px-4 py-2 bg-surface-container border border-outline-variant/30 rounded-lg text-secondary hover:bg-secondary-container/20 transition-colors font-label shadow-sm active:scale-95"
            >
              Explain Solution
            </button>
          </div>
        </div>
      </section>

      {/* Right Panel: Editor & Output */}
      <section className="w-3/5 flex flex-col bg-surface relative">
        {/* Editor Header */}
        <div className="h-12 bg-surface-container-low flex items-center justify-between px-4 border-b border-outline-variant/15">
          <div className="flex items-center gap-2 relative">
            <select 
              value={settings.language}
              onChange={handleLanguageChange}
              className="bg-surface-container-highest px-3 py-1 text-on-surface font-label text-sm rounded border-none outline-none focus:ring-1 focus:ring-primary/30 transition-all cursor-pointer capitalize appearance-none pr-8"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.5rem center',
                backgroundSize: '1rem'
              }}
            >
              {languages.map(lang => (
                <option key={lang} value={lang} className="bg-surface-container-highest text-on-surface">
                  {lang === 'cpp' ? 'C++' : lang.charAt(0).toUpperCase() + lang.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3 text-on-surface-variant">
            <button className="hover:text-on-surface transition-colors" title="Format Document">
              <AlignLeft size={16} />
            </button>
            <button 
              onClick={handleResetCode}
              className="hover:text-on-surface transition-colors" 
              title="Reset Code"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        {/* Code Editor Area */}
        <div className="flex-1 overflow-hidden flex bg-[#0d1117] relative" style={{ fontSize: `${settings.fontSize}px` }}>
          {/* Simulated Line Numbers */}
          <div className="w-12 text-outline font-label flex flex-col items-end pr-2 pt-4 select-none opacity-50 border-r border-outline-variant/15 text-[0.85em] pointer-events-none">
            {userCode.split('\n').map((_, i) => (
              <span key={i}>{i + 1}</span>
            ))}
          </div>
          {/* Real Editable Textarea */}
          <textarea
            value={userCode}
            onChange={(e) => setUserCode(e.target.value)}
            spellCheck={false}
            className="flex-1 bg-transparent text-[#c9d1d9] font-mono p-4 outline-none resize-none caret-primary leading-relaxed whitespace-pre z-10"
            style={{ 
              tabSize: 4,
              fontFamily: 'JetBrains Mono, Fira Code, monospace'
            }}
          />
        </div>

        {/* Bottom Panel (Terminal/Output) */}
        <div className="h-64 bg-surface-container-low flex flex-col shadow-[0_-24px_48px_rgba(6,14,32,0.4)] z-20">
          <div className="flex items-center px-4 bg-surface-container-high h-10 gap-6 border-b border-outline-variant/15">
            <button 
              onClick={() => setActiveTab('results')}
              className={`h-full px-2 font-label text-sm font-medium transition-all ${
                activeTab === 'results' ? 'text-primary border-b-2 border-primary-container' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Test Results
            </button>
            <button 
              onClick={() => setActiveTab('output')}
              className={`h-full px-2 font-label text-sm font-medium transition-all ${
                activeTab === 'output' ? 'text-primary border-b-2 border-primary-container' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Output
            </button>
            <button 
              onClick={() => setActiveTab('errors')}
              className={`h-full px-2 font-label text-sm font-medium transition-all ${
                activeTab === 'errors' ? 'text-primary border-b-2 border-primary-container' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Errors
            </button>
            <div className="ml-auto flex items-center gap-2 text-on-surface-variant">
              <button className="hover:text-on-surface">
                <ChevronUp size={16} />
              </button>
              <button className="hover:text-on-surface">
                <X size={16} />
              </button>
            </div>
          </div>
          <div className="flex-1 p-4 overflow-y-auto font-mono text-sm bg-surface-container-lowest">
            {isRunning ? (
              <div className="flex items-center gap-2 text-primary animate-pulse">
                <Loader2 size={16} className="animate-spin" />
                <span>Executing code...</span>
              </div>
            ) : activeTab === 'output' ? (
              <pre className="text-on-surface-variant whitespace-pre-wrap">{output || 'No output to display.'}</pre>
            ) : activeTab === 'errors' ? (
              <pre className="text-error whitespace-pre-wrap">{errors || 'No errors reported.'}</pre>
            ) : (
              <div className="space-y-4">
                {testResults.length > 0 ? (
                  testResults.map((result, index) => (
                    <div key={index} className="bg-surface-container-low border border-outline-variant/15 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold font-label uppercase tracking-wider text-outline">Case {index + 1}</span>
                        <div className={`flex items-center gap-1 text-xs font-bold ${result.passed ? 'text-secondary' : 'text-error'}`}>
                          {result.passed ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                          {result.passed ? 'Passed' : 'Failed'}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <div className="text-outline-variant mb-1">Input</div>
                          <div className="bg-surface-container-highest px-2 py-1 rounded truncate" title={result.input}>{result.input}</div>
                        </div>
                        <div>
                          <div className="text-outline-variant mb-1">Expected</div>
                          <div className="bg-surface-container-highest px-2 py-1 rounded truncate" title={result.expectedOutput}>{result.expectedOutput}</div>
                        </div>
                        <div className="col-span-2">
                          <div className="text-outline-variant mb-1">Actual Output</div>
                          <div className={`px-2 py-1 rounded font-mono ${result.passed ? 'bg-secondary/10 text-secondary' : 'bg-error/10 text-error'}`}>
                            {result.actualOutput || (result.passed ? result.expectedOutput : 'No output')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-2 text-outline">
                    <Info size={16} />
                    <span>{output ? 'No test cases were evaluated. Try running again.' : 'Run your code to see test results here.'}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

