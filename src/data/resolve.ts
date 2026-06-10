import { BioObject, RANK_SCALE, Scale, TaxonRank } from '../types';
import { BIO_OBJECTS } from './registry';
import { TaxonNode, allTaxa, lineageOf } from './taxonomy';

// Resolves a pick id coming from any scene layer into a full BioObject.
//
//   taxon:<id>      a node in the Tree of Life (clade or species)
//   organism:<id>   an organism-scale body derived from a species node
//   system:<id>     an organ system
//   organ:<id>      an organ
//   <registry id>   a curated subcellular record (organelle, complex, ...)

const RANK_LABEL: Record<TaxonRank, string> = {
  domain: 'Domain',
  kingdom: 'Kingdom',
  phylum: 'Phylum',
  class: 'Class',
  order: 'Order',
  family: 'Family',
  genus: 'Genus',
  species: 'Species',
};

const taxonObjects: Record<string, BioObject> = {};
for (const node of allTaxa()) {
  taxonObjects[`taxon:${node.id}`] = taxonToObject(node);
  if (node.rank === 'species') {
    taxonObjects[`organism:${node.id}`] = speciesToOrganism(node);
  }
}

function taxonToObject(node: TaxonNode): BioObject {
  const lineage = lineageOf(node.id);
  const path = lineage.map((n) => n.name).join(' › ');
  return {
    id: `taxon:${node.id}`,
    name: node.name,
    scale: RANK_SCALE[node.rank],
    kind: node.rank === 'species' ? 'taxon' : 'clade',
    rank: node.rank,
    ncbiTaxId: node.ncbiTaxId,
    summary:
      node.rank === 'species'
        ? `${node.name}${node.common ? ` (${node.common})` : ''}, a species in the Tree of Life.`
        : `${RANK_LABEL[node.rank]} ${node.name}${node.common ? ` (${node.common})` : ''}.`,
    size: `${RANK_LABEL[node.rank]} · lineage depth ${lineage.length}`,
    facts: [
      `Lineage: ${path}`,
      node.common ? `Common name: ${node.common}` : `Rank: ${RANK_LABEL[node.rank]}`,
      node.ncbiTaxId
        ? `NCBI Taxonomy id: ${node.ncbiTaxId}`
        : 'Taxonomy linked through NCBI.',
    ],
    source: 'ncbi',
    crossRefs: node.rank === 'species' ? ['ensembl', 'hpa'] : ['ensembl'],
  };
}

function speciesToOrganism(node: TaxonNode): BioObject {
  return {
    id: `organism:${node.id}`,
    name: node.name,
    scale: Scale.Organism,
    kind: 'organism',
    rank: 'species',
    ncbiTaxId: node.ncbiTaxId,
    summary: `An individual ${node.common ?? node.name} and its anatomical body plan.`,
    size: 'organism scale',
    facts: [
      `Species: ${node.name}`,
      'Anatomy rendered from open 3D models where licensing allows.',
      'Gene and expression context via Ensembl and the Human Protein Atlas.',
    ],
    source: 'ensembl',
    crossRefs: ['hpa', 'ncbi'],
  };
}

// Organ-system and organ records surfaced by the anatomy layer.
const anatomyObjects: Record<string, BioObject> = {
  'system:cardiovascular': {
    id: 'system:cardiovascular',
    name: 'Cardiovascular System',
    scale: Scale.OrganSystem,
    kind: 'system',
    summary: 'The heart and vessels that circulate blood, oxygen, and nutrients.',
    size: 'organ system',
    facts: [
      'Couples the heart to arteries, veins, and capillary beds.',
      'Delivers oxygen and removes metabolic waste.',
      'Expression context available through the Human Protein Atlas.',
    ],
    source: 'hpa',
    crossRefs: ['reactome', 'ncbi'],
  },
  'organ:heart': {
    id: 'organ:heart',
    name: 'Heart',
    scale: Scale.Organ,
    kind: 'organ',
    summary: 'A muscular organ that pumps blood through the cardiovascular system.',
    size: '~12 cm',
    facts: [
      'Four chambers coordinate filling and ejection.',
      'Cardiac muscle is densely packed with mitochondria.',
      'Tissue and cell expression mapped by the Human Protein Atlas.',
    ],
    source: 'hpa',
    crossRefs: ['reactome', 'uniprot'],
  },
};

export function resolveObject(id: string): BioObject | undefined {
  return BIO_OBJECTS[id] ?? taxonObjects[id] ?? anatomyObjects[id];
}
