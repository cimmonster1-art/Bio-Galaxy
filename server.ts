import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { scienceProxy } from './src/server/scienceProxy';

// Host for the Bio Galaxy single-page atlas and its allowlisted, cached gateway
// to public science APIs. The upstream services are key free; no secrets are
// exposed to or accepted from the browser.

const PORT = Number(process.env.PORT ?? 3000);

async function start(): Promise<void> {
  const app = express();
  app.disable('x-powered-by');
  app.use('/api', scienceProxy());

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bio Galaxy atlas running at http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
