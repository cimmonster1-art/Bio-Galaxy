# Bio Galaxy

Bio Galaxy is an open-source, interactive 3D biological atlas for exploring
proteins, pathways, taxonomy, anatomy, genes, expression, and molecular
structures through public scientific datasets. Its Three.js spatial navigation
system connects the observable cosmos, the Tree of Life, cells, proteins, and a
single atom in one continuous visual interface.

Bio Galaxy is educational software. It is not medical or diagnostic guidance.
Biological records remain attributable to their authoritative public sources,
and visual scale is compressed where necessary for legibility.

## What the atlas connects

The 22-step scale ladder is:

Cosmos → Galaxy → Solar System → Planet → Tree of Life → Domain → Kingdom →
Phylum → Class → Order → Family → Genus → Species → Organism → Organ System →
Organ → Tissue → Cell → Organelle → Protein Complex → Molecule → Atom

The experience begins with a deep-space cosmic web, a heliocentric Solar System
with open-licensed planet maps, and a Blue Marble Earth. It then crosses the
full taxonomic and biological ladder, ending with molecular structures built
from real RCSB PDB coordinates.

## Live public data sources

Every database-backed object names its provenance. Records are read through
typed client wrappers in `src/data/clients`:

| Source | Atlas context |
| --- | --- |
| [UniProt](https://www.uniprot.org) | Protein sequence, function, accessions, and cross references |
| [Reactome](https://reactome.org) | Peer-reviewed pathways, reactions, and molecular participants |
| [RCSB PDB](https://www.rcsb.org) | Experimentally determined 3D macromolecular structures |
| [Ensembl](https://www.ensembl.org) | Genes, transcripts, and genomic context |
| [Human Protein Atlas](https://www.proteinatlas.org) | Tissue, cell, and protein expression |
| [NCBI](https://www.ncbi.nlm.nih.gov) | Taxonomy identifiers, lineage, literature, and source links |

Browser clients use an allowlisted same-origin gateway at `/api/science`. The
gateway deduplicates concurrent requests, caches successful upstream responses
in memory, can serve recent stale data when a public provider briefly fails,
and never accepts or exposes API keys. All live endpoints are public and key
free, so no secrets are required.

The landing page also credits the astronomy, planetary texture, open model, and
rendering ecosystem behind the atlas. Swiss Ephemeris, NASA/JPL Horizons, and
Z-Anatomy are explicitly labeled as compatible reference ecosystems rather than
live integrations.

## Architecture

```text
src/
  three/                 Three.js scene system
    BioGalaxyScene.ts    renderer, scene graph, loop, and teardown orchestrator
    ScaleNavigator.ts    eased position along the scale ladder
    core/                SceneLayer contract, lighting, camera-scale control,
                         raycasting, performance, post-processing, and disposal
    shaders/             membrane and nebula GLSL materials
    textures/            procedural canvas textures
    layers/              independent scale-range geometry and animation
  data/
    clients/             typed, normalized public-science API wrappers
    sources.ts           authoritative data-source registry
    taxonomy.ts          curated Tree of Life with NCBI taxonomy identifiers
    modelCatalog.ts      credited open-source organism glTF models
    search.ts            global atlas search source
    registry.ts          curated subcellular objects
    scales.ts            the 22-step scale ladder
  components/            React shell, landing page, panels, and UI primitives
  hooks/                 data-loading helpers
```

Scene logic stays separate from React UI panels, and rendering code never calls
a scientific database directly. Each `SceneLayer` owns its geometry, animation,
visibility, interaction, and cleanup. Repeated nodes use instanced meshes, hover
raycasting is throttled, and the render loop pauses when the canvas is offscreen.

Real open assets are integrated at several scales:

- **Cosmic:** open planetary surface maps from Planet Pixel Emporium via
  threex.planets and NASA Visible Earth Blue Marble imagery.
- **Organism:** open glTF meshes from Khronos glTF Sample Models and three.js
  examples, with animation, repository, and license attribution.
- **Molecular:** RCSB PDB coordinate files parsed into interactive ball-and-stick
  models at protein, molecule, and atom scales.

## Search, social, and AI discovery

Bio Galaxy ships a complete discovery layer alongside the WebGL application:

- `index.html` includes descriptive search metadata, crawler directives,
  Open Graph and X/Twitter cards, large-image preview support, a canonical link,
  semantic no-script fallback copy, and Schema.org `WebSite`,
  `SoftwareApplication`, and `WebPage` structured data.
- `public/social-preview.svg` provides a text-based 1200 × 630 social card that can be deployed without binary-file support.
- `public/site.webmanifest` describes the installable web application.
- `public/robots.txt` allows page indexing while excluding the API namespace.
- `public/sitemap.xml` is a static-hosting fallback. The Express production
  server serves a valid sitemap using the deployment's absolute origin.
- `public/llms.txt` gives language models a detailed, accurate technical and
  scientific overview. `public/humans.txt` summarizes the stack and principles.
- API responses receive `X-Robots-Tag: noindex, nofollow`, keeping machine API
  payloads out of search indexes.

For production, set `SITE_URL` to the public HTTPS origin. The server uses it to
produce absolute canonical, social-image, structured-data, robots, and sitemap
URLs. If it is omitted, the server derives the origin from the request host.
Static-only deployments should replace the root-relative URLs in `index.html`,
`public/robots.txt`, and `public/sitemap.xml` with their public origin during
deployment.

## Run locally

Prerequisite: Node.js 18 or newer.

```bash
npm install
npm run dev      # http://localhost:3000
```

Optional deployment configuration:

```bash
SITE_URL="https://your-public-origin.example" npm run build
NODE_ENV=production SITE_URL="https://your-public-origin.example" npm run start
```

Available scripts:

```bash
npm run build    # build the client and bundled production server
npm run start    # serve the production build
npm run lint     # run TypeScript type checking
npm run clean    # remove generated production output
```
