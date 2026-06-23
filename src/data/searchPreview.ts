// Resolves what the search bar should render in 3D for a given query. It maps a
// typed query (or the top-ranked search result) onto a concrete, renderable
// model, fetching real coordinates from public databases where one exists:
//
//   - a protein  -> its alpha-carbon backbone ribbon (RCSB PDB)
//   - a molecule -> its ball-and-stick 3D conformer (PubChem)
//   - a raw amino-acid sequence -> an idealized alpha helix of those residues
//   - an organism / clade -> a DNA double helix (the molecule of heredity)
//   - a star / planet / generic life -> a representative scientific stand-in
//
// The resolver is split in two so the search bar feels instant: `instantPreview`
// is synchronous and always returns something to draw, while `resolvePreview`
// upgrades that to real fetched coordinates when they are available.

import type { SearchResult } from './search';
import { BIO_OBJECTS } from './registry';
import { rcsb, uniprot, pubchem } from './clients';
import type { AtomCoord } from './clients/rcsbClient';

export type PreviewModel =
  | { kind: 'backbone'; chains: AtomCoord[][]; title: string; source: string }
  | { kind: 'ballstick'; atoms: AtomCoord[]; bonds: [number, number][]; title: string; source: string }
  | { kind: 'peptide'; residues: string; title: string; source: string }
  | { kind: 'dna'; title: string; source: string }
  | { kind: 'atom'; protons: number; symbol: string; title: string; source: string }
  | { kind: 'galaxy'; title: string; source: string }
  | { kind: 'star'; color: string; title: string; source: string }
  | { kind: 'planet'; color: string; title: string; source: string }
  | { kind: 'cell'; title: string; source: string };

const AMINO_ACIDS = 'ACDEFGHIKLMNPQRSTVWY';
const AA_RE = new RegExp(`^[${AMINO_ACIDS}]+$`);

/** Treat the raw query as a peptide when it reads as a run of residue letters. */
export function asPeptideSequence(query: string): string | undefined {
  const cleaned = query.toUpperCase().replace(/[\s\-]/g, '');
  if (cleaned.length >= 5 && cleaned.length <= 600 && AA_RE.test(cleaned)) return cleaned;
  return undefined;
}

// A compact periodic table covering the elements a learner is most likely to
// search by name or symbol. Each entry maps to its atomic number (proton count),
// which fully determines the schematic Bohr shell model the preview draws.
export interface ElementHit { symbol: string; protons: number; name: string; }
const ELEMENTS: { symbol: string; protons: number; name: string }[] = [
  { symbol: 'H', protons: 1, name: 'hydrogen' }, { symbol: 'He', protons: 2, name: 'helium' },
  { symbol: 'Li', protons: 3, name: 'lithium' }, { symbol: 'Be', protons: 4, name: 'beryllium' },
  { symbol: 'B', protons: 5, name: 'boron' }, { symbol: 'C', protons: 6, name: 'carbon' },
  { symbol: 'N', protons: 7, name: 'nitrogen' }, { symbol: 'O', protons: 8, name: 'oxygen' },
  { symbol: 'F', protons: 9, name: 'fluorine' }, { symbol: 'Ne', protons: 10, name: 'neon' },
  { symbol: 'Na', protons: 11, name: 'sodium' }, { symbol: 'Mg', protons: 12, name: 'magnesium' },
  { symbol: 'Al', protons: 13, name: 'aluminium' }, { symbol: 'Si', protons: 14, name: 'silicon' },
  { symbol: 'P', protons: 15, name: 'phosphorus' }, { symbol: 'S', protons: 16, name: 'sulfur' },
  { symbol: 'Cl', protons: 17, name: 'chlorine' }, { symbol: 'Ar', protons: 18, name: 'argon' },
  { symbol: 'K', protons: 19, name: 'potassium' }, { symbol: 'Ca', protons: 20, name: 'calcium' },
  { symbol: 'Fe', protons: 26, name: 'iron' }, { symbol: 'Cu', protons: 29, name: 'copper' },
  { symbol: 'Zn', protons: 30, name: 'zinc' }, { symbol: 'I', protons: 53, name: 'iodine' },
  { symbol: 'Au', protons: 79, name: 'gold' }, { symbol: 'U', protons: 92, name: 'uranium' },
];
const ELEMENT_BY_NAME = new Map(ELEMENTS.map((e) => [e.name, e]));
const ELEMENT_BY_SYMBOL = new Map(ELEMENTS.map((e) => [e.symbol.toLowerCase(), e]));

