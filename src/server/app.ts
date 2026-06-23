import express, { type Express } from 'express';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { scienceProxy } from './scienceProxy';
import { blogRouter } from './blog/routes';
import { getSiteUrl, injectAbsoluteSeoUrls, robotsTxt, sitemapXml } from './seo';

/** Build the web application without opening a port, so it can be tested and embedded. */
export async function createApp(): Promise<Express> {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.get('/favicon.ico', (_req, res) => res.redirect(308, '/favicon.svg'));
  app.get('/robots.txt', robotsTxt);
  app.get('/sitemap.xml', sitemapXml);
  app.use('/api', (_req, res, next) => {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    next();
  });
  app.use('/api/blog', blogRouter());
  app.use('/api', scienceProxy());

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false }));
    app.get('*', async (req, res, next) => {
      try {
        const html = await readFile(path.join(distPath, 'index.html'), 'utf8');
        res.type('html').send(injectAbsoluteSeoUrls(html, getSiteUrl(req)));
      } catch (error) {
        next(error);
      }
    });
  }

  return app;
}
