import Groq from 'groq-sdk';
import { Problem, EvaluationResult } from '../types';

const apiKey = import.meta.env.VITE_GROQ_API_KEY;

if (!apiKey) {
  throw new Error('Groq API key not found. Check .env file');
}

const groq = new Groq({
  apiKey,
  dangerouslyAllowBrowser: true
});

const model = 'llama-3.3-70b-versatile';

export async function generateProblem(difficulty: 'Easy' | 'Intermediate' | 'Hard'): Promise<Problem> {
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `You are a world-class coding problem generator. 
        Generate a unique, creative, and challenging data structure or algorithmic coding problem.
        Return ONLY a JSON object that strictly follows this structure:
        {
          "title": "string",
          "difficulty": "${difficulty}",
          "tags": ["string"],
          "descriptionHtml": "string (formatted with basic HTML tags like <p>, <strong>, <code>)",
          "examples": [
            { "input": "string", "output": "string", "explanation": "string (optional)" }
          ],
          "constraints": ["string"],
          "snippets": {
            "python": "string", "java": "string", "cpp": "string", "c": "string", "javascript": "string"
          },
          "starterCode": {
            "python": "string", "java": "string", "cpp": "string", "c": "string", "javascript": "string"
          }
        }
        
        Language Rules:
        - C: Use stdio.h, proper main() function, and printf/scanf.
        - JavaScript: Use Node.js environment style, console.log for output, and avoid browser-specific APIs.
        - Python/Java/C++: Follow standard industry best practices.
        - Examples: Provide at least 4 diverse test cases (basic, edge case, large input, etc.).`
      },
      {
        role: 'user',
        content: `Generate a new "${difficulty}" level coding problem.`
      }
    ],
    model: model,
    response_format: { type: 'json_object' },
    temperature: 0.8,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Failed to generate problem content.');
  }

  return JSON.parse(content) as Problem;
}

export async function generateHelp(problem: Problem, userCode: string): Promise<string> {
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `You are an expert coding mentor. Provide a detailed algorithm explanation and hints for the provided problem. 
        Review the user's current code to find potential issues or guide them.
        Format your response using clean HTML. Use tags like <h3>, <ul>, <li>, <p>, <strong>, <code>. Do not wrap in a markdown code block.`
      },
      {
        role: 'user',
        content: `Problem Title: ${problem.title}
        
        Problem Description: ${problem.descriptionHtml}
        
        User's Current Code:
        \`\`\`
        ${userCode}
        \`\`\``
      }
    ],
    model: model,
    temperature: 0.5,
  });

  return completion.choices[0]?.message?.content || '<p>No help generated.</p>';
}

export async function executeCode(problem: Problem, code: string, language: string): Promise<{ output: string; errors: string }> {
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `You are a code execution engine. You will receive a coding problem, a programming language, and the user's code. 
        Your task is to:
        1. "Run" the code against the examples provided in the problem.
        2. Provide the realistic terminal output as if it were running in a real environment.
        3. If there are syntax errors or logical errors, include them in the errors field.
        4. Return ONLY a JSON object: { "output": "string", "errors": "string" }
        
        Formatting:
        - Output should include the command used to run (e.g., "> python main.py")
        - Include any print statements or logs.
        - Be precise about the result (e.g., if it's a "Duplicate Encoder" problem, show the encoded strings).`
      },
      {
        role: 'user',
        content: `Problem: ${problem.title}
        Language: ${language}
        Code:
        \`\`\`${language}
        ${code}
        \`\`\`
        
        Examples to check:
        ${JSON.stringify(problem.examples)}`
      }
    ],
    model: model,
    response_format: { type: 'json_object' },
    temperature: 0.1, // Low temperature for deterministic-like behavior
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Failed to simulate code execution.');
  }

  return JSON.parse(content) as { output: string; errors: string };
}

export async function evaluateCode(problem: Problem, code: string, language: string): Promise<EvaluationResult> {
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `You are a code evaluator. You will receive a coding problem, a programming language, and the user's code. 
        Your task is to:
        1. Evaluate if the code correctly solves the problem and passes all examples and potential edge cases.
        2. Test the code against each example provided.
        3. Return ONLY a JSON object that strictly follows this structure:
        {
          "passed": boolean,
          "feedback": "string",
          "testResults": [
            { "input": "string", "expectedOutput": "string", "actualOutput": "string", "passed": boolean }
          ]
        }`
      },
      {
        role: 'user',
        content: `Problem: ${problem.title}
        Language: ${language}
        Code:
        \`\`\`${language}
        ${code}
        \`\`\`
        
        Examples to test:
        ${JSON.stringify(problem.examples)}`
      }
    ],
    model: model,
    response_format: { type: 'json_object' },
    temperature: 0.1,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Failed to evaluate code.');
  }

  return JSON.parse(content) as EvaluationResult;
}


