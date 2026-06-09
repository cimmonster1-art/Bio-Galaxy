# Bio Galaxy

A 3D biological atlas for exploring proteins, pathways, cells, genes, organisms,
and molecular structures through public scientific datasets. Bio Galaxy is a
visual interface over open biological databases, built around a real Three.js
spatial navigation system that zooms continuously from the universe of life down
to a single atom.

## Scale ladder

Universe of Life → Taxonomic Tree → Organism → Organ System → Organ → Tissue →
Cell → Organelle → Protein Complex → Molecule → Atom

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
    BioGalaxyScene.ts    renderer, camera, controls, lifecycle, raycasting
    ScaleNavigator.ts    scale transitions and camera targets
    layers/              OrganismField, TissueField, CellScene,
                         OrganelleDetailView, ProteinStructureLayer
    core/                SceneLayer contract and disposal helpers
  data/
    clients/             UniProt, Reactome, RCSB, Ensembl, HPA, NCBI wrappers
    registry.ts          curated biological objects
    organisms.ts         sampled taxonomy for the organism field
    scales.ts            the scale ladder
  components/            React shell, panels, and UI primitives
  hooks/                 data-loading helpers
```

Scene logic is kept separate from the React UI panels, and API clients are kept
separate from the rendering layers.

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
