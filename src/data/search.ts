import { RANK_SCALE, Scale } from '../types';
import { SCALE_LEVELS } from './scales';
import { searchTaxa } from './taxonomy';
import { BIO_OBJECTS } from './registry';

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
    if (obj.name.toLowerCase().includes(q)) {
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

  return results.slice(0, limit);
}

function rankLabel(rank: string): string {
  return rank.charAt(0).toUpperCase() + rank.slice(1);
}
