import { Router } from 'express';

const ALLOWED_HOSTS = new Set([
  'rest.uniprot.org', 'reactome.org', 'data.rcsb.org', 'files.rcsb.org',
  'rest.ensembl.org', 'www.proteinatlas.org', 'eutils.ncbi.nlm.nih.gov',
  'pubchem.ncbi.nlm.nih.gov', 'alphafold.ebi.ac.uk', 'en.wikipedia.org',
]);
const FRESH_MS = 5 * 60_000;
const STALE_MS = 60 * 60_000;
const MAX_ENTRIES = 250;

interface CacheEntry { body: Buffer; contentType: string; storedAt: number; }
const cache = new Map<string, CacheEntry>();
const pending = new Map<string, Promise<CacheEntry>>();

function prune(): void {
  while (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value as string);
}

async function load(url: string): Promise<CacheEntry> {
  const active = pending.get(url);
  if (active) return active;
  const request = (async () => {
    const response = await fetch(url, { headers: { Accept: 'application/json,text/plain;q=0.9,*/*;q=0.5', 'User-Agent': 'Bio-Galaxy/1.0 open-science-atlas' }, signal: AbortSignal.timeout(12_000) });
    if (!response.ok) throw new Error(`Upstream request failed (${response.status})`);
    const entry = { body: Buffer.from(await response.arrayBuffer()), contentType: response.headers.get('content-type') ?? 'application/octet-stream', storedAt: Date.now() };
    cache.delete(url); cache.set(url, entry); prune();
    return entry;
  })().finally(() => pending.delete(url));
  pending.set(url, request);
  return request;
}

/** Same-origin, allowlisted gateway for the atlas's public, key-free science APIs. */
export function scienceProxy(): Router {
  const router = Router();
  router.get('/science', async (req, res) => {
    const raw = typeof req.query.url === 'string' ? req.query.url : '';
    let target: URL;
    try { target = new URL(raw); } catch { res.status(400).json({ error: 'A valid upstream URL is required.' }); return; }
    if (target.protocol !== 'https:' || !ALLOWED_HOSTS.has(target.hostname)) { res.status(403).json({ error: 'Upstream host is not in the public science allowlist.' }); return; }

    const hit = cache.get(target.href);
    const age = hit ? Date.now() - hit.storedAt : Infinity;
    try {
      const entry = hit && age < FRESH_MS ? hit : await load(target.href);
      res.set({ 'Content-Type': entry.contentType, 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300', 'X-Bio-Galaxy-Cache': hit && age < FRESH_MS ? 'HIT' : 'MISS' }).send(entry.body);
    } catch (error) {
      if (hit && age < STALE_MS) { res.set({ 'Content-Type': hit.contentType, 'X-Bio-Galaxy-Cache': 'STALE' }).send(hit.body); return; }
      res.status(502).json({ error: error instanceof Error ? error.message : 'Upstream request failed.' });
    }
  });
  return router;
}
