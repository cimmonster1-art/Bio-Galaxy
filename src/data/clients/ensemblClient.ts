// Ensembl client. Supplies gene models and genomic context. The REST API is
// public; responses are JSON when the Accept header requests it.

import { getJson, RequestOptions } from './http';

const BASE = 'https://rest.ensembl.org';

export interface GeneContext {
  id: string;
  displayName?: string;
  biotype?: string;
  chromosome?: string;
  start?: number;
  end?: number;
  strand?: number;
  description?: string;
}

interface RawGene {
  id?: string;
  display_name?: string;
  biotype?: string;
  seq_region_name?: string;
  start?: number;
  end?: number;
  strand?: number;
  description?: string;
}

/** Look up a gene by symbol within a species (defaults to human). */
export async function lookupGene(
  symbol: string,
  species = 'homo_sapiens',
  opts: RequestOptions = {},
): Promise<GeneContext> {
  const url =
    `${BASE}/lookup/symbol/${encodeURIComponent(species)}/${encodeURIComponent(symbol)}` +
    `?content-type=application/json;expand=0`;
  const raw = await getJson<RawGene>(url, { cacheMs: 30 * 60_000, ...opts });
  return {
    id: raw.id ?? symbol,
    displayName: raw.display_name,
    biotype: raw.biotype,
    chromosome: raw.seq_region_name,
    start: raw.start,
    end: raw.end,
    strand: raw.strand,
    description: raw.description,
  };
}
