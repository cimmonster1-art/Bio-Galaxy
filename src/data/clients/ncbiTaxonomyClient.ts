// NCBI Taxonomy client. Provides phylogenetic and taxonomic context for the
// Tree of Life navigation: rank, lineage, and parent/child relationships keyed
// by NCBI tax id. The E-utilities endpoints are public and key free.
//
// The atlas ships a curated local tree (see data/taxonomy.ts) so navigation
// works offline and instantly; this client is the seam where live NCBI lookups
// drop in to enrich a node or expand children on demand without changing the
// scene code.

import { getJson, RequestOptions } from './http';

const EUTILS = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

/** Normalized taxonomy record. */
export interface TaxonomyRecord {
  taxId: number;
  scientificName: string;
  rank: string;
  division?: string;
  /** Lineage from root to parent, broad to fine. */
  lineage: string[];
  parentTaxId?: number;
}

interface RawTaxon {
  TaxId?: string;
  ScientificName?: string;
  Rank?: string;
  Division?: string;
  ParentTaxId?: string;
  LineageEx?: { Taxon?: Array<{ ScientificName?: string }> } | Array<{ ScientificName?: string }>;
  Lineage?: string;
}

interface ESummaryResponse {
  result?: Record<string, unknown>;
}

function normalize(raw: RawTaxon): TaxonomyRecord {
  let lineage: string[] = [];
  const ex = raw.LineageEx;
  if (Array.isArray(ex)) {
    lineage = ex.map((t) => t.ScientificName ?? '').filter(Boolean);
  } else if (ex?.Taxon) {
    const list = Array.isArray(ex.Taxon) ? ex.Taxon : [ex.Taxon];
    lineage = list.map((t) => t.ScientificName ?? '').filter(Boolean);
  } else if (raw.Lineage) {
    lineage = raw.Lineage.split(';').map((s) => s.trim()).filter(Boolean);
  }
  return {
    taxId: Number(raw.TaxId ?? 0),
    scientificName: raw.ScientificName ?? 'Unknown',
    rank: raw.Rank ?? 'no rank',
    division: raw.Division,
    lineage,
    parentTaxId: raw.ParentTaxId ? Number(raw.ParentTaxId) : undefined,
  };
}

/**
 * Fetch a taxonomy summary for a tax id via E-utilities esummary. Returns a
 * normalized record. Cached and retried at the http boundary.
 */
export async function getTaxonomy(
  taxId: number,
  opts: RequestOptions = {},
): Promise<TaxonomyRecord> {
  const url = `${EUTILS}/esummary.fcgi?db=taxonomy&id=${encodeURIComponent(
    String(taxId),
  )}&retmode=json`;
  const data = await getJson<ESummaryResponse>(url, {
    cacheMs: 60 * 60_000,
    retries: 2,
    ...opts,
  });
  const record = (data.result?.[String(taxId)] ?? {}) as RawTaxon & {
    scientificname?: string;
    rank?: string;
    division?: string;
  };
  return normalize({
    TaxId: String(taxId),
    ScientificName: record.scientificname ?? record.ScientificName,
    Rank: record.rank ?? record.Rank,
    Division: record.division ?? record.Division,
  });
}

/**
 * Resolve a scientific name to its NCBI tax id via esearch. Useful when the
 * curated tree carries a name but not yet an id.
 */
export async function findTaxId(
  scientificName: string,
  opts: RequestOptions = {},
): Promise<number | null> {
  const url = `${EUTILS}/esearch.fcgi?db=taxonomy&term=${encodeURIComponent(
    scientificName,
  )}&retmode=json`;
  const data = await getJson<{ esearchresult?: { idlist?: string[] } }>(url, {
    cacheMs: 60 * 60_000,
    retries: 2,
    ...opts,
  });
  const id = data.esearchresult?.idlist?.[0];
  return id ? Number(id) : null;
}

/** Canonical NCBI Taxonomy browser URL for a tax id. */
export function taxonomyBrowserUrl(taxId: number): string {
  return `https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=${taxId}`;
}
