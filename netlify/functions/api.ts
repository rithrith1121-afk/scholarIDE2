import { Handler } from '@netlify/functions';

const GROQ_MODEL = 'llama-3.3-70b-versatile';

export const handler: Handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST' && !event.path.endsWith('/health')) {
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
          { role: 'system', content: 'You are a coding problem generator. Return ONLY JSON.' },
          { role: 'user', content: `Generate a new "${body.difficulty || 'Easy'}" level coding problem.` }
        ],
        response_format: { type: 'json_object' }
      };
    } else if (path.includes('generate-help')) {
      apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
      payload = {
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: 'You are a coding mentor.' },
          { role: 'user', content: `Help with: ${body.problem?.title}` }
        ]
      };
    } else if (path.includes('evaluate-feedback')) {
      apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
      payload = {
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: 'You are an evaluator.' },
          { role: 'user', content: `Feedback for: ${body.problem?.title}` }
        ],
        response_format: { type: 'json_object' }
      };
    } else if (path.includes('judge0')) {
      // Handle Judge0 proxying
      const JUDGE0_URL = process.env.JUDGE0_URL || process.env.VITE_JUDGE0_URL || 'https://ce.judge0.com';
      const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY || process.env.VITE_JUDGE0_API_KEY || '';
      
      let targetPath = path.split('judge0')[1];
      const response = await fetch(`${JUDGE0_URL}${targetPath}${event.queryStringParameters ? '?' + new URLSearchParams(event.queryStringParameters as any).toString() : ''}`, {
        method: event.httpMethod,
        headers: { 'Content-Type': 'application/json', 'X-RapidAPI-Key': JUDGE0_API_KEY },
        body: event.body
      });
      return {
        statusCode: response.status,
        body: JSON.stringify(await response.json())
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
