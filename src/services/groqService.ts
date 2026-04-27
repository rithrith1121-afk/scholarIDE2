import { Problem, EvaluationResult } from '../types';

export async function generateProblem(difficulty: 'Easy' | 'Intermediate' | 'Hard'): Promise<Problem> {
  const response = await fetch('/api/generate-problem', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ difficulty })
  });
  if (!response.ok) throw new Error('Failed to generate problem');
  return response.json();
}

export async function generateHelp(problem: Problem, userCode: string): Promise<string> {
  const response = await fetch('/api/generate-help', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ problem, userCode })
  });
  if (!response.ok) throw new Error('Failed to generate help');
  const data = await response.json();
  return data.content;
}

export async function evaluateCodeFeedback(problem: Problem, language: string, code: string, passed: boolean, testResults: any[]): Promise<{feedback: string}> {
  const response = await fetch('/api/evaluate-feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ problem, language, code, passed, testResults })
  });
  if (!response.ok) throw new Error('Failed to get evaluation feedback');
  return response.json();
}
