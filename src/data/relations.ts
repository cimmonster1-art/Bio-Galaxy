import { BioObject } from '../types';
import { resolveObject } from './resolve';
import { childrenOf, getTaxon, lineageOf } from './taxonomy';

/**
 * The ontology made navigable — in both directions. Given any selected object,
 * this returns the records inside it (descend) AND the records it is part of
 * (ascend), so a student never hits a dead end: descend from an organ to the gene
 * that builds it, or climb from a single atom up through chemistry into living
 * pathways and beyond.
 *
 * Links come from three places:
 *   1. the Tree of Life (a clade's child taxa and parent lineage),
 *   2. a curated cross-scale, cross-domain CONTAINS graph, and
 *   3. a generic by-kind fallback, so a selection is rarely a dead end.
 * The ascend direction is derived automatically by reversing CONTAINS.
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

// Curated parent → children links. The spine runs cosmos → atom, but the graph
// also threads two deep cross-domain chains (heart → ACTA1 gene; carbon → ATP)
// and the cycles that connect chemistry back into living biology.
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

  // Biology deep chain: heart → left ventricle → cardiomyocyte → sarcomere →
  // actin filament → actin protein → ACTA1 gene.
  'organ:heart': ['region:left_ventricle', 'tissue:muscle', 'tissue:capillary'],
  'region:left_ventricle': ['cell:cardiomyocyte', 'tissue:muscle'],
  'cell:cardiomyocyte': ['organelle:sarcomere', 'nucleus', 'mitochondrion'],
  'organelle:sarcomere': ['complex:actin_filament'],
  'complex:actin_filament': ['protein:actin'],
  'protein:actin': ['gene:acta1', 'mol_glycine', 'atom_carbon'],
  'gene:acta1': ['protein:actin', 'dna_helix'],
  'tissue:muscle': ['cell:cardiomyocyte', 'tissue:capillary', 'tissue:motor_neuron', 'tissue:ecm'],

  // Biology: brain → cortex → neuron → synapse → acetylcholine (into chemistry).
  'organ:brain': ['region:cerebral_cortex'],
  'region:cerebral_cortex': ['cell:neuron'],
  'cell:neuron': ['organelle:synapse', 'nucleus', 'mitochondrion'],
  'organelle:synapse': ['mol_acetylcholine'],
  'mol_acetylcholine': ['atom_carbon'],

  // Biology: lungs → alveolus → oxygen → water.
  'organ:lungs': ['region:alveolus'],
  'region:alveolus': ['mol_oxygen'],
  'mol_oxygen': ['water_cluster'],

  // Cell interior.
  mitochondrion: ['atp_synthase', 'cytochrome_c'],
  nucleus: ['dna_helix', 'ribosomes'],
  atp_synthase: ['mol_atp', 'lipid_membrane', 'water_cluster', 'atom_carbon'],
  cytochrome_c: ['atom_carbon'],
  dna_helix: ['gene:acta1', 'atom_carbon'],

  // Chemistry: carbon branches into methane and benzene; the methane chain runs
  // carbon → methane → glucose → glycolysis → ATP, cycling back to its enzyme.
  atom_carbon: ['mol_methane', 'mol_benzene', 'dna_helix'],
  mol_methane: ['mol_glucose', 'atom_carbon'],
  mol_benzene: ['atom_carbon'],
  mol_glucose: ['pathway_glycolysis', 'atom_carbon'],
  pathway_glycolysis: ['mol_atp', 'mol_glucose'],
  mol_atp: ['atp_synthase', 'atom_carbon'],
  mol_glycine: ['protein:actin', 'atom_carbon'],
};

// Reverse the CONTAINS graph once so every link is traversable upward too.
const PARENTS: Record<string, string[]> = {};
for (const [parent, children] of Object.entries(CONTAINS)) {
  for (const child of children) {
    (PARENTS[child] ??= []).push(parent);
  }
}

/** Generic descend fallback by object kind, so most selections open onto more. */
function genericChildren(object: BioObject): string[] {
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

/** Generic ascend fallback for objects with no curated parent. */
function genericParents(object: BioObject): string[] {
  switch (object.kind) {
    case 'planet': return object.id === 'planet:sun' ? ['galaxy'] : ['planet:sun'];
    case 'star': return ['galaxy'];
    case 'galaxy': return ['cosmos'];
    case 'biome': return ['planet:earth'];
    case 'ecosystem': return ['planet:earth'];
    case 'system': return ['organism:homo_sapiens'];
    case 'atom': return ['mol_methane', 'dna_helix'];
    default: return [];
  }
}

function childIds(object: BioObject): string[] {
  if (object.id.startsWith('taxon:')) {
    const node = getTaxon(object.id.replace(/^taxon:/, ''));
    if (node) {
      const kids = childrenOf(node.id).map((n) => `taxon:${n.id}`);
      if (kids.length) return kids;
    }
  }
  return CONTAINS[object.id] ?? genericChildren(object);
}

function parentIds(object: BioObject): string[] {
  if (object.id.startsWith('taxon:')) {
    const lineage = lineageOf(object.id.replace(/^taxon:/, ''));
    const parent = lineage.at(-2);
    return parent ? [`taxon:${parent.id}`] : [];
  }
  return PARENTS[object.id] ?? genericParents(object);
}

function resolveAll(ids: string[], excludeId: string, limit: number): BioObject[] {
  const out: BioObject[] = [];
  const seen = new Set<string>([excludeId]);
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    const resolved = resolveObject(id);
    if (resolved) out.push(resolved);
    if (out.length >= limit) break;
  }
  return out;
}

/** Both directions of the graph for a selection: what it is part of, and what is inside it. */
export function relatedGroups(object: BioObject): { up: BioObject[]; down: BioObject[] } {
  return {
    up: resolveAll(parentIds(object), object.id, 6),
    down: resolveAll(childIds(object), object.id, 14),
  };
}

/** The records inside / connected to a selection (descend direction). */
export function relatedObjects(object: BioObject, limit = 14): BioObject[] {
  return resolveAll(childIds(object), object.id, limit);
}
