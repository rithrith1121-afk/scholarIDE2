export interface Example {
  input: string;
  output: string;
  explanation?: string;
}

export interface CodeSnippets {
  python: string;
  java: string;
  cpp: string;
  c: string;
  javascript: string;
}

export interface Problem {
  title: string;
  difficulty: 'Easy' | 'Intermediate' | 'Hard';
  tags: string[];
  descriptionHtml: string;
  examples: Example[];
  constraints: string[];
  snippets: CodeSnippets;
  starterCode: CodeSnippets;
}

export interface HistoryItem {
  id: string;
  problem: Problem;
  status: 'Passed' | 'Failed';
  timestamp: number;
  language: Settings['language'];
  userCode: string;
}

export interface Settings {
  theme: 'dark' | 'light';
  language: 'python' | 'java' | 'cpp' | 'c' | 'javascript';
  fontSize: number;
  autosave: boolean;
}

export const defaultSettings: Settings = {
  theme: 'dark',
  language: 'python',
  fontSize: 14,
  autosave: true,
};

export interface UserStats {
  name: string;
  dateOfBirth: string | null;
  completed: number;
  streak: number;
  lastSolvedDate: string | null;
  hasCompletedOnboarding: boolean;
}

export const defaultUserStats: UserStats = {
  name: '',
  dateOfBirth: null,
  completed: 0,
  streak: 0,
  lastSolvedDate: null,
  hasCompletedOnboarding: false,
};

export interface TestCaseResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
}

export interface EvaluationResult {
  passed: boolean;
  feedback: string;
  testResults: TestCaseResult[];
}
