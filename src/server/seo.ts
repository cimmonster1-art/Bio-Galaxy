import type { Request, Response } from 'express';

const SITE_URL_ENV = 'SITE_URL';

/** Resolve an absolute, normalized deployment URL without hard-coding a host. */
export function getSiteUrl(req: Request): string {
  const configured = process.env[SITE_URL_ENV]?.trim();
  const forwardedProtocol = req.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const protocol = forwardedProtocol === 'https' ? 'https' : req.protocol;
  const candidate = configured || `${protocol}://${req.get('host') ?? 'localhost:3000'}`;

  try {
    const url = new URL(candidate);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('Unsupported protocol');
    return url.toString().replace(/\/$/, '');
  } catch {
    return 'http://localhost:3000';
  }
}

export function robotsTxt(req: Request, res: Response): void {
  const siteUrl = getSiteUrl(req);
  res.type('text/plain').send(
    `# Bio Galaxy welcomes search engines and research-focused crawlers.\n` +
      `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
  );
}

export function sitemapXml(req: Request, res: Response): void {
  const siteUrl = escapeXml(getSiteUrl(req));
  res.type('application/xml').send(
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      `  <url>\n` +
      `    <loc>${siteUrl}/</loc>\n` +
      `    <changefreq>weekly</changefreq>\n` +
      `    <priority>1.0</priority>\n` +
      `  </url>\n` +
      `</urlset>\n`,
  );
}

/** Upgrade root-relative discovery URLs to absolute URLs in production HTML. */
export function injectAbsoluteSeoUrls(html: string, siteUrl: string): string {
  return html
    .replace('<link rel="canonical" href="/" />', `<link rel="canonical" href="${siteUrl}/" />`)
    .replace('<meta property="og:url" content="/" />', `<meta property="og:url" content="${siteUrl}/" />`)
    .replaceAll('content="/social-preview.svg"', `content="${siteUrl}/social-preview.svg"`)
    .replaceAll('"@id": "/#', `"@id": "${siteUrl}/#`);
}

function escapeXml(value: string): string {
  return value.replace(/[<>&'\"]/g, (character) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      "'": '&apos;',
      '"': '&quot;',
    };
    return entities[character];
  });
}
