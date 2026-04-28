import { Handler } from '@netlify/functions';

const GROQ_MODEL = 'llama-3.3-70b-versatile';

export const handler: Handler = async (event) => {
  // Allow POST for API calls, GET for health check and judge0 polling
  const isAllowedMethod = event.httpMethod === 'POST' 
    || event.path.endsWith('/health') 
    || (event.httpMethod === 'GET' && event.path.includes('judge0'));
  if (!isAllowedMethod) {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;

  // Health check
  if (event.path.endsWith('/health')) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'ok',
        hasKey: !!apiKey,
        path: event.path
      })
    };
  }

  try {
    if (!apiKey) {
      throw new Error('API Key is missing in Netlify environment variables.');
    }

    const body = JSON.parse(event.body || '{}');
    const path = event.path;

    let apiUrl = '';
    let payload: any = {};

    if (path.includes('generate-problem')) {
      apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
      payload = {
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a world-class coding problem generator. 
          Generate a unique, creative, and challenging data structure or algorithmic coding problem.
          Return ONLY a JSON object that strictly follows this structure:
          {
            "title": "string",
            "difficulty": "${body.difficulty || 'Easy'}",
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
          }`
          },
          {
            role: 'user',
            content: `Generate a new "${body.difficulty || 'Easy'}" level coding problem.`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8,
      };
    } else if (path.includes('generate-help')) {
      apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
      payload = {
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are an expert coding mentor. Provide a detailed algorithm explanation and hints for the provided problem. 
          Review the user's current code to find potential issues or guide them.
          Format your response using clean HTML. Use tags like <h3>, <ul>, <li>, <p>, <strong>, <code>. Do not wrap in a markdown code block.`
          },
          {
            role: 'user',
            content: `Problem Title: ${body.problem?.title}\n\nProblem Description: ${body.problem?.descriptionHtml}\n\nUser's Current Code:\n\`\`\`\n${body.userCode}\n\`\`\``
          }
        ],
        temperature: 0.5,
      };
    } else if (path.includes('evaluate-feedback')) {
      apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
      payload = {
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a code evaluator. The user's code has already been run against test cases. 
          You must provide constructive feedback based on the test results.
          Return ONLY a JSON object:
          {
            "feedback": "string (short encouraging message explaining what was good or what went wrong)"
          }`
          },
          {
            role: 'user',
            content: `Problem: ${body.problem?.title}
          Language: ${body.language}
          Code: \n\`\`\`\n${body.code}\n\`\`\`
          Passed All Tests?: ${body.passed}
          Test Results: ${JSON.stringify(body.testResults)}`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      };
    } else if (path.includes('judge0')) {
      // Handle Judge0 proxying
      const JUDGE0_URL = process.env.JUDGE0_URL || process.env.VITE_JUDGE0_URL || 'https://ce.judge0.com';
      const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY || process.env.VITE_JUDGE0_API_KEY || '';
      
      let targetPath = path.split('judge0')[1];
      const fetchOptions: any = {
        method: event.httpMethod,
        headers: {
          'Content-Type': 'application/json',
          ...(JUDGE0_API_KEY ? { 'X-RapidAPI-Key': JUDGE0_API_KEY, 'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com' } : {})
        },
      };
      // Only include body for POST requests
      if (event.httpMethod === 'POST' && event.body) {
        fetchOptions.body = event.body;
      }
      const queryString = event.queryStringParameters 
        ? '?' + new URLSearchParams(event.queryStringParameters as any).toString() 
        : '';
      // Add base64_encoded param if not already present
      const separator = queryString ? '&' : '?';
      const base64Param = queryString.includes('base64_encoded') ? '' : `${separator}base64_encoded=true`;
      const targetUrl = `${JUDGE0_URL}${targetPath}${queryString}${base64Param}`;
      
      const response = await fetch(targetUrl, fetchOptions);
      const responseText = await response.text();
      return {
        statusCode: response.status,
        headers: { 'Content-Type': 'application/json' },
        body: responseText
      };
    }

    if (apiUrl) {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        return {
          statusCode: response.status,
          body: JSON.stringify({ error: data.error?.message || 'Upstream API Error' })
        };
      }

      const content = data.choices[0]?.message?.content;
      return {
        statusCode: 200,
        body: path.includes('generate-help') ? JSON.stringify({ content }) : content
      };
    }

    return { statusCode: 404, body: 'Not Found' };

  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
