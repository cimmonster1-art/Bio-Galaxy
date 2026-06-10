# Bio Galaxy

A 3D biological atlas for exploring proteins, pathways, taxonomy, anatomy,
genes, expression, and molecular structures through public scientific datasets.
Bio Galaxy is a visual interface over open biological databases, built around a
real Three.js spatial navigation system that zooms continuously from the Tree of
Life down to a single atom.

## Scale ladder

Tree of Life → Domain → Kingdom → Phylum → Class → Order → Family → Genus →
Species → Organism → Organ System → Organ → Tissue → Cell → Organelle → Protein
Complex → Molecule → Atom

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
    registry.ts          curated subcellular objects
    scales.ts            the 18-step scale ladder
  components/            React shell, panels, and UI primitives
  hooks/                 data-loading helpers
```

Scene logic is kept separate from the React UI panels, and API clients are kept
separate from the rendering layers. Organism anatomy is loaded through a
GLTF/GLB/FBX loader architecture (with a procedural fallback) so open models
such as Z-Anatomy can be dropped in with cited provenance.

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
