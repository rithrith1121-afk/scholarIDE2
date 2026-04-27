import { Settings, TestCaseResult } from '../types';

const JUDGE0_URL = import.meta.env.VITE_JUDGE0_URL || 'https://ce.judge0.com';
const JUDGE0_API_KEY = import.meta.env.VITE_JUDGE0_API_KEY || ''; // Optional for self-hosted

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

// Helper to handle Unicode with Base64
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
    return atob(str); // Fallback for non-unicode
  }
};

export async function executeCode(code: string, language: Settings['language'], stdin: string = ''): Promise<{ output: string; errors: string }> {
  const languageId = LANGUAGE_MAP[language];
  
  try {
    // 1. Create Submission
    const response = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=true&wait=false`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': JUDGE0_API_KEY,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com', // Only needed for RapidAPI
      },
      body: JSON.stringify({
        source_code: encodeBase64(code),
        language_id: languageId,
        stdin: encodeBase64(stdin),
      }),
    });

    const data = await response.json();
    const token = data.token;

    if (!token) {
      throw new Error('Failed to get submission token from Judge0');
    }

    // 2. Poll for Result
    let result: Judge0Result | null = null;
    while (true) {
      const statusResponse = await fetch(`${JUDGE0_URL}/submissions/${token}?base64_encoded=true`, {
        headers: {
          'X-RapidAPI-Key': JUDGE0_API_KEY,
        }
      });
      result = await statusResponse.json();

      if (result && result.status.id > 2) { // 1: In Queue, 2: Processing
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 3. Process Result
    const stdout = result?.stdout ? decodeBase64(result.stdout) : '';
    const stderr = result?.stderr ? decodeBase64(result.stderr) : '';
    const compile_output = result?.compile_output ? decodeBase64(result.compile_output) : '';
    const message = result?.message ? decodeBase64(result.message) : '';

    let output = `> ${language} main.${language === 'python' ? 'py' : language === 'java' ? 'java' : 'src'}\n`;
    output += stdout;
    
    let errors = stderr || compile_output || message;
    if (result?.status.id !== 3) { // 3: Accepted
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
    // 1. Create Batch Submission
    const response = await fetch(`${JUDGE0_URL}/submissions/batch?base64_encoded=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': JUDGE0_API_KEY,
      },
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

    if (!tokens || tokens.length === 0) {
      throw new Error('Failed to get submission tokens from Judge0');
    }

    // 2. Poll for All Results
    let results: any[] = [];
    while (true) {
      const statusResponse = await fetch(`${JUDGE0_URL}/submissions/batch?tokens=${tokens.join(',')}&base64_encoded=true`, {
        headers: {
          'X-RapidAPI-Key': JUDGE0_API_KEY,
        }
      });
      const data = await statusResponse.json();
      results = data.submissions;

      const allFinished = results.every(r => r.status.id > 2);
      if (allFinished) break;
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 3. Process Results
    return results.map((result, index) => {
      const stdout = result.stdout ? decodeBase64(result.stdout) : '';
      const stderr = result.stderr ? decodeBase64(result.stderr) : '';
      const compile_output = result.compile_output ? decodeBase64(result.compile_output) : '';
      const message = result.message ? decodeBase64(result.message) : '';
      
      const actualOutput = stdout.trim();
      return {
        input: inputs[index],
        expectedOutput: '', // Will be filled by App.tsx
        actualOutput: actualOutput || stderr || compile_output || message,
        passed: false, // Will be filled by App.tsx
      };
    });
  } catch (error: any) {
    console.error('Judge0 Batch Error:', error);
    throw error;
  }
}
