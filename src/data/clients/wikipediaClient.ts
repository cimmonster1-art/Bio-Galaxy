// Wikipedia client. The public REST summary endpoint returns a short
// encyclopedic extract plus a representative thumbnail for a page title. It
// sends permissive CORS headers and needs no API key, so the browser can call
// it directly. Used to enrich every detail card with an image and description.

import { getJson, RequestOptions } from './http';

const BASE = 'https://en.wikipedia.org/api/rest_v1/page/summary';

/** Normalized summary surfaced to the detail card. */
export interface WikiSummary {
  title: string;
  extract: string;
  description?: string;
  thumbnailUrl?: string;
  pageUrl: string;
}

interface RawSummary {
  title?: string;
  displaytitle?: string;
  extract?: string;
  description?: string;
  type?: string;
  thumbnail?: { source?: string };
  content_urls?: { desktop?: { page?: string } };
}

/**
 * Fetch the REST summary for a page title. Disambiguation and other non
 * standard page types still carry an extract, so they are returned as is
 * rather than treated as errors. Cached for a day since article summaries are
 * effectively static for this use.
 */
export async function getSummary(
  title: string,
  opts: RequestOptions = {},
): Promise<WikiSummary> {
  const url = `${BASE}/${encodeURIComponent(title)}?redirect=true`;
  const raw = await getJson<RawSummary>(url, {
    cacheMs: 24 * 60 * 60_000,
    retries: 2,
    ...opts,
  });

  return {
    title: raw.title ?? title,
    extract: raw.extract ?? '',
    description: raw.description,
    thumbnailUrl: raw.thumbnail?.source,
    pageUrl:
      raw.content_urls?.desktop?.page ??
      `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
  };
}
