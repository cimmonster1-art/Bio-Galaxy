// AlphaFold DB client. For protein-scale objects this supplies an AI-predicted
// 3D structure and metadata, complementing experimental RCSB PDB entries. The
// prediction API is public and keyed by UniProt accession.

import { getJson, RequestOptions } from './http';

const API = 'https://alphafold.ebi.ac.uk/api/prediction';

/** Normalized AlphaFold prediction record consumed by the detail panel. */
export interface AlphaFoldPrediction {
  accession: string;
  entryId: string;
  gene?: string;
  description?: string;
  organism?: string;
  sequenceLength?: number;
  modelVersion?: number;
  createdDate?: string;
  /** Open coordinate/model URLs for downstream structure rendering. */
  cifUrl?: string;
  pdbUrl?: string;
  paeImageUrl?: string;
}

interface RawPrediction {
  entryId?: string;
  gene?: string;
  uniprotAccession?: string;
  uniprotDescription?: string;
  organismScientificName?: string;
  uniprotStart?: number;
  uniprotEnd?: number;
  latestVersion?: number;
  modelCreatedDate?: string;
  cifUrl?: string;
  pdbUrl?: string;
  paeImageUrl?: string;
}

/** Fetch the AlphaFold predicted-structure record for a UniProt accession. */
export async function getPrediction(
  accession: string,
  opts: RequestOptions = {},
): Promise<AlphaFoldPrediction> {
  const url = `${API}/${encodeURIComponent(accession.toUpperCase())}`;
  const data = await getJson<RawPrediction[]>(url, { cacheMs: 30 * 60_000, ...opts });
  const p = data[0];
  if (!p) throw new Error(`No AlphaFold prediction for ${accession}`);
  const length =
    p.uniprotStart !== undefined && p.uniprotEnd !== undefined
      ? p.uniprotEnd - p.uniprotStart + 1
      : undefined;
  return {
    accession: p.uniprotAccession ?? accession.toUpperCase(),
    entryId: p.entryId ?? `AF-${accession.toUpperCase()}`,
    gene: p.gene,
    description: p.uniprotDescription,
    organism: p.organismScientificName,
    sequenceLength: length,
    modelVersion: p.latestVersion,
    createdDate: p.modelCreatedDate?.slice(0, 10),
    cifUrl: p.cifUrl,
    pdbUrl: p.pdbUrl,
    paeImageUrl: p.paeImageUrl,
  };
}
