/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import ProblemView from './views/ProblemView';
import DifficultySelectionView from './views/DifficultySelectionView';
import HistoryView from './views/HistoryView';
import HelpView from './views/HelpView';
import SettingsView from './views/SettingsView';
import OnboardingView from './views/OnboardingView';
import { ToastContainer, ToastType } from './components/Toast';
import { generateProblem, generateHelp, evaluateCodeFeedback } from './services/groqService';
import { executeCode, executeBatch } from './services/codeExecutionService';
import { Problem, HistoryItem, Settings, defaultSettings, UserStats, defaultUserStats, TestCaseResult } from './types';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState('generate');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Generating your challenge...');
  const [problemData, setProblemData] = useState<Problem | null>(null);
  const [userCode, setUserCode] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [errors, setErrors] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'results' | 'output' | 'errors'>('results');
  const [testResults, setTestResults] = useState<TestCaseResult[]>([]);

  // Persistence State
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('history');
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('settings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  const [userStats, setUserStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('userStats');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migration to enforce onboarding if flag doesn't exist
      if (parsed.hasCompletedOnboarding === undefined) {
         return { ...defaultUserStats, ...parsed, hasCompletedOnboarding: parsed.name ? true : false };
      }
      return parsed;
    }
    return defaultUserStats;
  });

  const [helpContent, setHelpContent] = useState<string | null>(null);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: ToastType }[]>([]);

  const getTodayString = () => {
    const today = new Date();
    return today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  };

  // Streak Verification on mount
  useEffect(() => {
    const today = getTodayString();
    if (userStats.lastSolvedDate && userStats.lastSolvedDate !== today) {
      const lastDate = new Date(userStats.lastSolvedDate);
      const todayDate = new Date(today);
      // diff in days
      const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 1) {
        // Streak broken
        setUserStats(prev => ({ ...prev, streak: 0 }));
      }
    }
  }, []);

  const showToast = (message: string, type: ToastType = 'success') => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    const limitedHistory = history.slice(0, 50); // Keep max 50 items
    localStorage.setItem('history', JSON.stringify(limitedHistory));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('userStats', JSON.stringify(userStats));
  }, [userStats]);

  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(settings));
    // Apply theme globally
    if (settings.theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  }, [settings]);

  // Make sure default dark mode is applied on mount if set
  useEffect(() => {
    if (settings.theme === 'dark' && !document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else if (settings.theme === 'light' && !document.documentElement.classList.contains('light')) {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleDifficultySelect = async (difficulty: 'Easy' | 'Intermediate' | 'Hard') => {
    console.log(`Selected difficulty: ${difficulty}`);
    try {
      setLoadingMessage('Configuring a unique challenge...');
      setLoading(true);
      const newProblem = await generateProblem(difficulty);
      setProblemData(newProblem);
      setUserCode(newProblem.starterCode[settings.language]);
      setOutput('');
      setErrors('');
      setCurrentView('problem');
    } catch (error: any) {
      console.error('Error generating problem:', error);
      if (error.message?.includes('API key not valid')) {
        showToast('Invalid API Key. Please check your .env file or Settings.', 'error');
      } else {
        showToast('Failed to generate problem. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExplainSolution = async (problem: Problem, code: string) => {
    try {
      setLoadingMessage('Analyzing approach...');
      setLoading(true);
      const contentHtml = await generateHelp(problem, code);
      setHelpContent(contentHtml);
      setCurrentView('help');
    } catch (error) {
      console.error('Error generating help:', error);
      showToast('Failed to explain solution.', 'error');
    } finally {
      setLoading(false);
    }
  };


  const handleSubmit = async () => {
    if (!problemData) return;
    
    setIsRunning(true);
    setActiveTab('results');
    setTestResults([]);
    
    try {
      // 1. Strict Deterministic Evaluation using Piston Sandbox
      const inputs = problemData.examples.map(ex => ex.input);
      const batchResults = await executeBatch(userCode, settings.language, inputs);
      
      const mappedResults: TestCaseResult[] = batchResults.map((res, i) => {
        const expected = problemData.examples[i].output.trim();
        const actualLines = res.actualOutput.trim().split('\n');
        // Take the last non-empty line as the final result (ignores debug prints above)
        const lastOutputLine = actualLines[actualLines.length - 1]?.trim() || '';
        
        const passed = lastOutputLine.toLowerCase() === expected.toLowerCase();
        return { ...res, expectedOutput: expected, passed };
      });
      
      const isPassed = mappedResults.every(r => r.passed);
      setTestResults(mappedResults);

      // 2. Fetch AI Feedback based on actual deterministic execution
      const aiFeedback = await evaluateCodeFeedback(problemData, settings.language, userCode, isPassed, mappedResults);
      
      if (isPassed) {
        setUserStats(prev => {
          const today = getTodayString();
          let newStreak = prev.streak;

          if (prev.lastSolvedDate !== today) {
            if (prev.lastSolvedDate) {
              const lastDate = new Date(prev.lastSolvedDate);
              const todayDate = new Date(today);
              const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              if (diffDays === 1) {
                newStreak += 1;
              } else {
                newStreak = 1;
              }
            } else {
              newStreak = 1;
            }
          }

          return {
            ...prev,
            completed: prev.completed + 1,
            streak: newStreak,
            lastSolvedDate: today,
          };
        });
        showToast(aiFeedback.feedback || 'Challenge Passed! Stats updated.', 'success');
      } else {
        showToast(aiFeedback.feedback || 'Challenge Failed. Keep trying!', 'error');
      }

      const newHistoryItem: HistoryItem = {
        id: crypto.randomUUID(),
        problem: problemData,
        status: isPassed ? 'Passed' : 'Failed',
        timestamp: Date.now(),
        language: settings.language,
        userCode: userCode,
      };
      
      setHistory(prev => [newHistoryItem, ...prev.slice(0, 49)]); // Keep history bounded to 50 items
      if (isPassed) {
        setCurrentView('history');
      }
    } catch (error) {
      console.error('Submission error:', error);
      showToast('Failed to evaluate solution. Please try again.', 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const handleRun = async () => {
    if (!problemData) return;
    setIsRunning(true);
    setActiveTab('output');
    setOutput('Running test cases in sandbox...');
    setErrors('');
    setTestResults([]);

    try {
      const inputs = problemData.examples.map(ex => ex.input);
      const batchResults = await executeBatch(userCode, settings.language, inputs);
      
      let fullOutput = '';
      const mappedResults: TestCaseResult[] = batchResults.map((res, i) => {
        const expected = problemData.examples[i].output.trim();
        const actualLines = res.actualOutput.trim().split('\n');
        const lastOutputLine = actualLines[actualLines.length - 1]?.trim() || '';
        
        const passed = lastOutputLine.toLowerCase() === expected.toLowerCase();
        
        fullOutput += `> CASE ${i + 1}\n`;
        fullOutput += `Input:    ${res.input}\n`;
        fullOutput += `Output:   ${res.actualOutput}\n`;
        fullOutput += `Expected: ${expected}\n`;
        fullOutput += `Status:   ${passed ? 'PASSED' : 'FAILED'}\n\n`;
        
        return {
          ...res,
          expectedOutput: expected,
          passed: passed
        };
      });

      setOutput(fullOutput.trim());
      setTestResults(mappedResults);

    } catch (error: any) {
      console.error('Execution error:', error);
      setErrors(`An error occurred during sandbox execution: ${error.message}`);
      setActiveTab('errors');
    } finally {
      setIsRunning(false);
    }
  };

  const handleLanguageChange = (newLang: Settings['language']) => {
    setSettings(prev => ({ ...prev, language: newLang }));
    if (problemData) {
      setUserCode(problemData.starterCode[newLang]);
    }
    setOutput('');
    setErrors('');
  };

  const handleSelectHistoryProblem = (item: HistoryItem) => {
    setProblemData(item.problem);
    setCurrentView('problem');
  };

  // Settings Handlers
  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all history?')) {
      setHistory([]);
      showToast('History cleared', 'success');
    }
  };
  
  const handleResetStats = () => {
    if (window.confirm('Reset your progress and streak?')) {
      setUserStats(prev => ({
        ...prev,
        completed: 0,
        streak: 0,
        lastSolvedDate: null
      }));
      showToast('Stats reset', 'success');
    }
  };

  const handleResetAll = () => {
    if (window.confirm('This will reset all your data. Continue?')) {
      // Clear persistence
      localStorage.removeItem('history');
      localStorage.removeItem('userStats');
      localStorage.removeItem('notes');
      
      // Reset React state
      setHistory([]);
      setSettings(defaultSettings);
      setUserStats(defaultUserStats);
      setProblemData(null);
      setCurrentView('generate');
      showToast('All data reset', 'success');
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      // Reset Identity & History for a complete session reset
      localStorage.removeItem('userStats');
      localStorage.removeItem('history');
      
      setHistory([]);
      setUserStats(defaultUserStats);
      setProblemData(null);
      setCurrentView('generate');
      showToast('Logged out successfully', 'success');
    }
  };

  const hasActiveProblem = problemData !== null;

  // Root Logic: If no user identity, force onboarding/auth flow
  if (!userStats || !userStats.name) {
    return (
      <>
        <OnboardingView 
          onComplete={(name, dob) => 
            setUserStats(prev => ({ ...prev, name, dateOfBirth: dob, hasCompletedOnboarding: true }))
          } 
        />
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </>
    );
  }

  return (
    <Layout 
      currentView={currentView} 
      onViewChange={setCurrentView} 
      hasActiveProblem={hasActiveProblem} 
      userStats={userStats} 
      onSubmit={handleSubmit}
      onRun={handleRun}
      isRunning={isRunning}
    >
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center h-full w-full bg-surface">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <h2 className="text-xl font-headline text-on-surface mb-2">{loadingMessage}</h2>
          <p className="text-on-surface-variant font-body">Asking the AI for insights...</p>
        </div>
      ) : currentView === 'problem' && problemData ? (
        <ProblemView 
          problem={problemData} 
          onExplainSolution={handleExplainSolution}
          settings={settings}
          userCode={userCode}
          setUserCode={setUserCode}
          output={output}
          errors={errors}
          isRunning={isRunning}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLanguageChange={handleLanguageChange}
          testResults={testResults}
        />
      ) : currentView === 'history' ? (
        <HistoryView history={history} onSelectProblem={handleSelectHistoryProblem} />
      ) : currentView === 'help' ? (
        <HelpView helpContent={helpContent} />
      ) : currentView === 'settings' ? (
        <SettingsView 
          settings={settings} 
          userStats={userStats}
          onSettingsChange={setSettings} 
          onUserStatsChange={setUserStats}
          onClearHistory={handleClearHistory}
          onResetStats={handleResetStats}
          onResetAll={handleResetAll}
          onLogout={handleLogout}
        />
      ) : (
        <DifficultySelectionView 
          onSelect={handleDifficultySelect} 
          userStats={userStats} 
          settings={settings}
        />
      )}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </Layout>
  );
}


