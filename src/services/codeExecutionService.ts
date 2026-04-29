import { Settings, TestCaseResult } from '../types';

// JDoodle language identifiers and version indices
const LANGUAGE_MAP: Record<Settings['language'], { language: string; versionIndex: string }> = {
  python: { language: 'python3', versionIndex: '5' },
  java: { language: 'java', versionIndex: '4' },
  cpp: { language: 'cpp17', versionIndex: '1' },
  c: { language: 'c', versionIndex: '5' },
  javascript: { language: 'nodejs', versionIndex: '4' },
};

export interface JDoodleResult {
  output: string;
  statusCode: number;
  memory: string;
  cpuTime: string;
  compilationStatus?: string | null;
  error?: string;
}

/**
 * Execute code using JDoodle API via the Netlify serverless proxy.
 */
export async function executeCode(
  code: string,
  language: Settings['language'],
  stdin: string = ''
): Promise<{ output: string; errors: string }> {
  try {
    const langConfig = LANGUAGE_MAP[language];

    const response = await fetch('/api/jdoodle/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        script: code,
        language: langConfig.language,
        versionIndex: langConfig.versionIndex,
        stdin: stdin,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API returned ${response.status}: ${errText}`);
    }

    const result: JDoodleResult = await response.json();

    if (result.error) {
      return { output: '', errors: result.error };
    }

    const rawOutput = result.output || '';

    // JDoodle returns both stdout and stderr combined in "output".
    // If statusCode !== 200, the output likely contains error messages.
    let output = `> ${language} main.${language === 'python' ? 'py' : language === 'java' ? 'java' : language === 'cpp' ? 'cpp' : language === 'c' ? 'c' : 'js'}\n`;
    let errors = '';

    if (result.statusCode === 200) {
      output += rawOutput;
    } else {
      // Non-200 means compilation error or runtime error
      errors = rawOutput;
    }

    return { output, errors };
  } catch (error: any) {
    console.error('JDoodle Error:', error);
    return { output: '', errors: `Failed to execute code: ${error.message}` };
  }
}

/**
 * Execute code against multiple test case inputs using JDoodle.
 * Since JDoodle doesn't have a native batch endpoint, we run them in parallel.
 */
export async function executeBatch(
  code: string,
  language: Settings['language'],
  inputs: string[]
): Promise<TestCaseResult[]> {
  try {
    const langConfig = LANGUAGE_MAP[language];

    const promises = inputs.map(async (input) => {
      const response = await fetch('/api/jdoodle/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: code,
          language: langConfig.language,
          versionIndex: langConfig.versionIndex,
          stdin: input,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API returned ${response.status}: ${errText}`);
      }

      const result: JDoodleResult = await response.json();
      return { input, result };
    });

    const executionResults = await Promise.all(promises);

    return executionResults.map(({ input, result }) => {
      const rawOutput = result.output || '';
      let actualOutput = '';
      let errorOutput = '';

      if (result.error) {
        errorOutput = result.error;
      } else if (result.statusCode === 200) {
        actualOutput = rawOutput.trim();
        if (actualOutput === '') {
          errorOutput = 'No output: Did you forget to call your function or print the result?';
        }
      } else {
        errorOutput = rawOutput.trim() || 'Execution failed with non-zero status code.';
      }

      return {
        input,
        expectedOutput: '', // Filled by App.tsx
        actualOutput: actualOutput || errorOutput,
        passed: false, // Filled by App.tsx
      };
    });
  } catch (error: any) {
    console.error('JDoodle Batch Error:', error);
    throw error;
  }
}
