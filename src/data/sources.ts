import { DataSource, DataSourceId } from '../types';

/**
 * Registry of the public scientific databases the atlas reads from. Every
 * database-backed object in the UI resolves its provenance through this list,
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
  pubchem: {
    id: 'pubchem',
    name: 'PubChem',
    short: 'PubChem',
    domain: 'Chemistry of molecules and atoms',
    description:
      'Chemical identity for compounds and elements: formulas, weights, SMILES, InChI, and periodic-table data.',
    homepage: 'https://pubchem.ncbi.nlm.nih.gov',
  },
  alphafold: {
    id: 'alphafold',
    name: 'AlphaFold DB',
    short: 'AlphaFold',
    domain: 'Predicted protein structure',
    description:
      'AI-predicted 3D protein structures with per-residue confidence, complementing experimental PDB models.',
    homepage: 'https://alphafold.ebi.ac.uk',
  },
};

export const DATA_SOURCE_ORDER: DataSourceId[] = [
  'uniprot',
  'reactome',
  'rcsb',
  'alphafold',
  'pubchem',
  'ensembl',
  'hpa',
  'ncbi',
];

export function getSource(id: DataSourceId): DataSource {
  return DATA_SOURCES[id];
}
