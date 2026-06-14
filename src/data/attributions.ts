export type AttributionStatus = 'live' | 'asset' | 'compatible' | 'foundation';

export interface Attribution {
  name: string;
  institution: string;
  role: string;
  url: string;
  status: AttributionStatus;
}

export interface AttributionGroup {
  id: string;
  label: string;
  description: string;
  entries: Attribution[];
}

/**
 * A plain-language inventory of the organizations, datasets, asset providers,
 * and open standards that make the current atlas possible. "Compatible"
 * entries are deliberately distinguished from live integrations.
 */
export const ATTRIBUTION_GROUPS: AttributionGroup[] = [
  {
    id: 'biology',
    label: 'Biological databases',
    description: 'Live, key-free scientific records resolved through typed clients.',
    entries: [
      { name: 'UniProt', institution: 'UniProt Consortium', role: 'Protein sequence, function, and cross references', url: 'https://www.uniprot.org', status: 'live' },
      { name: 'Reactome', institution: 'Reactome collaboration', role: 'Peer reviewed pathways and molecular participants', url: 'https://reactome.org', status: 'live' },
      { name: 'RCSB Protein Data Bank', institution: 'RCSB PDB', role: 'Experimental macromolecular structures and coordinates', url: 'https://www.rcsb.org', status: 'live' },
      { name: 'Ensembl', institution: 'EMBL-EBI and Wellcome Sanger Institute', role: 'Genes, transcripts, and genomic coordinates', url: 'https://www.ensembl.org', status: 'live' },
      { name: 'Human Protein Atlas', institution: 'KTH Royal Institute of Technology', role: 'Tissue and single-cell protein expression', url: 'https://www.proteinatlas.org', status: 'live' },
      { name: 'NCBI Taxonomy and E-utilities', institution: 'NIH National Library of Medicine', role: 'Taxonomy identifiers, lineage, and literature links', url: 'https://www.ncbi.nlm.nih.gov', status: 'live' },
    ],
  },
  {
    id: 'cosmos',
    label: 'Astronomy and planetary context',
    description: 'Sources and reference systems behind the atlas cosmic scales.',
    entries: [
      { name: 'NASA Visible Earth', institution: 'NASA', role: 'Blue Marble Earth imagery', url: 'https://visibleearth.nasa.gov', status: 'asset' },
      { name: 'Planet Pixel Emporium', institution: 'James Hastings-Trew', role: 'Open planetary texture maps via threex.planets', url: 'https://planetpixelemporium.com', status: 'asset' },
      { name: 'Swiss Ephemeris', institution: 'Astrodienst AG', role: 'Open astronomy reference ecosystem; ready for precise ephemeris adapters', url: 'https://www.astro.com/swisseph/', status: 'compatible' },
      { name: 'NASA/JPL Horizons', institution: 'NASA Jet Propulsion Laboratory', role: 'Reference system for future precision orbital adapters', url: 'https://ssd.jpl.nasa.gov/horizons/', status: 'compatible' },
    ],
  },
  {
    id: 'models',
    label: '3D models and anatomy',
    description: 'Open model providers used at organism scale and supported by the loader.',
    entries: [
      { name: 'glTF Sample Models', institution: 'Khronos Group', role: 'CesiumMan and Fox organism-scale models', url: 'https://github.com/KhronosGroup/glTF-Sample-Models', status: 'asset' },
      { name: 'CesiumMan', institution: 'Cesium', role: 'Open licensed rigged human model', url: 'https://github.com/KhronosGroup/glTF-Sample-Models/tree/master/2.0/CesiumMan', status: 'asset' },
      { name: 'three.js example models', institution: 'three.js contributors and mirada', role: 'Animated bird and horse models', url: 'https://github.com/mrdoob/three.js/tree/master/examples/models/gltf', status: 'asset' },
      { name: 'Z-Anatomy', institution: 'Z-Anatomy project', role: 'Open human body surface and skeleton GLBs (CC-BY-SA 4.0) in the Organism screen', url: 'https://github.com/Z-Anatomy/Models-of-human-anatomy', status: 'asset' },
      { name: 'HRA CCF 3D Reference Object Library', institution: 'HuBMAP Consortium', role: 'Open organ GLB models (CC-BY 4.0) fitted inside the body in the Organism screen', url: 'https://github.com/hubmapconsortium/ccf-3d-reference-object-library', status: 'asset' },
    ],
  },
  {
    id: 'platform',
    label: 'Open rendering foundation',
    description: 'The open web tools and standards that render and deliver Bio Galaxy.',
    entries: [
      { name: 'Three.js', institution: 'three.js contributors', role: 'WebGL scene graph, loaders, controls, and post-processing', url: 'https://threejs.org', status: 'foundation' },
      { name: 'glTF', institution: 'Khronos Group', role: 'Open standard for portable 3D scenes and models', url: 'https://www.khronos.org/gltf/', status: 'foundation' },
      { name: 'React', institution: 'Meta and React contributors', role: 'Interface component system', url: 'https://react.dev', status: 'foundation' },
      { name: 'Vite', institution: 'Vite contributors', role: 'Development and production build tooling', url: 'https://vite.dev', status: 'foundation' },
    ],
  },
];

export const ATTRIBUTION_COUNT = ATTRIBUTION_GROUPS.reduce(
  (total, group) => total + group.entries.length,
  0,
);
