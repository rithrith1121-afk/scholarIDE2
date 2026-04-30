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
        throw new Error('server is under the maintenance process');
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
  // Optimization: For Python and JS, we can bundle all test cases into ONE request to save JDoodle credits
  if (language === 'python' || language === 'javascript') {
    try {
      const langConfig = LANGUAGE_MAP[language];
      const delimiter = "---SCHOLAR_CASE_DIVIDER---";
      
      let bundledScript = "";
      if (language === 'python') {
        bundledScript = `
import sys
import io

def __scholar_run_test_cases():
    test_cases = ${JSON.stringify(inputs)}
    user_code = ${JSON.stringify(code)}
    
    # Define the user's code in the local scope
    local_scope = {}
    exec(user_code, local_scope)
    
    # Try to find a solution function
    solution_func = None
    for name, obj in local_scope.items():
        if callable(obj) and not name.startswith('__'):
            solution_func = obj
            break
            
    for i, tc_input in enumerate(test_cases):
        print("${delimiter}")
        # Mock stdin for the user's code if it uses input()
        sys.stdin = io.StringIO(tc_input)
        
        try:
            # If we found a function, call it. Otherwise just execute the whole script again with mocked stdin
            if solution_func:
                # Try to parse input if it's multiple arguments (comma separated)
                try:
                    args = [eval(a.strip()) for a in tc_input.split(',')]
                    result = solution_func(*args)
                except:
                    result = solution_func(tc_input)
                if result is not None:
                    print(result)
            else:
                exec(user_code, local_scope)
        except Exception as e:
            print(f"Error in Case {i+1}: {str(e)}")

__scholar_run_test_cases()
`;
      } else if (language === 'javascript') {
        bundledScript = `
const testCases = ${JSON.stringify(inputs)};
const userCode = ${JSON.stringify(code)};

testCases.forEach((tc, i) => {
  console.log("${delimiter}");
  try {
    // Basic JS execution wrap
    const script = new Function('input', userCode + "\\n return typeof solution !== 'undefined' ? solution(input) : undefined;");
    const result = script(tc);
    if (result !== undefined) console.log(result);
  } catch (e) {
    console.log("Error in Case " + (i+1) + ": " + e.message);
  }
});
`;
      }

      const response = await fetch('/api/jdoodle/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: bundledScript,
          language: langConfig.language,
          versionIndex: langConfig.versionIndex,
          stdin: "", // Inputs are bundled in the script
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('server is under the maintenance process');
        }
        const errText = await response.text();
        throw new Error(`API returned ${response.status}: ${errText}`);
      }

      const result: JDoodleResult = await response.json();
      const rawOutput = result.output || '';
      
      // Split output by delimiter
      const caseOutputs = rawOutput.split(delimiter).slice(1); // First element is empty or header

      return inputs.map((input, i) => {
        const actualOutput = (caseOutputs[i] || '').trim();
        return {
          input,
          expectedOutput: '', 
          actualOutput: actualOutput || (result.statusCode !== 200 ? rawOutput : 'No output'),
          passed: false,
        };
      });
    } catch (error: any) {
      console.error('Bundled Execution Error:', error);
      // Fallback to parallel if bundling fails
    }
  }

  // Fallback / Parallel execution for other languages or if bundling fails
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
      if (response.status === 429) {
        throw new Error('server is under the maintenance process');
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
