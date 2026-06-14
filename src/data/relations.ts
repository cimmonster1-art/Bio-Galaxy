import { BioObject } from '../types';
import { resolveObject } from './resolve';
import { childrenOf, getTaxon } from './taxonomy';

/**
 * The ontology made navigable. Given any selected object, this returns the
 * records "inside" or directly connected to it — the children the bottom-card
 * rail surfaces so every object in the atlas opens onto another set of objects.
 *
 * Connections come from three places, in order of specificity:
 *   1. the Tree of Life (a clade's child taxa),
 *   2. a curated cross-scale CONTAINS map for the physical spine, and
 *   3. a generic by-kind fallback, so a selection is rarely a dead end.
 */

// Representative member sets reused across several parents.
const PLANETS = ['planet:mercury', 'planet:venus', 'planet:earth', 'planet:mars', 'planet:jupiter', 'planet:saturn', 'planet:uranus', 'planet:neptune'];
const BIOMES = ['biome:rainforest', 'biome:reef', 'biome:tundra', 'biome:savanna', 'biome:temperate', 'biome:desert'];
const BIOME_MEMBERS = ['ecosystem:canopy', 'ecosystem:flowering', 'organism:pollinator', 'organism:herbivore', 'organism:predator', 'ecosystem:fungus', 'ecosystem:bacteria', 'ecosystem:soil'];
const ORGAN_SYSTEMS = ['system:skeletal', 'system:nervous', 'system:cardiovascular', 'system:respiratory', 'system:digestive', 'system:urinary'];
const SYSTEM_ORGANS: Record<string, string[]> = {
  'system:nervous': ['organ:brain'],
  'system:cardiovascular': ['organ:heart'],
  'system:respiratory': ['organ:lungs'],
  'system:digestive': ['organ:liver', 'organ:stomach', 'organ:intestines'],
  'system:urinary': ['organ:kidneys'],
};
const TISSUES = ['tissue:muscle', 'tissue:capillary', 'tissue:motor_neuron', 'tissue:ecm'];
const ORGANELLES = ['nucleus', 'mitochondrion', 'golgi', 'er', 'ribosomes', 'cytoskeleton', 'vesicles'];
const COMPLEXES = ['atp_synthase', 'cytochrome_c'];
const MOLECULES = ['dna_helix', 'lipid_membrane', 'water_cluster'];

// Curated parent → children links along the continuous physical spine.
const CONTAINS: Record<string, string[]> = {
  cosmos: ['galaxy'],
  galaxy: ['planet:sun', 'star:0', 'star:1', 'star:2', 'star:3', 'star:4', 'star:5'],
  'planet:sun': PLANETS,
  'planet:earth': BIOMES,
  'biome:rainforest': BIOME_MEMBERS,
  'biome:reef': BIOME_MEMBERS,
  'biome:tundra': BIOME_MEMBERS,
  'biome:savanna': BIOME_MEMBERS,
  'biome:temperate': BIOME_MEMBERS,
  'biome:desert': BIOME_MEMBERS,
  'organism:homo_sapiens': ORGAN_SYSTEMS,
  ...SYSTEM_ORGANS,
  'organ:heart': ['tissue:muscle', 'tissue:capillary', 'tissue:motor_neuron'],
  'tissue:muscle': ['tissue:capillary', 'tissue:motor_neuron', 'tissue:ecm', 'nucleus', 'mitochondrion'],
  mitochondrion: ['atp_synthase', 'cytochrome_c'],
  nucleus: ['dna_helix', 'ribosomes'],
  atp_synthase: ['lipid_membrane', 'water_cluster', 'atom_carbon'],
  cytochrome_c: ['atom_carbon'],
  dna_helix: ['atom_carbon'],
};

/** Generic fallback by object kind, so most selections still open onto more. */
function genericRelated(object: BioObject): string[] {
  switch (object.kind) {
    case 'planet': return PLANETS.filter((id) => id !== object.id);
    case 'star': {
      const i = Number(object.id.replace('star:', ''));
      return Number.isFinite(i) ? [i + 1, i + 2, i + 3, i + 4].map((n) => `star:${n}`) : [];
    }
    case 'biome': return BIOME_MEMBERS;
    case 'system': return SYSTEM_ORGANS[object.id] ?? [];
    case 'organ': return TISSUES;
    case 'tissue': return ORGANELLES;
    case 'organelle': return COMPLEXES;
    case 'complex': return MOLECULES;
    case 'molecule': return ['atom_carbon'];
    default: return [];
  }
}

function relatedIds(object: BioObject): string[] {
  if (object.id.startsWith('taxon:')) {
    const node = getTaxon(object.id.replace(/^taxon:/, ''));
    if (node) {
      const kids = childrenOf(node.id).map((n) => `taxon:${n.id}`);
      if (kids.length) return kids;
    }
  }
  return CONTAINS[object.id] ?? genericRelated(object);
}

/** The connected/child records for a selection, resolved and de-duplicated. */
export function relatedObjects(object: BioObject, limit = 14): BioObject[] {
  const out: BioObject[] = [];
  const seen = new Set<string>([object.id]);
  for (const id of relatedIds(object)) {
    if (seen.has(id)) continue;
    seen.add(id);
    const resolved = resolveObject(id);
    if (resolved) out.push(resolved);
    if (out.length >= limit) break;
  }
  return out;
}
