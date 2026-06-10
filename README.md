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

The browser clients use an allowlisted same-origin gateway at `/api/science`. It deduplicates concurrent requests, caches successful upstream responses in memory, serves recent stale data when a public provider briefly fails, and never accepts or exposes API keys.

The landing page also credits the astronomy, planetary texture, open model, and rendering ecosystem behind the atlas. Swiss Ephemeris, NASA/JPL Horizons, and Z-Anatomy are explicitly labeled as compatible reference ecosystems rather than live integrations.

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
    textures/            procedural canvas textures plus loaders for the
                         bundled planetary and surface-detail maps
    layers/              TreeOfLifeLayer, AnatomyModelLayer, TissueField,
                         CellScene, OrganelleDetailView, ProteinStructureLayer
  data/
    clients/             NCBI Taxonomy, UniProt, Reactome, RCSB, Ensembl, HPA,
                         NCBI wrappers (timeout, retry, cache, normalization)
    taxonomy.ts          curated Tree of Life with NCBI tax ids
    modelCatalog.ts      open organism glTF models (local Z-Anatomy human and
                         skeleton, plus open animal meshes)
    search.ts            global atlas search source
    registry.ts          curated subcellular objects
    scales.ts            the 18-step scale ladder
  components/            React shell, panels, and UI primitives
  hooks/                 data-loading helpers
```

Scene logic is kept separate from the React UI panels, and API clients are kept
separate from the rendering layers.

Real open assets are integrated at several scales. The cosmic and anatomy
assets are now bundled locally under `public/` (served at `/textures` and
`/models`) rather than fetched from GitHub at runtime, so the dive runs offline
and the imagery is high resolution. Attribution travels with the files in
`public/textures/CREDITS.txt`, `public/textures/anatomy/CREDITS.md`, and
`public/models/ATTRIBUTION.txt`.

- Cosmic: the solar system, Blue Marble Earth, Moon, and Milky Way backdrop use
  the Solar System Scope planetary surface maps (CC BY 4.0, built on NASA
  imagery), bundled locally.
- Organism: the default human body and skeleton are the real Z-Anatomy meshes
  (CC-BY-SA 4.0, derived from BodyParts3D / DBCLS), bundled locally as
  meshopt-compressed glTF and decoded at load time. Open glTF animal meshes
  still load at the organism scale, and the procedural body remains only as the
  offline fallback.
- Cell: organelles are shaded with physically based materials and real
  open-licensed surface-detail maps (three.js MIT textures) for bump and
  roughness, so the cell interior reads as a high-fidelity living structure.
- Molecular: real RCSB PDB coordinate files are fetched and parsed into a live
  ball-and-stick model at the protein, molecule, and atom scales.

Every selectable object opens an interactive card that pairs the curated
metadata and live database records with a Wikipedia thumbnail and extract,
fetched from the public Wikipedia REST API.

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
