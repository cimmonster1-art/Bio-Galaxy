import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import type { Request } from 'express';
import { getSiteUrl, injectAbsoluteSeoUrls } from '../seo';

const request = (protocol = 'http', host = 'atlas.test') => ({ protocol, get: (name: string) => name === 'host' ? host : undefined }) as Request;
afterEach(() => { delete process.env.SITE_URL; });

describe('SEO helpers', () => {
  it('normalizes configured URLs and rejects unsupported protocols', () => {
    process.env.SITE_URL = 'https://bio.example/';
    assert.equal(getSiteUrl(request()), 'https://bio.example');
    process.env.SITE_URL = 'file:///private';
    assert.equal(getSiteUrl(request()), 'http://localhost:3000');
  });
  it('makes discovery URLs absolute', () => {
    const html = '<link rel="canonical" href="/" /><meta property="og:url" content="/" /><meta content="/social-preview.svg"><script>"@id": "/#site"</script>';
    const result = injectAbsoluteSeoUrls(html, 'https://bio.example');
    assert(!result.includes('content="/social-preview.svg"'));
    assert(result.includes('https://bio.example/#site'));
  });
});
