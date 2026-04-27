import express from 'express';
import serverless from 'serverless-http';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const groq = new Groq({
  apiKey: process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY || '',
});

const model = 'llama-3.3-70b-versatile';

// Normalization middleware
app.use((req, res, next) => {
  if (req.url.startsWith('/.netlify/functions/api')) {
    req.url = req.url.replace('/.netlify/functions/api', '');
  }
  if (req.url.startsWith('/api')) {
    req.url = req.url.replace('/api', '');
  }
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    hasKey: !!(process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY),
    envKeys: Object.keys(process.env).filter(k => k.includes('API_KEY'))
  });
});

app.post('/generate-problem', async (req, res) => {
  try {
    const { difficulty } = req.body;
    const apiKey = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
    }

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a world-class coding problem generator. 
          Generate a unique, creative, and challenging coding problem in JSON format.`
        },
        {
          role: 'user',
          content: `Generate a new "${difficulty}" level coding problem.`
        }
      ],
      model: model,
      response_format: { type: 'json_object' },
    });

    res.json(JSON.parse(completion.choices[0]?.message?.content || '{}'));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/generate-help', async (req, res) => {
  try {
    const { problem, userCode } = req.body;
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert coding mentor. Format response in HTML.'
        },
        {
          role: 'user',
          content: `Problem: ${problem.title}\nCode:\n${userCode}`
        }
      ],
      model: model,
    });
    res.json({ content: completion.choices[0]?.message?.content || '' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/evaluate-feedback', async (req, res) => {
  try {
    const { problem, language, code, testResults, passed } = req.body;
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a code evaluator. Return JSON: { "feedback": "string" }'
        },
        {
          role: 'user',
          content: `Problem: ${problem.title}\nPassed: ${passed}`
        }
      ],
      model: model,
      response_format: { type: 'json_object' },
    });
    res.json(JSON.parse(completion.choices[0]?.message?.content || '{}'));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Judge0 Proxy
const JUDGE0_URL = process.env.VITE_JUDGE0_URL || 'https://ce.judge0.com';
const JUDGE0_API_KEY = process.env.VITE_JUDGE0_API_KEY || process.env.JUDGE0_API_KEY || '';

app.post('/judge0/submissions', async (req, res) => {
  const response = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=true&wait=false`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-RapidAPI-Key': JUDGE0_API_KEY },
    body: JSON.stringify(req.body),
  });
  res.json(await response.json());
});

app.get('/judge0/submissions/:token', async (req, res) => {
  const response = await fetch(`${JUDGE0_URL}/submissions/${req.params.token}?base64_encoded=true`, {
    headers: { 'X-RapidAPI-Key': JUDGE0_API_KEY }
  });
  res.json(await response.json());
});

app.post('/judge0/submissions/batch', async (req, res) => {
  const response = await fetch(`${JUDGE0_URL}/submissions/batch?base64_encoded=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-RapidAPI-Key': JUDGE0_API_KEY },
    body: JSON.stringify(req.body),
  });
  res.json(await response.json());
});

app.get('/judge0/submissions/batch/status', async (req, res) => {
  const response = await fetch(`${JUDGE0_URL}/submissions/batch?tokens=${req.query.tokens}&base64_encoded=true`, {
    headers: { 'X-RapidAPI-Key': JUDGE0_API_KEY }
  });
  res.json(await response.json());
});

export const handler = serverless(app);
