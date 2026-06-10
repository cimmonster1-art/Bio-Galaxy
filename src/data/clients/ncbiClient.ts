// NCBI client. Used for taxonomy identifiers and links to the primary
// literature via E-utilities. The endpoints are public; an optional api_key
// can raise rate limits but is never required and never bundled here.

import { getJson, RequestOptions } from './http';

const EUTILS = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

export interface LiteratureHit {
  pmid: string;
  url: string;
}

export interface LiteratureResult {
  query: string;
  total: number;
  hits: LiteratureHit[];
}

interface ESearchResponse {
  esearchresult?: {
    count?: string;
    idlist?: string[];
  };
}

/** Search PubMed for a term and return capped article identifiers. */
export async function searchLiterature(
  term: string,
  opts: RequestOptions = {},
): Promise<LiteratureResult> {
  const url =
    `${EUTILS}/esearch.fcgi?db=pubmed&retmode=json&retmax=8` +
    `&term=${encodeURIComponent(term)}`;
  const data = await getJson<ESearchResponse>(url, { cacheMs: 15 * 60_000, ...opts });
  const ids = data.esearchresult?.idlist ?? [];
  return {
    query: term,
    total: Number(data.esearchresult?.count ?? ids.length),
    hits: ids.map((pmid) => ({
      pmid,
      url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
    })),
  };
}

/** Convenience link to an NCBI Taxonomy record. */
export function taxonomyUrl(taxId: number): string {
  return `https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=${taxId}`;
}
