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

  // Security headers applied to every response.
  app.use((_req, res, next) => {
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https:",
        "font-src 'self' data:",
        [
          "connect-src 'self'",
          'https://rest.uniprot.org',
          'https://reactome.org',
          'https://data.rcsb.org',
          'https://files.rcsb.org',
          'https://rest.ensembl.org',
          'https://www.proteinatlas.org',
          'https://eutils.ncbi.nlm.nih.gov',
          'https://pubchem.ncbi.nlm.nih.gov',
          'https://alphafold.ebi.ac.uk',
          'https://en.wikipedia.org',
        ].join(' '),
        "worker-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'self'",
        "frame-ancestors 'none'",
        'upgrade-insecure-requests',
      ].join('; ')
    );
    // Explicitly disable legacy XSS auditor (modern browsers ignore it; old ones
    // had exploitable bypass bugs when it was enabled).
    res.setHeader('X-XSS-Protection', '0');
    next();
  });

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
