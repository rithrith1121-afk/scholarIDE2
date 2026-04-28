import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// Express plugin for local dev server only — uses dynamic import
// so src/server/api.ts (which initializes Groq SDK) is NOT loaded during production build
function expressPlugin() {
  return {
    name: 'express-plugin',
    async configureServer(server: any) {
      // Dynamic import ensures these only load during dev, not during `vite build`
      const express = (await import('express')).default;
      const { default: apiRouter } = await import('./src/server/api');
      const app = express();
      app.use(express.json());
      app.use('/api', apiRouter);
      server.middlewares.use(app);
    }
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), expressPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    hmr: process.env.DISABLE_HMR !== 'true',
  },
});
