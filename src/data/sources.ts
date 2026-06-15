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

  // ── Earth-systems, ecology, and biodiversity sources ──────────────────────
  gbif: {
    id: 'gbif',
    name: 'GBIF',
    short: 'GBIF',
    domain: 'Species occurrence records',
    description:
      'Global Biodiversity Information Facility: georeferenced occurrence records aggregated from museums, surveys, and citizen science.',
    homepage: 'https://www.gbif.org',
  },
  iucn: {
    id: 'iucn',
    name: 'IUCN Red List',
    short: 'IUCN',
    domain: 'Extinction-risk assessment',
    description:
      'The IUCN Red List of Threatened Species: global conservation status, population trends, and threat assessments.',
    homepage: 'https://www.iucnredlist.org',
  },
  worldclim: {
    id: 'worldclim',
    name: 'WorldClim',
    short: 'WorldClim',
    domain: 'Global climate surfaces',
    description:
      'High-resolution gridded climate normals — temperature, precipitation, and bioclimatic variables — used for the climate profiles.',
    homepage: 'https://www.worldclim.org',
  },
  ebird: {
    id: 'ebird',
    name: 'eBird',
    short: 'eBird',
    domain: 'Bird observation records',
    description:
      'Cornell Lab of Ornithology citizen-science bird observations: regional checklists, hotspots, and abundance.',
    homepage: 'https://ebird.org',
  },
  naturalearth: {
    id: 'naturalearth',
    name: 'Natural Earth',
    short: 'Natural Earth',
    domain: 'Public-domain map data',
    description:
      'Public-domain vector and raster map data for physical and cultural geography, ecoregions, and coastlines.',
    homepage: 'https://www.naturalearthdata.com',
  },
  osm: {
    id: 'osm',
    name: 'OpenStreetMap',
    short: 'OSM',
    domain: 'Open geographic data',
    description:
      'Collaboratively mapped open geographic data: protected areas, land use, water bodies, and place geometry.',
    homepage: 'https://www.openstreetmap.org',
  },
  nasa: {
    id: 'nasa',
    name: 'NASA EarthData',
    short: 'NASA',
    domain: 'Earth observation',
    description:
      'NASA Earth-observing missions: vegetation, land cover, carbon, surface temperature, and Blue Marble imagery.',
    homepage: 'https://www.earthdata.nasa.gov',
  },
  unep: {
    id: 'unep',
    name: 'UNEP-WCMC',
    short: 'UNEP-WCMC',
    domain: 'Protected areas',
    description:
      'World Database on Protected Areas and Protected Planet: the global registry of conservation areas.',
    homepage: 'https://www.protectedplanet.net',
  },
  ala: {
    id: 'ala',
    name: 'Atlas of Living Australia',
    short: 'ALA',
    domain: 'Australian biodiversity',
    description:
      'Aggregated occurrence, taxonomy, and conservation records for Australian species and ecosystems.',
    homepage: 'https://www.ala.org.au',
  },
  wikidata: {
    id: 'wikidata',
    name: 'Wikidata',
    short: 'Wikidata',
    domain: 'Structured knowledge',
    description:
      'A free, structured knowledge base linking places, taxa, and geographic entities with cross-database identifiers.',
    homepage: 'https://www.wikidata.org',
  },
  wikipedia: {
    id: 'wikipedia',
    name: 'Wikipedia',
    short: 'Wikipedia',
    domain: 'Encyclopedic reference',
    description:
      'Live encyclopedic summaries and Wikimedia Commons imagery for places, biomes, and species.',
    homepage: 'https://en.wikipedia.org',
  },

  // ── Astronomy & star-catalogue sources ────────────────────────────────────
  hyg: {
    id: 'hyg',
    name: 'HYG Database',
    short: 'HYG',
    domain: 'Bright-star catalogue',
    description:
      'A merged star catalogue (Hipparcos, Yale Bright Star, and Gliese) of positions, magnitudes, and spectral classes. CC BY-SA 4.0.',
    homepage: 'https://github.com/astronexus/HYG-Database',
  },
  hipparcos: {
    id: 'hipparcos',
    name: 'Hipparcos',
    short: 'Hipparcos',
    domain: 'Astrometric star catalogue',
    description:
      'ESA’s Hipparcos mission catalogue: precise positions, parallaxes, and proper motions for ~118,000 stars.',
    homepage: 'https://www.cosmos.esa.int/web/hipparcos',
  },
  gaia: {
    id: 'gaia',
    name: 'ESA Gaia',
    short: 'Gaia',
    domain: 'Galactic survey',
    description:
      'ESA’s Gaia mission: a three-dimensional survey of nearly two billion stars with positions, distances, and motions.',
    homepage: 'https://www.cosmos.esa.int/web/gaia',
  },
  simbad: {
    id: 'simbad',
    name: 'SIMBAD',
    short: 'SIMBAD',
    domain: 'Astronomical object database',
    description:
      'CDS Strasbourg database of astronomical objects: identifiers, coordinates, classifications, and bibliography.',
    homepage: 'https://simbad.cds.unistra.fr/simbad/',
  },
  esa: {
    id: 'esa',
    name: 'ESA',
    short: 'ESA',
    domain: 'Space science',
    description:
      'European Space Agency missions and science archives spanning planetary, stellar, and deep-space observation.',
    homepage: 'https://www.esa.int',
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
  // Ecology / Earth-systems sources, ordered for the Ecosystem-scale views.
  'gbif',
  'iucn',
  'worldclim',
  'ebird',
  'nasa',
  'unep',
  'naturalearth',
  'osm',
  'ala',
  'wikidata',
  'wikipedia',
  // Astronomy / star catalogues.
  'hyg',
  'hipparcos',
  'gaia',
  'simbad',
  'esa',
];

export function getSource(id: DataSourceId): DataSource {
  return DATA_SOURCES[id];
}
