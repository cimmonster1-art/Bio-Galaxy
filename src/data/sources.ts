import { DataSource, DataSourceId } from '../types';

/**
 * Registry of the public scientific databases and 3D references used by the atlas.
 * Every database-backed object in the UI resolves its provenance through this list,
 * so a source is named in exactly one place.
 */
export const DATA_SOURCES: Record<DataSourceId, DataSource> = {
  uniprot: {
    id: 'uniprot',
    name: 'UniProt',
    short: 'UniProt',
    domain: 'Protein sequence and function',
    description:
      'Curated protein records: accessions, names, functions, sequences, and cross references.',
    homepage: 'https://www.uniprot.org',
  },
  reactome: {
    id: 'reactome',
    name: 'Reactome',
    short: 'Reactome',
    domain: 'Pathways and reactions',
    description: 'Peer reviewed pathway relationships and molecular participants.',
    homepage: 'https://reactome.org',
  },
  rcsb: {
    id: 'rcsb',
    name: 'RCSB PDB',
    short: 'RCSB PDB',
    domain: '3D macromolecular structure',
    description: 'Experimentally determined structures of proteins and complexes.',
    homepage: 'https://www.rcsb.org',
  },
  ensembl: {
    id: 'ensembl',
    name: 'Ensembl',
    short: 'Ensembl',
    domain: 'Genes and genomic context',
    description: 'Gene models, transcripts, and genomic coordinates across species.',
    homepage: 'https://www.ensembl.org',
  },
  hpa: {
    id: 'hpa',
    name: 'Human Protein Atlas',
    short: 'HPA',
    domain: 'Tissue and cell expression',
    description: 'Spatial expression of proteins across tissues and cell types.',
    homepage: 'https://www.proteinatlas.org',
  },
  ncbi: {
    id: 'ncbi',
    name: 'NCBI',
    short: 'NCBI',
    domain: 'Literature and taxonomy',
    description: 'Taxonomy identifiers and links to the primary literature.',
    homepage: 'https://www.ncbi.nlm.nih.gov',
  },
  z_anatomy: {
    id: 'z_anatomy',
    name: 'Z-Anatomy',
    short: 'Z-Anatomy',
    domain: 'Open 3D anatomy',
    description: 'Open human anatomy models used as a reference for layered 3D visualization.',
    homepage: 'https://www.z-anatomy.com',
  },
  bodyparts3d: {
    id: 'bodyparts3d',
    name: 'BodyParts3D',
    short: 'BodyParts3D',
    domain: 'Anatomical structures in 3D',
    description: 'Anatomical concepts represented as labeled segments of a 3D human body model.',
    homepage: 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html',
  },
};

export const DATA_SOURCE_ORDER: DataSourceId[] = [
  'uniprot',
  'reactome',
  'rcsb',
  'ensembl',
  'hpa',
  'ncbi',
  'z_anatomy',
  'bodyparts3d',
];

export function getSource(id: DataSourceId): DataSource {
  return DATA_SOURCES[id];
}
