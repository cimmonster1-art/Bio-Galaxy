// Shared fetch wrapper for the public-database clients.
//
// Responsibilities:
//   - apply a request timeout via AbortController
//   - normalize transport and HTTP errors into a single typed error
//   - provide a small in-memory cache boundary keyed by URL
//
// No secrets or API keys are handled here. All wrapped endpoints are public.

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly url?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface RequestOptions {
  /** Abort the request after this many milliseconds. */
  timeoutMs?: number;
  /** Cache successful JSON responses for this many milliseconds. */
  cacheMs?: number;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

interface CacheEntry {
  expires: number;
  value: unknown;
}

// Simple module-level cache. This is the boundary where a persistent or
// LRU-bounded cache (or a service worker) can be swapped in later.
const cache = new Map<string, CacheEntry>();
const DEFAULT_TIMEOUT = 8000;

function readCache<T>(key: string): T | undefined {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (hit.expires < Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return hit.value as T;
}

/** Fetch JSON with timeout, error normalization, and an optional cache. */
export async function getJson<T>(url: string, opts: RequestOptions = {}): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT, cacheMs = 0, signal, headers } = opts;

  if (cacheMs > 0) {
    const cached = readCache<T>(url);
    if (cached !== undefined) return cached;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  if (signal) {
    signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json', ...headers },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new ApiError(`Request failed (${res.status})`, res.status, url);
    }
    const value = (await res.json()) as T;
    if (cacheMs > 0) {
      cache.set(url, { expires: Date.now() + cacheMs, value });
    }
    return value;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError('Request timed out', undefined, url);
    }
    throw new ApiError(
      err instanceof Error ? err.message : 'Network error',
      undefined,
      url,
    );
  } finally {
    clearTimeout(timer);
  }
}

/** Clear the shared response cache. Exposed mainly for tests and dev tooling. */
export function clearApiCache(): void {
  cache.clear();
}
