import { Handler } from '@netlify/functions';

const GROQ_MODEL = 'llama-3.3-70b-versatile';

export const handler: Handler = async (event) => {
  // Allow POST for API calls, GET for health check
  const isAllowedMethod = event.httpMethod === 'POST' 
    || event.path.endsWith('/health');
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
              "python": "string (A function definition plus a driver. Example: \nimport sys\ndef solution(arg):\n  # logic\n  return result\n\nif __name__ == '__main__':\n  # Process inputs from sys.stdin\n  # print(solution(processed_input))\n)", 
              "java": "string (A class named Main with a main method that reads from Scanner(System.in) and prints solution result)", 
              "cpp": "string (A main function that reads from cin and prints solution result)", 
              "c": "string (A main function that reads from stdin and prints solution result)", 
              "javascript": "string (A driver that reads from fs.readFileSync(0) and prints solution result)"
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
    } else if (path.includes('jdoodle')) {
      // Handle JDoodle API proxying
      const JDOODLE_CLIENT_ID = process.env.JDOODLE_CLIENT_ID || '';
      const JDOODLE_CLIENT_SECRET = process.env.JDOODLE_CLIENT_SECRET || '';
      
      if (!JDOODLE_CLIENT_ID || !JDOODLE_CLIENT_SECRET) {
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'JDoodle API credentials are not configured in environment variables.' })
        };
      }

      // Inject server-side credentials into the request
      const jdoodlePayload = {
        ...body,
        clientId: JDOODLE_CLIENT_ID,
        clientSecret: JDOODLE_CLIENT_SECRET,
      };
      
      const response = await fetch('https://api.jdoodle.com/v1/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jdoodlePayload),
      });

      const responseText = await response.text();
      return {
        statusCode: response.status,
        headers: { 'Content-Type': 'application/json' },
        body: responseText,
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
