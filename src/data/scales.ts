import { Scale, ScaleLevel } from '../types';

/**
 * The ordered scale ladder. Index === Scale enum value, so the array can be
 * walked linearly by the navigator and indexed directly by scene layers.
 */
export const SCALE_LEVELS: ScaleLevel[] = [
  {
    scale: Scale.Universe,
    name: 'Universe of Life',
    magnitude: 'all known taxa',
    blurb: 'Every branch of life arranged as a field of taxonomic constellations.',
    unit: 'clades',
  },
  {
    scale: Scale.Taxonomy,
    name: 'Taxonomic Tree',
    magnitude: 'kingdom to species',
    blurb: 'Representative lineages grouped by domain, kingdom, and phylum.',
    unit: 'lineages',
  },
  {
    scale: Scale.Organism,
    name: 'Organism',
    magnitude: '~1 m',
    blurb: 'A single multicellular organism and its body plan.',
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

export const FIRST_SCALE = Scale.Universe;
export const LAST_SCALE = Scale.Atom;

export function getScaleLevel(scale: Scale): ScaleLevel {
  return SCALE_LEVELS[scale];
}

export function clampScale(scale: number): Scale {
  return Math.max(FIRST_SCALE, Math.min(LAST_SCALE, Math.round(scale))) as Scale;
}
