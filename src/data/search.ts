import { RANK_SCALE, Scale } from '../types';
import { SCALE_LEVELS } from './scales';
import { searchTaxa } from './taxonomy';
import { BIO_OBJECTS } from './registry';
import { ECOLOGY_CITIES } from './ecology';
import { BRIGHT_STAR_CATALOG } from './stars';
import { ELEMENTS } from './elements';
import { NAMED_GALAXIES } from './galaxies';

export interface SearchResult {
  id: string;
  label: string;
  sublabel: string;
  scale: Scale;
}

// Anatomy entries are surfaced by the scene; mirror them here so they are
// reachable from the global search as well.
const ANATOMY: SearchResult[] = [
  { id: 'system:cardiovascular', label: 'Cardiovascular System', sublabel: 'Organ system', scale: Scale.OrganSystem },
  { id: 'organ:heart', label: 'Heart', sublabel: 'Organ', scale: Scale.Organ },
  { id: 'cell:rbc', label: 'Red blood cell', sublabel: 'Cell · erythrocyte', scale: Scale.Cell },
];

// Curated aliases are kept beside search rather than preview rendering so every
// term that can produce a convincing preview can also resolve to a real atlas
// destination. This prevents visually interactive cards from becoming dead ends.
const OBJECT_ALIASES: Record<string, string[]> = {
  mitochondrion: ['mitochondria', 'mitochondrium', 'mitochondrial organelle'],
};

// Marquee cross-scale objects that anchor a signature traversal but live outside
// the registry; surfaced here with their alternate spellings so a search lands
// directly on the curated, navigable record.
const MARQUEE: { id: string; label: string; sublabel: string; scale: Scale; terms: string[] }[] = [
  { id: 'protein:hemoglobin', label: 'Haemoglobin', sublabel: 'Protein complex · oxygen transport', scale: Scale.ProteinComplex, terms: ['haemoglobin', 'hemoglobin', 'hgb', 'hb'] },
  { id: 'mol_heme', label: 'Heme B', sublabel: 'Molecule · iron porphyrin', scale: Scale.Molecule, terms: ['heme', 'haem', 'heme b', 'protoheme'] },
];

/**
 * Search across the whole atlas: the Tree of Life, curated subcellular objects,
 * and anatomy. Returns a ranked, capped list keyed by resolver id so a result
 * can be selected and navigated to directly.
 */
export function searchAtlas(query: string, limit = 10): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: SearchResult[] = [];

  for (const node of searchTaxa(query, limit)) {
    results.push({
      id: `taxon:${node.id}`,
      label: node.name,
      sublabel: node.common ? `${rankLabel(node.rank)} · ${node.common}` : rankLabel(node.rank),
      scale: RANK_SCALE[node.rank],
    });
  }

  for (const obj of Object.values(BIO_OBJECTS)) {
    const aliases = OBJECT_ALIASES[obj.id] ?? [];
    if (obj.name.toLowerCase().includes(q) || aliases.some((alias) => alias.includes(q) || q.includes(alias))) {
      results.push({
        id: obj.id,
        label: obj.name,
        sublabel: SCALE_LEVELS[obj.scale].name,
        scale: obj.scale,
      });
    }
  }

  for (const item of ANATOMY) {
    if (item.label.toLowerCase().includes(q)) results.push(item);
  }

  for (const item of MARQUEE) {
    if (item.terms.some((t) => t === q || t.includes(q))) {
      results.push({ id: item.id, label: item.label, sublabel: item.sublabel, scale: item.scale });
    }
  }

  // Earth Ecology Explorer cities and their key species are entry points
  // into life, reachable directly from search.
  for (const city of ECOLOGY_CITIES) {
    if (city.name.toLowerCase().includes(q) || city.country.toLowerCase().includes(q)) {
      results.push({ id: `city:${city.id}`, label: city.name, sublabel: `Ecology · ${city.country}`, scale: Scale.Biome });
    }
    for (const s of city.species) {
      if (s.name.toLowerCase().includes(q) || s.scientific.toLowerCase().includes(q)) {
        results.push({ id: `organism:eco:${s.id}`, label: s.name, sublabel: `Species · ${city.name}`, scale: Scale.Organism });
      }
    }
  }

  // Chemical elements: every element is reachable by name or symbol and lands at
  // the Atom scale, where its live periodic-table record loads from PubChem.
  for (const el of ELEMENTS) {
    if (el.name.includes(q) || el.symbol.toLowerCase() === q) {
      const name = `${el.name.charAt(0).toUpperCase()}${el.name.slice(1)}`;
      results.push({ id: `atom:${el.symbol}`, label: `${name} atom`, sublabel: `Element · ${el.symbol} · Z = ${el.protons}`, scale: Scale.Atom });
    }
  }

  // Named galaxies land at the Galaxy scale with their own morphology context.
  for (const g of NAMED_GALAXIES) {
    if (g.name.toLowerCase().includes(q) || g.aliases.some((a) => a.includes(q))) {
      results.push({ id: `galaxy:${g.id}`, label: g.name, sublabel: `Galaxy · ${g.morphology}`, scale: Scale.Galaxy });
    }
  }

  // Real catalogue stars are reachable from search and land at the Galaxy scale.
  for (let i = 0; i < BRIGHT_STAR_CATALOG.length; i++) {
    const star = BRIGHT_STAR_CATALOG[i];
    if (star.name.toLowerCase().includes(q)) {
      results.push({
        id: `star:${i}`,
        label: star.name,
        sublabel: `Star · ${star.spectral.trim()} · mag ${star.mag.toFixed(2)}`,
        scale: Scale.Galaxy,
      });
      if (results.length >= limit * 3) break;
    }
  }

  return results.slice(0, limit);
}

function rankLabel(rank: string): string {
  return rank.charAt(0).toUpperCase() + rank.slice(1);
}
