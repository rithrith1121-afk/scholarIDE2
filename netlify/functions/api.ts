import express from 'express';
import serverless from 'serverless-http';
import apiRouter from '../../src/server/api';

const app = express();
app.use(express.json());

// Robust path handling for Netlify Functions
app.use((req, res, next) => {
  // If the request comes through the Netlify redirect, it might have the full function path
  // or it might have the redirected /api path. We normalize it to /api for our router.
  if (req.url.startsWith('/.netlify/functions/api')) {
    req.url = req.url.replace('/.netlify/functions/api', '/api');
  } else if (!req.url.startsWith('/api')) {
    // If it doesn't start with /api (e.g. it was redirected to just the filename part)
    // we prepend /api so it matches the router's expectations if we mount it at /api
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  next();
});

// Mount the router at /api
app.use('/api', apiRouter);

export const handler = serverless(app);
