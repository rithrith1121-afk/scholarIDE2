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
      if (response.status === 429) {
        throw new Error('Daily execution limit reached (20 credits/day). Please try again in 24 hours or check your JDoodle dashboard.');
      }
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

    // OPTIMIZATION: Bundle Python test cases into a single request to save credits
    if (language === 'python' && inputs.length > 1) {
      const delimiter = "---SANDBOX_CASE_DELIMITER---";
      const bundledCode = `
import sys
import io

# --- USER CODE START ---
${code}
# --- USER CODE END ---

test_inputs = ${JSON.stringify(inputs)}
delimiter = "${delimiter}"

for i, inp in enumerate(test_inputs):
    print(f"{delimiter} {i}")
    sys.stdin = io.StringIO(inp)
    try:
        # We need to re-run the code or call the solution
        # This is a simple approximation: we just re-execute the logic
        # For full accuracy, we'd need to wrap it more carefully
        exec(compile(${JSON.stringify(code)}, '<string>', 'exec'), globals())
    except Exception as e:
        print(f"Runtime Error: {e}", file=sys.stderr)
`;

      const response = await fetch('/api/jdoodle/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: bundledCode,
          language: langConfig.language,
          versionIndex: langConfig.versionIndex,
          stdin: '',
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Daily execution limit reached (20 credits/day). Please try again in 24 hours or check your JDoodle dashboard.');
        }
        const errText = await response.text();
        throw new Error(`API returned ${response.status}: ${errText}`);
      }

      const result: JDoodleResult = await response.json();
      const rawOutput = result.output || '';
      
      // Split the bundled output back into individual results
      const cases = rawOutput.split(delimiter).filter(c => c.trim().length > 0);
      
      return inputs.map((input, i) => {
        // Find the output for case i (it might have "i" index after the delimiter)
        const caseOutput = cases.find(c => c.trim().startsWith(i.toString())) || '';
        const actualOutput = caseOutput.replace(/^\\d+\\s+/, '').trim();
        
        return {
          input,
          expectedOutput: '',
          actualOutput: actualOutput || (result.statusCode !== 200 ? rawOutput : 'No output'),
          passed: false,
        };
      });
    }

    // Default: Parallel requests (costs 1 credit per test case)
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
        if (response.status === 429) {
          throw new Error('Daily execution limit reached (20 credits/day). Please try again in 24 hours or check your JDoodle dashboard.');
        }
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
