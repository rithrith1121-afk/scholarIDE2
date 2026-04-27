import { Settings, TestCaseResult } from '../types';

const LANGUAGE_MAP: Record<Settings['language'], number> = {
  python: 71,
  java: 62,
  cpp: 54,
  c: 50,
  javascript: 63,
};

export interface Judge0Result {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  status: {
    id: number;
    description: string;
  };
  time: string;
  memory: number;
}

const encodeBase64 = (str: string) => {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
    return String.fromCharCode(parseInt(p1, 16));
  }));
};

const decodeBase64 = (str: string) => {
  try {
    return decodeURIComponent(Array.prototype.map.call(atob(str), (c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  } catch (e) {
    return atob(str);
  }
};

export async function executeCode(code: string, language: Settings['language'], stdin: string = ''): Promise<{ output: string; errors: string }> {
  const languageId = LANGUAGE_MAP[language];
  
  try {
    const response = await fetch(`/api/judge0/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_code: encodeBase64(code),
        language_id: languageId,
        stdin: encodeBase64(stdin),
      }),
    });

    const data = await response.json();
    const token = data.token;

    if (!token) throw new Error('Failed to get submission token from Judge0');

    let result: Judge0Result | null = null;
    while (true) {
      const statusResponse = await fetch(`/api/judge0/submissions/${token}`);
      result = await statusResponse.json();

      if (result && result.status.id > 2) break;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const stdout = result?.stdout ? decodeBase64(result.stdout) : '';
    const stderr = result?.stderr ? decodeBase64(result.stderr) : '';
    const compile_output = result?.compile_output ? decodeBase64(result.compile_output) : '';
    const message = result?.message ? decodeBase64(result.message) : '';

    let output = `> ${language} main.${language === 'python' ? 'py' : language === 'java' ? 'java' : 'src'}\n`;
    output += stdout;
    
    let errors = stderr || compile_output || message;
    if (result?.status.id !== 3) {
      errors = `Status: ${result?.status.description}\n${errors}`;
    }

    return { output, errors };
  } catch (error: any) {
    console.error('Judge0 Error:', error);
    return { output: '', errors: `Failed to connect to Judge0: ${error.message}` };
  }
}

export async function executeBatch(code: string, language: Settings['language'], inputs: string[]): Promise<TestCaseResult[]> {
  const languageId = LANGUAGE_MAP[language];
  
  try {
    const response = await fetch(`/api/judge0/submissions/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submissions: inputs.map(input => ({
          source_code: encodeBase64(code),
          language_id: languageId,
          stdin: encodeBase64(input),
        }))
      }),
    });

    const submissions = await response.json();
    const tokens = submissions.map((s: any) => s.token);

    if (!tokens || tokens.length === 0) throw new Error('Failed to get submission tokens from Judge0');

    let results: any[] = [];
    while (true) {
      const statusResponse = await fetch(`/api/judge0/submissions/batch/status?tokens=${tokens.join(',')}`);
      const data = await statusResponse.json();
      results = data.submissions;

      const allFinished = results.every(r => r.status.id > 2);
      if (allFinished) break;
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results.map((result, index) => {
      const stdout = result.stdout ? decodeBase64(result.stdout) : '';
      const stderr = result.stderr ? decodeBase64(result.stderr) : '';
      const compile_output = result.compile_output ? decodeBase64(result.compile_output) : '';
      const message = result.message ? decodeBase64(result.message) : '';
      
      const actualOutput = stdout.trim();
      return {
        input: inputs[index],
        expectedOutput: '', // Filled by App.tsx
        actualOutput: actualOutput || stderr || compile_output || message,
        passed: false, // Filled by App.tsx
      };
    });
  } catch (error: any) {
    console.error('Judge0 Batch Error:', error);
    throw error;
  }
}
