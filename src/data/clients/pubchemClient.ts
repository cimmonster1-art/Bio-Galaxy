// PubChem client. PubChem is the chemistry hub for the atlas's lower spine: it
// supplies compound identity for molecules (formula, weight, SMILES, InChI,
// synonyms) and periodic-table data for atoms. The PUG-REST API is public and
// requires no key.

import { getJson, getText, RequestOptions } from './http';
import type { AtomCoord } from './rcsbClient';

const PUG = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';

/** Normalized small-molecule record consumed by the molecule detail panel. */
export interface PubChemCompound {
  cid: number;
  title?: string;
  formula?: string;
  molecularWeight?: string;
  iupacName?: string;
  smiles?: string;
  inchiKey?: string;
  charge?: number;
  synonyms: string[];
}

interface PropertyResponse {
  PropertyTable?: {
    Properties?: Array<{
      CID?: number;
      MolecularFormula?: string;
      MolecularWeight?: string | number;
      IUPACName?: string;
      CanonicalSMILES?: string;
      InChIKey?: string;
      Charge?: number;
    }>;
  };
}

interface SynonymResponse {
  InformationList?: { Information?: Array<{ CID?: number; Synonym?: string[] }> };
}

const PROPS = 'MolecularFormula,MolecularWeight,IUPACName,CanonicalSMILES,InChIKey,Charge';

/** Fetch identity and a few synonyms for a PubChem compound id. */
export async function getCompound(
  cid: number,
  opts: RequestOptions = {},
): Promise<PubChemCompound> {
  const propUrl = `${PUG}/compound/cid/${cid}/property/${PROPS}/JSON`;
  const prop = await getJson<PropertyResponse>(propUrl, { cacheMs: 30 * 60_000, ...opts });
  const p = prop.PropertyTable?.Properties?.[0] ?? {};

  let synonyms: string[] = [];
  try {
    const synUrl = `${PUG}/compound/cid/${cid}/synonyms/JSON`;
    const syn = await getJson<SynonymResponse>(synUrl, { cacheMs: 30 * 60_000, ...opts });
    synonyms = (syn.InformationList?.Information?.[0]?.Synonym ?? []).slice(0, 6);
  } catch {
    // Synonyms are a nicety; identity above is the record that matters.
  }

  return {
    cid,
    title: synonyms[0],
    formula: p.MolecularFormula,
    molecularWeight: p.MolecularWeight !== undefined ? String(p.MolecularWeight) : undefined,
    iupacName: p.IUPACName,
    smiles: p.CanonicalSMILES,
    inchiKey: p.InChIKey,
    charge: p.Charge,
    synonyms,
  };
}

/** A bonded 3D conformer for a small molecule: real atom positions and bonds. */
export interface Conformer {
  cid: number;
  atoms: AtomCoord[];
  /** Bonds as index pairs into `atoms`. */
  bonds: [number, number][];
}

/**
 * Resolve a compound name to its PubChem CID. Used so a free-text molecule
 * search ("caffeine", "glucose") can stream a real 3D conformer.
 */
export async function findCidByName(name: string, opts: RequestOptions = {}): Promise<number | undefined> {
  const url = `${PUG}/compound/name/${encodeURIComponent(name)}/cids/JSON`;
  try {
    const data = await getJson<{ IdentifierList?: { CID?: number[] } }>(url, { cacheMs: 30 * 60_000, ...opts });
    return data.IdentifierList?.CID?.[0];
  } catch {
    return undefined;
  }
}

/**
 * Download the computed 3D conformer (SDF) for a compound and parse its atom
 * coordinates and bond table. These are real, experimentally consistent
 * geometries from PubChem, rendered as a ball-and-stick model. No key required.
 */
export async function fetch3DConformer(cid: number, opts: RequestOptions = {}): Promise<Conformer> {
  const url = `${PUG}/compound/cid/${cid}/record/SDF?record_type=3d`;
  const sdf = await getText(url, { cacheMs: 30 * 60_000, retries: 2, timeoutMs: 12000, ...opts });
  const { atoms, bonds } = parseSdf(sdf);
  if (atoms.length === 0) throw new Error(`No 3D conformer for CID ${cid}`);
  return { cid, atoms, bonds };
}