/**
 * Recognize a query that names a chemical element, so "Carbon", "carbon atom",
 * "oxygen", or a bare symbol like "Fe" resolves to a schematic atom. Returns the
 * element (symbol, proton count, name) or undefined.
 */
export function asElement(query: string): ElementHit | undefined {
  const cleaned = query.trim().toLowerCase().replace(/\s+atom$/, '').replace(/^an?\s+/, '').trim();
  if (!cleaned) return undefined;
  const byName = ELEMENT_BY_NAME.get(cleaned);
  if (byName) return byName;
  // Bare symbol: keep it tight (1–2 chars) so it never shadows a peptide or word.
  if (cleaned.length <= 2) return ELEMENT_BY_SYMBOL.get(cleaned);
  return undefined;
}

// Named galaxies plus the structural words that should resolve to a spiral disk.
const GALAXY_NAMES = new Set([
  'milky way', 'andromeda', 'andromeda galaxy', 'whirlpool', 'whirlpool galaxy',
  'triangulum', 'triangulum galaxy', 'pinwheel', 'pinwheel galaxy', 'sombrero',
  'sombrero galaxy', 'cartwheel', 'messier 31', 'm31', 'ngc 224',
]);

/** Recognize a query that names or describes a galaxy. */
export function asGalaxy(query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  if (GALAXY_NAMES.has(q)) return true;
  return /\bgalax(y|ies)\b/.test(q);
}

/** Approximate a star's display colour from its spectral class letter. */
function spectralColor(spectral: string): string {
  const cls = spectral.trim().charAt(0).toUpperCase();
  const table: Record<string, string> = {
    O: '#9bb0ff', B: '#aabfff', A: '#cad7ff', F: '#f8f7ff',
    G: '#fff4ea', K: '#ffd2a1', M: '#ffb56c',
  };
  return table[cls] ?? '#ffd9a0';
}

const PLANET_COLORS: Record<string, string> = {
  'planet:earth': '#3b82c4', 'planet:mars': '#c1440e', 'planet:venus': '#d8a25a',
  'planet:jupiter': '#caa472', 'planet:saturn': '#d8c08a', 'planet:mercury': '#9a8c7c',
  'planet:neptune': '#3f54ba', 'planet:uranus': '#7fd3d6', 'planet:sun': '#ffcf5a',
};

/**
 * Best model we can draw immediately, with no network. Stars, planets, taxa, and
 * raw sequences resolve fully here; proteins and molecules start as a sensible
 * placeholder until `resolvePreview` streams their real coordinates.
 */
