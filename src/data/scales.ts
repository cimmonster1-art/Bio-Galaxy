import { Scale, ScaleLevel } from '../types';

/**
 * The ordered scale ladder, from the Tree of Life to a single atom. Index ===
 * Scale enum value, so the array can be walked linearly by the navigator and
 * indexed directly by scene layers.
 */
export const SCALE_LEVELS: ScaleLevel[] = [
  {
    scale: Scale.TreeOfLife,
    name: 'Tree of Life',
    magnitude: 'all known life',
    blurb: 'Every branch of life arranged as a luminous phylogenetic galaxy.',
    unit: 'clades',
  },
  {
    scale: Scale.Domain,
    name: 'Domain',
    magnitude: '3 domains',
    blurb: 'The deepest split of life: Bacteria, Archaea, and Eukaryota.',
    unit: 'domains',
  },
  {
    scale: Scale.Kingdom,
    name: 'Kingdom',
    magnitude: 'major kingdoms',
    blurb: 'Broad groupings such as Animalia, Plantae, and Fungi.',
    unit: 'kingdoms',
  },
  {
    scale: Scale.Phylum,
    name: 'Phylum',
    magnitude: 'body plans',
    blurb: 'Lineages sharing a fundamental body plan, such as Chordata.',
    unit: 'phyla',
  },
  {
    scale: Scale.Class,
    name: 'Class',
    magnitude: 'broad classes',
    blurb: 'Classes within a phylum, such as Mammalia among chordates.',
    unit: 'classes',
  },
  {
    scale: Scale.Order,
    name: 'Order',
    magnitude: 'orders',
    blurb: 'Orders grouping related families, such as Primates.',
    unit: 'orders',
  },
  {
    scale: Scale.Family,
    name: 'Family',
    magnitude: 'families',
    blurb: 'Families of closely related genera, such as Hominidae.',
    unit: 'families',
  },
  {
    scale: Scale.Genus,
    name: 'Genus',
    magnitude: 'genera',
    blurb: 'A genus gathering closely related species, such as Homo.',
    unit: 'genera',
  },
  {
    scale: Scale.Species,
    name: 'Species',
    magnitude: 'species',
    blurb: 'A single species, the tip of the phylogenetic tree.',
    unit: 'species',
  },
  {
    scale: Scale.Organism,
    name: 'Organism',
    magnitude: '~1 m',
    blurb: 'An individual organism and its anatomical body plan.',
    unit: 'meters',
  },
  {
    scale: Scale.OrganSystem,
    name: 'Organ System',
    magnitude: '~10 cm',
    blurb: 'Coordinated organs carrying out circulation, signaling, and exchange.',
    unit: 'decimeters',
  },
  {
    scale: Scale.Organ,
    name: 'Organ',
    magnitude: '~1 cm',
    blurb: 'A discrete structure built from cooperating tissue types.',
    unit: 'centimeters',
  },
  {
    scale: Scale.Tissue,
    name: 'Tissue',
    magnitude: '~1 mm',
    blurb: 'Organized layers of cells sharing a common function.',
    unit: 'millimeters',
  },
  {
    scale: Scale.Cell,
    name: 'Cell',
    magnitude: '~10 µm',
    blurb: 'The operational unit of life, bounded by a lipid membrane.',
    unit: 'micrometers',
  },
  {
    scale: Scale.Organelle,
    name: 'Organelle',
    magnitude: '~1 µm',
    blurb: 'Compartments that partition the chemistry of the cell.',
    unit: 'micrometers',
  },
  {
    scale: Scale.ProteinComplex,
    name: 'Protein Complex',
    magnitude: '~10 nm',
    blurb: 'Assemblies of folded chains forming molecular machines.',
    unit: 'nanometers',
  },
  {
    scale: Scale.Molecule,
    name: 'Molecule',
    magnitude: '~1 nm',
    blurb: 'Small molecules and the bonds that hold biology together.',
    unit: 'angstroms',
  },
  {
    scale: Scale.Atom,
    name: 'Atom',
    magnitude: '~100 pm',
    blurb: 'Individual atoms and their bonding electrons.',
    unit: 'picometers',
  },
];

export const FIRST_SCALE = Scale.TreeOfLife;
export const LAST_SCALE = Scale.Atom;

/** Scales that belong to phylogenetic / taxonomic navigation. */
export const TAXONOMY_SCALES: Scale[] = [
  Scale.TreeOfLife,
  Scale.Domain,
  Scale.Kingdom,
  Scale.Phylum,
  Scale.Class,
  Scale.Order,
  Scale.Family,
  Scale.Genus,
  Scale.Species,
];

export function getScaleLevel(scale: Scale): ScaleLevel {
  return SCALE_LEVELS[scale];
}

export function clampScale(scale: number): Scale {
  return Math.max(FIRST_SCALE, Math.min(LAST_SCALE, Math.round(scale))) as Scale;
}

export function isTaxonomyScale(scale: Scale): boolean {
  return scale <= Scale.Species;
}
