// Core domain types for the Bio Galaxy spatial atlas.

/**
 * Continuous biological scale ladder, from the Tree of Life down to a single
 * atom. The index doubles as the position along the zoom axis, so the navigator
 * can ease between adjacent values and layers can index it directly.
 */
export enum Scale {
  Cosmos = 0,
  Galaxy = 1,
  SolarSystem = 2,
  Planet = 3,
  TreeOfLife = 4,
  Domain = 5,
  Kingdom = 6,
  Phylum = 7,
  Class = 8,
  Order = 9,
  Family = 10,
  Genus = 11,
  Species = 12,
  Organism = 13,
  OrganSystem = 14,
  Organ = 15,
  Tissue = 16,
  Cell = 17,
  Organelle = 18,
  ProteinComplex = 19,
  Molecule = 20,
  Atom = 21,
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
    | 'star'
    | 'planet'
    | 'clade'
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
  /** Taxonomic rank when this object is a node in the Tree of Life. */
  rank?: TaxonRank;
  /** NCBI Taxonomy identifier, when known, for deep links and E-utilities. */
  ncbiTaxId?: number;
  summary: string;
  size: string;
  facts: string[];
  /** Primary database provenance, when the object is database-backed. */
  source?: DataSourceId;
  /** Additional cross-referenced sources. */
  crossRefs?: DataSourceId[];
  /** Free-text provenance for objects not backed by a biological database. */
  provenanceNote?: string;
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

/** Linnaean ranks used by the Tree of Life navigation, ordered broad to fine. */
export type TaxonRank =
  | 'domain'
  | 'kingdom'
  | 'phylum'
  | 'class'
  | 'order'
  | 'family'
  | 'genus'
  | 'species';

/** The scale each taxonomic rank maps onto in the ladder. */
export const RANK_SCALE: Record<TaxonRank, Scale> = {
  domain: Scale.Domain,
  kingdom: Scale.Kingdom,
  phylum: Scale.Phylum,
  class: Scale.Class,
  order: Scale.Order,
  family: Scale.Family,
  genus: Scale.Genus,
  species: Scale.Species,
};
