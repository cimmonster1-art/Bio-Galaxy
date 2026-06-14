// Wikipedia REST client. Supplies a live encyclopedic summary for the selected
// object so the sidebar synthesizes curated atlas context with an external
// reference extract. The page-summary endpoint is public and key-free.

import { getJson, RequestOptions } from './http';

const REST = 'https://en.wikipedia.org/api/rest_v1/page/summary';

export interface WikiSummary {
  title: string;
  extract: string;
  description?: string;
  thumbnail?: string;
  url: string;
}

interface RawSummary {
  title?: string;
  extract?: string;
  description?: string;
  thumbnail?: { source?: string };
  content_urls?: { desktop?: { page?: string } };
  type?: string;
}

/** Fetch a one-paragraph Wikipedia summary for a title. */
export async function getSummary(
  title: string,
  opts: RequestOptions = {},
): Promise<WikiSummary> {
  const slug = encodeURIComponent(title.replaceAll(' ', '_'));
  const data = await getJson<RawSummary>(`${REST}/${slug}`, {
    cacheMs: 60 * 60_000,
    ...opts,
  });
  if (!data.extract || data.type === 'disambiguation') {
    throw new Error(`No encyclopedic summary for ${title}`);
  }
  return {
    title: data.title ?? title,
    extract: data.extract,
    description: data.description,
    thumbnail: data.thumbnail?.source,
    url:
      data.content_urls?.desktop?.page ??
      `https://en.wikipedia.org/wiki/${slug}`,
  };
}
