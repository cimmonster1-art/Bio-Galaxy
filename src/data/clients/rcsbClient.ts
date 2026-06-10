// RCSB PDB client. Provides structure availability metadata today and the
// entry point for loading full 3D coordinates later. The REST data API and the
// coordinate files are public.

import { getJson, getText, RequestOptions } from './http';

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

/** A single parsed atom. Plain data so the client stays free of Three.js. */
export interface AtomCoord {
  element: string;
  x: number;
  y: number;
  z: number;
}

export interface ParsedStructure {
  pdbId: string;
  atomCount: number;
  /** Coordinates, centered on the centroid and scaled to a target radius. */
  atoms: AtomCoord[];
}

export interface StructureOptions extends RequestOptions {
  /** Cap on rendered atoms; large structures are uniformly downsampled. */
  maxAtoms?: number;
  /** Target bounding radius the coordinates are scaled into. */
  targetRadius?: number;
}

/**
 * Download the open PDB coordinate file for a structure and parse its atoms.
 * The returned coordinates are centered and scaled so the molecular layer can
 * render the real structure directly. Open data, no key required.
 */
export async function fetchStructure(
  pdbId: string,
  opts: StructureOptions = {},
): Promise<ParsedStructure> {
  const { maxAtoms = 1600, targetRadius = 6.5, ...reqOpts } = opts;
  const text = await getText(structureFileUrl(pdbId), {
    cacheMs: 30 * 60_000,
    retries: 2,
    timeoutMs: 12000,
    ...reqOpts,
  });
  const atoms = parsePdbAtoms(text, maxAtoms);
  normalize(atoms, targetRadius);
  return { pdbId: pdbId.toUpperCase(), atomCount: atoms.length, atoms };
}

/** Parse ATOM/HETATM records from PDB text, downsampling to maxAtoms. */
function parsePdbAtoms(text: string, maxAtoms: number): AtomCoord[] {
  const lines = text.split('\n');
  const raw: AtomCoord[] = [];
  for (const line of lines) {
    if (!line.startsWith('ATOM') && !line.startsWith('HETATM')) continue;
    if (line.startsWith('HETATM') && line.slice(17, 20).trim() === 'HOH') continue; // skip water
    const x = Number.parseFloat(line.slice(30, 38));
    const y = Number.parseFloat(line.slice(38, 46));
    const z = Number.parseFloat(line.slice(46, 54));
    if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(z)) continue;
    let element = line.slice(76, 78).trim();
    if (!element) element = line.slice(12, 16).trim().replace(/[^A-Za-z]/g, '').charAt(0);
    raw.push({ element: normalizeElement(element), x, y, z });
  }
  if (raw.length <= maxAtoms) return raw;
  const stride = raw.length / maxAtoms;
  const sampled: AtomCoord[] = [];
  for (let i = 0; i < raw.length; i += stride) sampled.push(raw[Math.floor(i)]);
  return sampled;
}

function normalizeElement(el: string): string {
  if (!el) return 'C';
  return el.charAt(0).toUpperCase() + el.slice(1).toLowerCase();
}

/** Center coordinates on their centroid and scale to a target radius. */
function normalize(atoms: AtomCoord[], targetRadius: number): void {
  if (atoms.length === 0) return;
  let cx = 0;
  let cy = 0;
  let cz = 0;
  for (const a of atoms) {
    cx += a.x;
    cy += a.y;
    cz += a.z;
  }
  cx /= atoms.length;
  cy /= atoms.length;
  cz /= atoms.length;
  let maxR = 0;
  for (const a of atoms) {
    a.x -= cx;
    a.y -= cy;
    a.z -= cz;
    maxR = Math.max(maxR, Math.hypot(a.x, a.y, a.z));
  }
  const scale = maxR > 0 ? targetRadius / maxR : 1;
  for (const a of atoms) {
    a.x *= scale;
    a.y *= scale;
    a.z *= scale;
  }
}
