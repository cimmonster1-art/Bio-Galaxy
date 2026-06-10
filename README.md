# Bio Galaxy

A 3D biological atlas for exploring proteins, pathways, taxonomy, anatomy,
genes, expression, and molecular structures through public scientific datasets.
Bio Galaxy is a visual interface over open biological databases, built around a
real Three.js spatial navigation system that zooms continuously from the Tree of
Life down to a single atom.

## Scale ladder

Cosmos → Galaxy → Solar System → Planet → Tree of Life → Domain → Kingdom →
Phylum → Class → Order → Family → Genus → Species → Organism → Organ System →
Organ → Tissue → Cell → Organelle → Protein Complex → Molecule → Atom

A continuous dive from the Big Bang to a single atom: a deep-space cosmic web, a
heliocentric solar system with open-licensed NASA-derived planet maps, a Blue
Marble Earth, and then the full biological ladder.

## Data sources

Every database-backed object names its provenance. Records are read through
typed client wrappers in `src/data/clients`:

- UniProt: protein sequence and function
- Reactome: pathways and reactions
- RCSB PDB: 3D macromolecular structure
- Ensembl: genes and genomic context
- Human Protein Atlas: tissue and cell expression
- NCBI: literature and taxonomy

All endpoints are public and key free, so no secrets are required.

## Architecture

```
src/
  three/                 Three.js scene system
    BioGalaxyScene.ts    orchestrator: renderer, scene graph, loop, teardown
    ScaleNavigator.ts    eased position along the scale ladder
    core/                SceneLayer contract, lighting rig, camera-scale
                         controller, selection raycaster, performance manager,
                         post-processing (bloom), disposal helpers
    shaders/             open-source GLSL: membrane and nebula materials
    textures/            procedural canvas textures (no binary assets)
    layers/              TreeOfLifeLayer, AnatomyModelLayer, TissueField,
                         CellScene, OrganelleDetailView, ProteinStructureLayer
  data/
    clients/             NCBI Taxonomy, UniProt, Reactome, RCSB, Ensembl, HPA,
                         NCBI wrappers (timeout, retry, cache, normalization)
    taxonomy.ts          curated Tree of Life with NCBI tax ids
    modelCatalog.ts      open-source organism glTF models hosted on GitHub
    search.ts            global atlas search source
    registry.ts          curated subcellular objects
    scales.ts            the 18-step scale ladder
  components/            React shell, panels, and UI primitives
  hooks/                 data-loading helpers
```

Scene logic is kept separate from the React UI panels, and API clients are kept
separate from the rendering layers.

Real open assets are integrated at several scales:

- Cosmic: the solar system uses open-licensed planetary surface maps (Planet
  Pixel Emporium via threex.planets, MIT) and the NASA Visible Earth "Blue
  Marble" set (via the three.js repository), loaded from GitHub at runtime.
- Organism: open glTF meshes hosted on GitHub (three.js example animals and the
  Khronos CC0 Fox) load at the organism scale with animation and cited
  repository and license. The GLTF/GLB/FBX loader architecture and procedural
  fallback let other open models (such as Z-Anatomy) drop in the same way.
- Molecular: real RCSB PDB coordinate files are fetched and parsed into a live
  ball-and-stick model at the protein, molecule, and atom scales.

## Run locally

Prerequisites: Node.js 18+.

```bash
npm install
npm run dev      # http://localhost:3000
```

Other scripts:

```bash
npm run build    # production build
npm run start    # serve the production build
npm run lint     # type check
```