export function instantPreview(query: string, result: SearchResult | undefined): PreviewModel | null {
  const peptide = asPeptideSequence(query);
  if (peptide) return { kind: 'peptide', residues: peptide, title: `${peptide.length}-residue peptide`, source: 'Idealized α-helix geometry' };

  // Element and galaxy queries resolve fully and instantly from the typed text,
  // so the smallest and largest scales both render the moment you type them.
  const element = asElement(query);
  if (element) {
    return { kind: 'atom', protons: element.protons, symbol: element.symbol, title: `${element.name.charAt(0).toUpperCase()}${element.name.slice(1)} atom`, source: `Bohr model · Z = ${element.protons}` };
  }
  if (asGalaxy(query)) {
    const name = query.trim().replace(/\b\w/g, (c) => c.toUpperCase());
    return { kind: 'galaxy', title: name, source: 'Procedural spiral-galaxy model' };
  }

  if (!result) return query.trim() ? { kind: 'cell', title: query.trim(), source: 'Bio Galaxy' } : null;

  const { id, label } = result;
  if (id === 'galaxy' || id === 'cosmos') return { kind: 'galaxy', title: label, source: 'Procedural spiral-galaxy model' };
  if (id.startsWith('star:')) {
    const spectral = result.sublabel.split('·')[1]?.trim() ?? 'G';
    return { kind: 'star', color: spectralColor(spectral), title: label, source: 'HYG / bright-star catalogue' };
  }
  if (id.startsWith('planet:')) return { kind: 'planet', color: PLANET_COLORS[id] ?? '#9aa7c4', title: label, source: 'NASA imagery reference' };
  if (id.startsWith('taxon:') || id.startsWith('organism:') || id.startsWith('city:')) {
    return { kind: 'dna', title: label, source: 'NCBI Taxonomy' };
  }
  const obj = BIO_OBJECTS[id];
  if (obj?.kind === 'atom' && obj.element) {
    const el = ELEMENT_BY_SYMBOL.get(obj.element.toLowerCase());
    if (el) return { kind: 'atom', protons: el.protons, symbol: el.symbol, title: label, source: `Bohr model · Z = ${el.protons}` };
  }
  if (obj && (obj.pdbId || obj.accession)) return { kind: 'cell', title: label, source: 'Loading structure…' };
  if (obj && obj.pubchemCid) return { kind: 'cell', title: label, source: 'Loading conformer…' };
  return { kind: 'cell', title: label, source: 'Bio Galaxy' };
}

/**
 * Upgrade a query/result to real fetched coordinates when one exists. Returns
 * `null` when the instant model is already the best available. Honors `signal`
 * so a superseded keystroke's fetch is dropped.
 */
export async function resolvePreview(
  query: string,
  result: SearchResult | undefined,
  signal: AbortSignal,
): Promise<PreviewModel | null> {
  // Peptides, elements, and galaxies are fully resolved by the instant model;
  // skip the network so a chemistry lookup never replaces the atom or disk.
  if (asPeptideSequence(query) || asElement(query) || asGalaxy(query)) return null;

  const obj = result ? BIO_OBJECTS[result.id] : undefined;
  const title = result?.label ?? query.trim();

  // 1. A curated object that maps to a known PDB structure -> backbone ribbon.
  if (obj?.pdbId) {
    const trace = await rcsb.fetchBackboneTrace(obj.pdbId, { signal });
    if (trace.chains.length) return { kind: 'backbone', chains: trace.chains, title, source: `RCSB PDB ${trace.pdbId}` };
  }

  // 2. A curated small molecule -> real PubChem 3D conformer (ball-and-stick).
  if (obj?.pubchemCid) {
    const conf = await pubchem.fetch3DConformer(obj.pubchemCid, { signal });
    return { kind: 'ballstick', atoms: conf.atoms, bonds: conf.bonds, title, source: `PubChem CID ${conf.cid}` };
  }

  // 3. A protein with a UniProt accession but no curated PDB -> resolve one.
  if (obj?.accession) {
    const protein = await uniprot.getProtein(obj.accession, { signal });
    const pdb = protein.pdbIds[0];
    if (pdb) {
      const trace = await rcsb.fetchBackboneTrace(pdb, { signal });
      if (trace.chains.length) return { kind: 'backbone', chains: trace.chains, title, source: `RCSB PDB ${trace.pdbId}` };
    }
  }

  // 4. Free-text query with no curated object: try a live protein, then molecule.
  if (!obj && title) {
    try {
      const hits = await uniprot.searchProteins(title, { signal });
      const withPdb = hits.find((h) => h.pdbIds.length > 0);
      if (withPdb) {
        const trace = await rcsb.fetchBackboneTrace(withPdb.pdbIds[0], { signal });
        if (trace.chains.length) return { kind: 'backbone', chains: trace.chains, title: withPdb.name, source: `RCSB PDB ${trace.pdbId}` };
      }
    } catch {
      // Fall through to a chemistry lookup.
    }
    const cid = await pubchem.findCidByName(title, { signal });
    if (cid) {
      const conf = await pubchem.fetch3DConformer(cid, { signal });
      return { kind: 'ballstick', atoms: conf.atoms, bonds: conf.bonds, title, source: `PubChem CID ${conf.cid}` };
    }
  }

  return null;
}
