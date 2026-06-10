import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

// Minimal host for the Bio Galaxy single-page atlas. In development it mounts
// Vite as middleware; in production it serves the built assets. The public
// database clients run in the browser against open, key-free APIs, so there is
// no server-side proxy or secret handling here.

const PORT = Number(process.env.PORT ?? 3000);

async function start(): Promise<void> {
  const app = express();

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
