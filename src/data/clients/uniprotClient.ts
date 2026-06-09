// UniProt client. UniProt is the protein metadata hub for the atlas: it
// supplies accessions, names, functions, sequence availability, and cross
// references. The REST API is public and requires no key.

import { getJson, RequestOptions } from './http';

const BASE = 'https://rest.uniprot.org/uniprotkb';

/** Normalized protein record consumed by the UI. */
export interface UniProtProtein {
  accession: string;
  name: string;
  organism: string;
  geneName?: string;
  function?: string;
  sequenceLength?: number;
  hasSequence: boolean;
  pdbIds: string[];
  reactomeIds: string[];
}

// Minimal shape of the fields we read from the UniProt JSON response. The full
// response is much larger; we keep typing to the parts we normalize.
interface RawEntry {
  primaryAccession?: string;
  proteinDescription?: {
    recommendedName?: { fullName?: { value?: string } };
  };
  organism?: { scientificName?: string };
  genes?: Array<{ geneName?: { value?: string } }>;
  comments?: Array<{
    commentType?: string;
    texts?: Array<{ value?: string }>;
  }>;
  sequence?: { length?: number; value?: string };
  uniProtKBCrossReferences?: Array<{ database?: string; id?: string }>;
}

interface SearchResponse {
  results?: RawEntry[];
}

function normalize(entry: RawEntry): UniProtProtein {
  const xrefs = entry.uniProtKBCrossReferences ?? [];
  const functionComment = entry.comments?.find((c) => c.commentType === 'FUNCTION');
  return {
    accession: entry.primaryAccession ?? 'unknown',
    name:
      entry.proteinDescription?.recommendedName?.fullName?.value ?? 'Uncharacterized protein',
    organism: entry.organism?.scientificName ?? 'Unknown organism',
    geneName: entry.genes?.[0]?.geneName?.value,
    function: functionComment?.texts?.[0]?.value,
    sequenceLength: entry.sequence?.length,
    hasSequence: Boolean(entry.sequence?.length),
    pdbIds: xrefs
      .filter((x) => x.database === 'PDB' && x.id)
      .map((x) => x.id as string)
      .slice(0, 8),
    reactomeIds: xrefs
      .filter((x) => x.database === 'Reactome' && x.id)
      .map((x) => x.id as string)
      .slice(0, 8),
  };
}

const FIELDS =
  'accession,protein_name,organism_name,gene_names,cc_function,sequence,xref_pdb,xref_reactome';

/**
 * MVP query used by the atlas: human mitochondrial proteins. Mirrors the
 * documented endpoint and returns normalized records.
 */
export async function searchMitochondrialProteins(
  opts: RequestOptions = {},
): Promise<UniProtProtein[]> {
  const url =
    `${BASE}/search?query=${encodeURIComponent('organism_id:9606 AND mitochondria')}` +
    `&fields=${FIELDS}&format=json&size=10`;
  const data = await getJson<SearchResponse>(url, { cacheMs: 5 * 60_000, ...opts });
  return (data.results ?? []).map(normalize);
}

/** Free text protein search across UniProtKB, normalized and capped. */
export async function searchProteins(
  query: string,
  opts: RequestOptions = {},
): Promise<UniProtProtein[]> {
  const url =
    `${BASE}/search?query=${encodeURIComponent(query)}` +
    `&fields=${FIELDS}&format=json&size=10`;
  const data = await getJson<SearchResponse>(url, { cacheMs: 5 * 60_000, ...opts });
  return (data.results ?? []).map(normalize);
}

/** Fetch a single protein by accession. */
export async function getProtein(
  accession: string,
  opts: RequestOptions = {},
): Promise<UniProtProtein> {
  const url = `${BASE}/${encodeURIComponent(accession)}?fields=${FIELDS}&format=json`;
  const entry = await getJson<RawEntry>(url, { cacheMs: 10 * 60_000, ...opts });
  return normalize(entry);
}
