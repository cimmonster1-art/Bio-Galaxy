// Core domain types for the Bio Galaxy spatial atlas.

/**
 * Continuous *physical* scale ladder — the primary atlas spine. It is one
 * uninterrupted dive through reality, from the observable cosmos down to a
 * single atom, with no relationship views breaking immersion. The index doubles
 * as the position along the zoom axis, so the navigator eases between adjacent
 * values and layers index it directly.
 *
 * Taxonomy (Tree of Life → Species) is deliberately appended *after* the
 * physical spine, beyond LAST_SCALE. It is reachable only through the secondary
 * "Evolution / Classification" mode, never by zooming, so the primary journey
 * stays a continuous travel through scale rather than a jump into a graph.
 */
export enum Scale {
  // ── Primary physical spine (contiguous, walked by the navigator) ──
  Cosmos = 0,
  Galaxy = 1,
  SolarSystem = 2,
  Planet = 3,
  Biome = 4,
  Ecosystem = 5,
  Organism = 6,
  OrganSystem = 7,
  Organ = 8,
  Tissue = 9,
  Cell = 10,
  Organelle = 11,
  ProteinComplex = 12,
  Molecule = 13,
  Atom = 14,
  // ── Secondary taxonomy lane (off the physical spine) ──
  TreeOfLife = 15,
  Domain = 16,
  Kingdom = 17,
  Phylum = 18,
  Class = 19,
  Order = 20,
  Family = 21,
  Genus = 22,
  Species = 23,
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
    | 'biome'
    | 'ecosystem'
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