/** Parse the atom and bond blocks of an MDL V2000 SDF molfile. */
function parseSdf(sdf: string): { atoms: AtomCoord[]; bonds: [number, number][] } {
  const lines = sdf.split('\n');
  // Line 4 (index 3) is the counts line: aaabbb… (atoms, bonds), fixed 3-wide.
  const counts = lines[3] ?? '';
  const atomCount = Number.parseInt(counts.slice(0, 3), 10);
  const bondCount = Number.parseInt(counts.slice(3, 6), 10);
  if (!Number.isFinite(atomCount) || atomCount <= 0) return { atoms: [], bonds: [] };

  const atoms: AtomCoord[] = [];
  for (let i = 0; i < atomCount; i++) {
    const line = lines[4 + i] ?? '';
    const x = Number.parseFloat(line.slice(0, 10));
    const y = Number.parseFloat(line.slice(10, 20));
    const z = Number.parseFloat(line.slice(20, 30));
    const element = line.slice(31, 34).trim() || 'C';
    if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(z)) continue;
    atoms.push({ element, x, y, z });
  }

  const bonds: [number, number][] = [];
  for (let i = 0; i < bondCount; i++) {
    const line = lines[4 + atomCount + i] ?? '';
    const a = Number.parseInt(line.slice(0, 3), 10) - 1;
    const b = Number.parseInt(line.slice(3, 6), 10) - 1;
    if (a >= 0 && b >= 0 && a < atoms.length && b < atoms.length) bonds.push([a, b]);
  }
  return { atoms, bonds };
}

/** Normalized chemical-element record consumed by the atom detail panel. */
export interface PubChemElement {
  atomicNumber: number;
  symbol: string;
  name: string;
  atomicMass?: string;
  electronConfiguration?: string;
  electronegativity?: string;
  oxidationStates?: string;
  groupBlock?: string;
  standardState?: string;
}

interface PeriodicTableResponse {
  Table?: {
    Columns?: { Column?: string[] };
    Row?: Array<{ Cell?: string[] }>;
  };
}

// The periodic table is one small payload; fetch it once and index by symbol.
let periodicTable: Promise<Map<string, PubChemElement>> | undefined;

function loadPeriodicTable(opts: RequestOptions): Promise<Map<string, PubChemElement>> {
  if (!periodicTable) {
    periodicTable = getJson<PeriodicTableResponse>(`${PUG}/periodictable/JSON`, {
      cacheMs: 24 * 60 * 60_000,
      ...opts,
    }).then((data) => {
      const cols = data.Table?.Columns?.Column ?? [];
      const idx = (name: string): number => cols.indexOf(name);
      const map = new Map<string, PubChemElement>();
      for (const row of data.Table?.Row ?? []) {
        const cell = row.Cell ?? [];
        const at = (name: string): string | undefined => {
          const i = idx(name);
          return i >= 0 ? cell[i] || undefined : undefined;
        };
        const symbol = at('Symbol');
        if (!symbol) continue;
        map.set(symbol, {
          atomicNumber: Number(at('AtomicNumber') ?? 0),
          symbol,
          name: at('Name') ?? symbol,
          atomicMass: at('AtomicMass'),
          electronConfiguration: at('ElectronConfiguration'),
          electronegativity: at('Electronegativity'),
          oxidationStates: at('OxidationStates'),
          groupBlock: at('GroupBlock'),
          standardState: at('StandardState'),
        });
      }
      return map;
    }).catch((err) => {
      // Allow a later retry rather than caching the rejection forever.
      periodicTable = undefined;
      throw err;
    });
  }
  return periodicTable;
}

/** Fetch periodic-table data for one element by its symbol (e.g. "C"). */
export async function getElement(
  symbol: string,
  opts: RequestOptions = {},
): Promise<PubChemElement> {
  const table = await loadPeriodicTable(opts);
  const element = table.get(symbol);
  if (!element) throw new Error(`Unknown element symbol: ${symbol}`);
  return element;
}
