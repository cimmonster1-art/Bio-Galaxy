// Core domain types for the Bio Galaxy spatial atlas.

/**
 * Continuous biological scale ladder, from the universe of life down to a
 * single atom. The index doubles as the position along the zoom axis.
 */
export enum Scale {
  Universe = 0,
  Taxonomy = 1,
  Organism = 2,
  OrganSystem = 3,
  Organ = 4,
  Tissue = 5,
  Cell = 6,
  Organelle = 7,
  ProteinComplex = 8,
  Molecule = 9,
  Atom = 10,
}

export interface ScaleLevel {
  scale: Scale;
  /** Short label shown in the navigator, e.g. "Cell". */
  name: string;
  /** Approximate physical magnitude, e.g. "~10 µm". */
  magnitude: string;
  /** One restrained sentence of context. */
  blurb: string;
  /** Metric unit family at this scale. */
  unit: string;
}

/** Canonical public data sources the atlas integrates with. */
export type DataSourceId =
  | 'uniprot'
  | 'reactome'
  | 'rcsb'
  | 'ensembl'
  | 'hpa'
  | 'ncbi';

export interface DataSource {
  id: DataSourceId;
  name: string;
  short: string;
  domain: string;
  description: string;
  homepage: string;
}

/**
 * A selectable biological object surfaced from the scene graph. Scene layers
 * attach a lightweight pick tag to mesh `userData`; the full record is
 * resolved from the registry for the detail panel.
 */
export interface BioObject {
  id: string;
  name: string;
  scale: Scale;
  kind:
    | 'taxon'
    | 'organism'
    | 'system'
    | 'organ'
    | 'tissue'
    | 'cell'
    | 'organelle'
    | 'complex'
    | 'molecule'
    | 'atom';
  summary: string;
  size: string;
  facts: string[];
  /** Primary provenance for the displayed record. */
  source: DataSourceId;
  /** Additional cross-referenced sources. */
  crossRefs?: DataSourceId[];
  /** UniProt accession when this object maps to a protein. */
  accession?: string;
  /** RCSB PDB id when a representative structure exists. */
  pdbId?: string;
  /** Reactome pathway stable id when relevant. */
  reactomeId?: string;
}

/** Minimal payload stamped onto Three.js mesh userData for raycasting. */
export interface PickTag {
  id: string;
  scale: Scale;
}
