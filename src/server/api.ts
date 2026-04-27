import express from 'express';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const groq = new Groq({
  apiKey: process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY || '',
});

const model = 'llama-3.3-70b-versatile';

// Health check to debug environment variables on Netlify
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    hasGroqKey: !!(process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY),
    nodeVersion: process.version
  });
});

router.post('/generate-problem', async (req, res) => {
  try {
    const { difficulty } = req.body;
    
    if (!(process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY)) {
      return res.status(500).json({ error: 'Missing GROQ API KEY on server' });
    }

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
          }`
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
    res.json(JSON.parse(content));
  } catch (error: any) {
    console.error('Groq API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/generate-help', async (req, res) => {
  try {
    const { problem, userCode } = req.body;
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
          content: `Problem Title: ${problem.title}\n\nProblem Description: ${problem.descriptionHtml}\n\nUser's Current Code:\n\`\`\`\n${userCode}\n\`\`\``
        }
      ],
      model: model,
      temperature: 0.5,
    });

    res.json({ content: completion.choices[0]?.message?.content || '<p>No help generated.</p>' });
  } catch (error: any) {
    console.error('Groq API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/evaluate-feedback', async (req, res) => {
  try {
    const { problem, language, code, testResults, passed } = req.body;
    const completion = await groq.chat.completions.create({
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
          content: `Problem: ${problem.title}
          Language: ${language}
          Code: \n\`\`\`\n${code}\n\`\`\`
          Passed All Tests?: ${passed}
          Test Results: ${JSON.stringify(testResults)}`
        }
      ],
      model: model,
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const content = completion.choices[0]?.message?.content;
    res.json(JSON.parse(content || '{"feedback": "No feedback available."}'));
  } catch (error: any) {
    console.error('Groq API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Judge0 Proxy to protect API keys
const JUDGE0_URL = process.env.VITE_JUDGE0_URL || 'https://ce.judge0.com';
const JUDGE0_API_KEY = process.env.VITE_JUDGE0_API_KEY || process.env.JUDGE0_API_KEY || '';

router.post('/judge0/submissions', async (req, res) => {
  try {
    const response = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=true&wait=false`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': JUDGE0_API_KEY,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/judge0/submissions/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const response = await fetch(`${JUDGE0_URL}/submissions/${token}?base64_encoded=true`, {
      headers: {
        'X-RapidAPI-Key': JUDGE0_API_KEY,
      }
    });
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/judge0/submissions/batch', async (req, res) => {
  try {
    const response = await fetch(`${JUDGE0_URL}/submissions/batch?base64_encoded=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': JUDGE0_API_KEY,
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/judge0/submissions/batch/status', async (req, res) => {
  try {
    const { tokens } = req.query;
    const response = await fetch(`${JUDGE0_URL}/submissions/batch?tokens=${tokens}&base64_encoded=true`, {
      headers: {
        'X-RapidAPI-Key': JUDGE0_API_KEY,
      }
    });
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
