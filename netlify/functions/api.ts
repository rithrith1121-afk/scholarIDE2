import express from 'express';
import serverless from 'serverless-http';

const app = express();
app.use(express.json());

// Normalization middleware to handle Netlify's routing
app.use((req, res, next) => {
  if (req.url.startsWith('/.netlify/functions/api')) {
    req.url = req.url.replace('/.netlify/functions/api', '');
  }
  if (req.url.startsWith('/api')) {
    req.url = req.url.replace('/api', '');
  }
  next();
});

const GROQ_MODEL = 'llama-3.3-70b-versatile';

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    hasKey: !!(process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY),
    keysFound: Object.keys(process.env).filter(k => k.includes('API_KEY'))
  });
});

app.post('/generate-problem', async (req, res) => {
  try {
    const { difficulty } = req.body;
    const apiKey = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'Server Error: API Key is missing in Netlify Dashboard.' });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a coding problem generator. Return ONLY a valid JSON object for a coding challenge.'
          },
          {
            role: 'user',
            content: `Generate a new "${difficulty}" level coding problem.`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Groq API error' });
    }

    res.json(JSON.parse(data.choices[0]?.message?.content || '{}'));
  } catch (err: any) {
    res.status(500).json({ error: `Internal Server Error: ${err.message}` });
  }
});

// Simplify the other endpoints using direct fetch as well to avoid SDK issues
app.post('/generate-help', async (req, res) => {
  try {
    const { problem, userCode } = req.body;
    const apiKey = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: 'You are an expert coding mentor.' },
          { role: 'user', content: `Problem: ${problem.title}\nCode: ${userCode}` }
        ]
      })
    });

    const data = await response.json();
    res.json({ content: data.choices[0]?.message?.content || '' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/evaluate-feedback', async (req, res) => {
  try {
    const { problem, language, code, testResults, passed } = req.body;
    const apiKey = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: 'You are a code evaluator. Return JSON: { "feedback": "string" }' },
          { role: 'user', content: `Passed: ${passed}` }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const data = await response.json();
    res.json(JSON.parse(data.choices[0]?.message?.content || '{}'));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Judge0 Endpoints
const JUDGE0_URL = process.env.VITE_JUDGE0_URL || 'https://ce.judge0.com';
const JUDGE0_API_KEY = process.env.VITE_JUDGE0_API_KEY || process.env.JUDGE0_API_KEY || '';

app.post('/judge0/submissions', async (req, res) => {
  const response = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=true&wait=false`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-RapidAPI-Key': JUDGE0_API_KEY },
    body: JSON.stringify(req.body)
  });
  res.json(await response.json());
});

app.get('/judge0/submissions/:token', async (req, res) => {
  const response = await fetch(`${JUDGE0_URL}/submissions/${req.params.token}?base64_encoded=true`, {
    headers: { 'X-RapidAPI-Key': JUDGE0_API_KEY }
  });
  res.json(await response.json());
});

export const handler = serverless(app);
