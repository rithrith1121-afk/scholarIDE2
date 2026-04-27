import express from 'express';
import serverless from 'serverless-http';
import apiRouter from '../../src/server/api';

const app = express();
app.use(express.json());

// Remove Netlify's internal function prefix so that our Express router matches the paths properly.
app.use((req, res, next) => {
  if (req.url.startsWith('/.netlify/functions/api')) {
    req.url = req.url.replace('/.netlify/functions/api', '/api');
  }
  next();
});

// Mount the router
app.use(apiRouter);

export const handler = serverless(app);
