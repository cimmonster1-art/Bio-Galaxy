// RCSB PDB client. Provides structure availability metadata today and the
// entry point for loading full 3D coordinates later. The REST data API and the
// coordinate files are public.

import { getJson, RequestOptions } from './http';

const DATA_BASE = 'https://data.rcsb.org/rest/v1/core';
const FILE_BASE = 'https://files.rcsb.org/download';

export interface StructureSummary {
  pdbId: string;
  title: string;
  method?: string;
  resolution?: number;
  releaseDate?: string;
}

interface RawEntry {
  struct?: { title?: string };
  rcsb_entry_info?: {
    experimental_method?: string;
    resolution_combined?: number[];
  };
  rcsb_accession_info?: { initial_release_date?: string };
}

/** Fetch lightweight structure metadata for a PDB id. */
export async function getStructureSummary(
  pdbId: string,
  opts: RequestOptions = {},
): Promise<StructureSummary> {
  const url = `${DATA_BASE}/entry/${encodeURIComponent(pdbId.toUpperCase())}`;
  const data = await getJson<RawEntry>(url, { cacheMs: 30 * 60_000, ...opts });
  return {
    pdbId: pdbId.toUpperCase(),
    title: data.struct?.title ?? 'Structure',
    method: data.rcsb_entry_info?.experimental_method,
    resolution: data.rcsb_entry_info?.resolution_combined?.[0],
    releaseDate: data.rcsb_accession_info?.initial_release_date?.slice(0, 10),
  };
}

/**
 * Canonical coordinate URL for a PDB id. ProteinStructureLayer can stream and
 * parse this when full structure rendering is enabled.
 */
export function structureFileUrl(pdbId: string): string {
  return `${FILE_BASE}/${pdbId.toUpperCase()}.pdb`;
}
