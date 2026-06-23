# Bio Galaxy

Bio Galaxy is an open-source, interactive 3D biological atlas for exploring the
universe as one continuous physical object — from the observable cosmos down to a
single atom — and, in a parallel mode, the whole Tree of Life. It is a
[Three.js](https://threejs.org)/WebGL spatial interface layered over typed,
normalized clients for public scientific databases. Scenes, navigation, data, and
UI are kept in strictly separated layers so rendering code never touches a network
client and database code never touches the GPU.

Bio Galaxy is **educational software. It is not medical or diagnostic guidance.**
Every database-backed record names its authoritative public source in the
interface, and visual scale and orbital distances are compressed for legibility
rather than drawn true-to-scale.

---

## Table of contents

- [The scale model](#the-scale-model)
- [Data provenance and sources](#data-provenance-and-sources)
- [The same-origin science gateway](#the-same-origin-science-gateway)
- [Typed client layer](#typed-client-layer)
- [The rendering engine](#the-rendering-engine)
- [Scene layers](#scene-layers)
- [Cross-scale knowledge graph and features](#cross-scale-knowledge-graph-and-features)
- [React application shell](#react-application-shell)
- [SEO, social, and AI discovery](#seo-social-and-ai-discovery)
- [Repository layout](#repository-layout)
- [Build, run, and tooling](#build-run-and-tooling)
- [Deployment](#deployment)
- [Testing](#testing)
- [Attribution and licensing](#attribution-and-licensing)

---

## The scale model

The atlas is built around a single enum, `Scale` (`src/types.ts`), whose **integer
value doubles as the position along the zoom axis**. The navigator eases a
floating-point position between adjacent enum values and scene layers index it
directly. There are **23 enum entries split into two lanes**:

### Primary physical spine (14 contiguous steps, indices 0–13)

This is one uninterrupted dive through reality. The camera only ever travels this
lane; relationship/graph views never interrupt it.

| # | Scale | Magnitude | Unit family |
|---|-------|-----------|-------------|
| 0 | Cosmos | 13.8 billion light years | gigaparsecs |
| 1 | Galaxy | ~100,000 light years | light years |
| 2 | Solar System | ~10 billion km | AU |
| 3 | Planet | ~12,700 km | kilometers |
| 4 | Biome | ~100 km | kilometers |
| 5 | Organism | ~1 m | meters |
| 6 | Organ System | ~10 cm | decimeters |
| 7 | Organ | ~1 cm | centimeters |
| 8 | Tissue | ~1 mm | millimeters |
| 9 | Cell | ~10 µm | micrometers |
| 10 | Organelle | ~1 µm | micrometers |
| 11 | Protein Complex | ~10 nm | nanometers |
| 12 | Molecule | ~1 nm | angstroms |
| 13 | Atom | ~100 pm | picometers |

`FIRST_SCALE = Cosmos`, `LAST_SCALE = Atom`. `COSMIC_SCALES` (Cosmos…Planet) and
`PRIMARY_SCALES` (the full spine) are derived in `src/data/scales.ts`.

### Secondary taxonomy lane (9 steps, indices 14–22)

Tree of Life → Domain → Kingdom → Phylum → Class → Order → Family → Genus →
Species. This lane is **appended after `LAST_SCALE` and is never reached by
zooming.** It is entered only through the secondary "Evolution / Classification"
mode, which focuses a clade's lineage without moving the physical camera off its
current scale. `RANK_SCALE` maps each Linnaean `TaxonRank` onto its enum value, and
`isTaxonomyScale(scale)` is simply `scale >= Scale.TreeOfLife`.

### Easing and cross-fade

`ScaleNavigator` (`src/three/ScaleNavigator.ts`) owns the semantics of motion:

- A `SCALE_DISTANCE` lookup gives the target camera distance for each scale (e.g.
  `Cosmos = 620`, `Atom = 20`); `cameraDistance()` lerps between the two bracketing
  entries using the fractional position.
- `update(dt)` eases the continuous position toward the target with
  `pos += diff * min(1, dt * 6)` and reports whether it is still moving.
- `intensityFor(scales)` returns a 0–1 visibility weight for any layer: full
  strength inside the layer's range, linearly fading across a one-step transition
  band on each side. This is what cross-fades adjacent scenes during a dive.

`CameraScaleController` (`src/three/core/CameraScaleController.ts`) wraps a
`PerspectiveCamera` (50° FOV, near 0.1, far 6000) and `OrbitControls` (damping
0.08, pan disabled, distance clamp 6–1000), lerping the camera along its view
vector toward the navigator's target distance each frame and emitting a `settled`
event the frame it locks onto a new discrete scale.

---

## Data provenance and sources

Every database-backed object resolves its provenance through a single registry,
`DATA_SOURCES` in `src/data/sources.ts`, so each source is named in exactly one
place. Sources fall into three groups.

**Molecular / biological (live, key-free APIs):**

| Source | Atlas context |
|--------|---------------|
| [UniProt](https://www.uniprot.org) | Protein accessions, names, function, sequence, cross-references |
| [Reactome](https://reactome.org) | Peer-reviewed pathways, reactions, molecular participants |
| [RCSB PDB](https://www.rcsb.org) | Experimentally determined 3D macromolecular structures + coordinates |
| [AlphaFold DB](https://alphafold.ebi.ac.uk) | AI-predicted protein structures with per-residue confidence |
| [PubChem](https://pubchem.ncbi.nlm.nih.gov) | Compound/element chemistry: formulas, weights, SMILES, InChI |
| [Ensembl](https://www.ensembl.org) | Gene models, transcripts, genomic coordinates |
| [Human Protein Atlas](https://www.proteinatlas.org) | Spatial protein expression across tissues and cell types |
| [NCBI](https://www.ncbi.nlm.nih.gov) | Taxonomy identifiers, lineage, E-utilities, literature |

**Astronomy (curated catalogue data):** [HYG Database](https://github.com/astronexus/HYG-Database)
(v4.1, CC BY-SA 4.0 — Hipparcos + Yale BSC + Gliese merge), Hipparcos/Yale BSC,
and [SIMBAD](https://simbad.u-strasbg.fr/simbad/) for star deep-links.

**Earth-systems / ecology / biodiversity:** GBIF, IUCN Red List, WorldClim, eBird,
Natural Earth, OpenStreetMap, NASA EarthData, UNEP-WCMC, Atlas of Living Australia,
Wikidata, and Wikipedia.

`DATA_SOURCE_ORDER` defines the canonical display order; `getSource(id)` is the
single accessor. Sources that are not live HTTP integrations (astronomy and most
ecology sources) are surfaced as curated, factually-sourced reference data and are
explicitly cited as such rather than presented as live calls.

---

## The same-origin science gateway

Browser clients never call upstream providers directly. Instead they route through
an allowlisted, caching, same-origin gateway at **`GET /api/science?url=<encoded>`**
(`src/server/scienceProxy.ts`).

- **Allowlist enforcement:** the target must be `https:` and its hostname must be in
  `ALLOWED_HOSTS` — `rest.uniprot.org`, `reactome.org`, `data.rcsb.org`,
  `files.rcsb.org`, `rest.ensembl.org`, `www.proteinatlas.org`,
  `eutils.ncbi.nlm.nih.gov`, `pubchem.ncbi.nlm.nih.gov`, `alphafold.ebi.ac.uk`,
  `en.wikipedia.org`. Anything else returns `403`; a malformed URL returns `400`.
- **In-memory cache:** successful responses are stored as `{body, contentType,
  storedAt}` keyed by full URL. Entries are **fresh for 5 minutes** and served
  directly; on a fresh hit the response carries `X-Bio-Galaxy-Cache: HIT`, otherwise
  `MISS`. The cache is bounded to **250 entries** and pruned in insertion order
  (LRU-ish via `Map` re-insertion on write).
- **Request de-duplication:** concurrent requests for the same URL share one
  in-flight promise via a `pending` map, so a thundering herd hits upstream once.
- **Stale-on-error:** if upstream fails but a cached copy under **60 minutes** old
  exists, it is served with `X-Bio-Galaxy-Cache: STALE`; otherwise the gateway
  returns `502` with the upstream error message.
- **Hardening:** upstream fetches use a `Bio-Galaxy/1.0` User-Agent and a 12-second
  `AbortSignal.timeout`. Responses set
  `Cache-Control: public, max-age=60, stale-while-revalidate=300`. **No API keys are
  ever accepted, stored, or forwarded** — every integrated endpoint is public and
  key-free. The `/api` namespace is additionally stamped with
  `X-Robots-Tag: noindex, nofollow` so machine payloads stay out of search indexes.

---

## Typed client layer

`src/data/clients/` holds the typed wrappers, re-exported through a barrel
(`index.ts`) as namespaces — `taxonomy`, `uniprot`, `reactome`, `rcsb`, `ensembl`,
`hpa`, `ncbi`, `pubchem`, `alphafold`, `wikipedia` — so scene and UI code import
from `../data/clients` and never reach into a module directly.

`http.ts` is the shared fetch core:

- `getJson<T>()` / `getText()` apply a per-attempt timeout (default 8 s) via
  `AbortController`, normalize all transport/HTTP failures into a single typed
  `ApiError` (carrying `status` and `url`), and support an optional module-level
  in-memory cache keyed by URL with a TTL (`cacheMs`).
- **Retry with backoff:** transient failures (network error, timeout, `429`, or
  `5xx`) are retried `retries` times (default 1) with exponential backoff
  (`250 * 2 ** attempt` ms). Caller-driven aborts are never retried.
- **Transparent gateway routing:** in the browser, any `https://` URL is rewritten
  to `/api/science?url=…`; on the server the URL is used as-is. This is the single
  switch that makes the same client code work in both environments.

The **RCSB client** (`rcsbClient.ts`) is the most involved: `fetchStructure()`
downloads the public `.pdb` coordinate file, parses `ATOM`/`HETATM` records by
fixed column offsets, **skips water (`HOH`)**, infers the element from columns 76–78
(falling back to the atom name), **uniformly downsamples to `maxAtoms` (default
1600)**, then centers coordinates on their centroid and scales them into a target
bounding radius (default 6.5) so the molecular layer can render the real structure
directly. It stays free of Three.js — it returns plain `AtomCoord[]`.

---

## The rendering engine

`BioGalaxyScene` (`src/three/BioGalaxyScene.ts`) is the orchestrator. It owns the
renderer, scene graph, post-processing, lighting, camera controller, raycaster,
performance gate, and the animation loop, and disposes **every** GPU resource,
observer, listener, and animation frame on teardown.

- **Renderer:** `WebGLRenderer` with `antialias`, `powerPreference:
  'high-performance'`, pixel ratio capped at 2, `ACESFilmicToneMapping` (exposure
  1.1), and `PCFSoftShadowMap`. Background clear color `#02040a` with an
  `FogExp2` of matching color.
- **Environment lighting:** a `PMREMGenerator` renders a `RoomEnvironment` once into
  an env texture for physically based reflections, applied scene-wide and disposed
  immediately after generation.
- **Post-processing** (`core/PostFX.ts`): an `EffectComposer` on a `HalfFloat`
  render target with **4× MSAA on WebGL2**, then `RenderPass` → restrained
  `UnrealBloomPass` (strength 0.42, radius 0.5, threshold 0.82 so only genuinely
  bright emissive elements bloom) → `VignetteShader` → `OutputPass` (ACES + color
  management).
- **Demand rendering** (`core/PerformanceManager.ts`): an `IntersectionObserver`
  (5% threshold) plus `visibilitychange` listener gate the loop — the scene only
  renders when the canvas is on-screen **and** the tab is visible. When settled,
  the pointer is quiet, and no cutscene is playing, the loop counts idle frames and
  **stops itself after 90 idle frames**, restarting on any pointer move, control
  change, scale change, or resize.
- **Picking** (`core/SelectionRaycaster.ts`): pointer events become normalized
  device coordinates; raycasts walk up the parent chain via `findPickTag` to resolve
  a lightweight `PickTag` (`{id, scale}`) stamped on mesh `userData.pick`, with
  dedicated support for **instanced meshes** through `userData.pickInstances[instanceId]`.
  Hover raycasting is **throttled to ~16 Hz** (every 0.06 s of accumulated dt).
- **Loop discipline:** `renderFrame` clamps `dt` to 0.05 s, eases the camera, calls
  `onScaleChange(scale, intensity)` then `update(dt, elapsed)` on every layer,
  advances the nebula shader uniform, throttled-updates hover, renders the composer,
  and decides whether to idle out.

Every layer implements the `SceneLayer` contract (`core/SceneLayer.ts`): a `root`
group, its `activeScales`, `update`, `onScaleChange`, `getPickables`, and `dispose`.
A shared `fadeMaterial` helper eases opacity for cross-fading. Disposal helpers live
in `core/dispose.ts`; lighting in `core/SceneLightingRig.ts`; GLB loading in
`core/glbLoader.ts`; sprite labels in `labels/SpriteLabel.ts`.

---

## Scene layers

Registered in `BioGalaxyScene` and rendered by scale (`src/three/layers/`):

- **CosmosLayer** — the deep-space cosmic web; supports a cinematic mode.
- **StarFieldLayer** — real stars beyond the Oort Cloud, driven by the HYG-derived
  bright-star catalogue.
- **SolarSystemLayer** — heliocentric system with open-licensed planet texture maps;
  sizes and orbits compressed for legibility.
- **EarthLayer** — NASA Blue Marble "blue marble" Earth.
- **BiomeLayer** — living planetary environments (rainforest, reef, tundra…) entered
  from orbit, with selectable variants.
- **TreeOfLifeLayer** — the phylogenetic galaxy; focuses a lineage on selection.
- **AnatomyModelLayer** — loads external organism meshes (glTF/GLB/FBX) with
  provenance, falling back to a procedural body if a host is unreachable; hosts the
  HuBMAP organ models inside the Z-Anatomy body surface.
- **TissueField**, **CellScene** (with `cell/builders.ts`), **OrganelleDetailView** —
  the cellular descent, with selectable organelles.
- **ProteinStructureLayer** — renders parsed PDB coordinates as an interactive
  ball-and-stick model at protein, molecule, and atom scales.

Shaders (`shaders/membrane.ts`, `shaders/nebula.ts`) and procedural canvas textures
(`textures/proceduralTextures.ts`, `textures/loadTexture.ts`) supply materials so
many scenes need no binary assets.

---

## Cross-scale knowledge graph and features

The data layer turns isolated scenes into one continuously traversable graph:

- **`resolve.ts`** resolves any scene pick id into a full `BioObject`, unifying the
  curated registry, anatomy, ecology, science chains, star catalogue, and taxonomy
  (`taxon:`, `organism:`, `system:`, `organ:`, and bare registry ids).
- **`relations.ts`** makes the ontology navigable in both directions: given any
  object it returns what it *contains* (descend) and what it is *part of* (ascend),
  combining the Tree of Life, a curated cross-domain `CONTAINS` graph (ascend derived
  by reversing it), and a by-kind fallback so selections rarely dead-end.
- **`science.ts`** wires two marquee end-to-end chains, each rung carrying real
  database ids: *Heart → Left ventricle → Cardiomyocyte → Sarcomere → Actin filament
  → ACTA1 protein → ACTA1 gene*, and *Carbon → Methane → Glucose → Glycolysis → ATP*.
- **`taxonomy.ts`** is a curated slice of NCBI Taxonomy (domains → *Homo sapiens*
  plus sibling clades) shaped like a paginated client response (`lineageOf`,
  `childrenOf`, `searchTaxa`).
- **`physics.ts`** adds quantitative "why does this behave this way" facets — a
  planet's gravity and escape velocity, an atom's orbitals and quantum numbers, a
  galaxy's rotation curve and dark matter.
- **`copilot.ts`** powers the **Atlas Copilot**, an offline reasoning layer that
  answers questions over the resolved-object corpus and always returns cited
  sources — no external LLM call.
- **`history.ts`** / **CosmicTimeline** / **EvolutionPlayback** drive an interactive
  history cutscene from the Big Bang forward, animating live layers beneath it.
- **`ecology.ts`** powers the Earth Ecology Explorer: real cities as entry points
  into life at the ecosystem scale, each section citing the Earth-systems and
  biodiversity database that substantiates it.
- **`modelCatalog.ts`** / **`organModels.ts`** catalogue CORS-friendly open glTF
  organism meshes and the HuBMAP/HRA CC-BY organ library (shared metre, Y-up frame).
- **`search.ts`** indexes scales, taxa, registry objects, ecology cities, and stars
  for the global search box.

---

## React application shell

`src/main.tsx` mounts `App`, which is a two-view switch (`src/App.tsx`): a
`LandingPage` and the `AtlasShell`, each mounting and disposing its own Three.js
scene on navigation.

`useAtlasController` (`src/hooks/useAtlasController.ts`) is the single source of
truth for atlas state — current scale, selection, hover, focused taxon, loaded
organism model + status, active workspace, cinematic progress, and mobile panel —
and exposes derived state (active sources, lineage, `anatomyScale`,
`coreAnatomyScale`) plus all the navigation callbacks. PDB structures are fetched
reactively through `useAsync` (`src/hooks/useAsync.ts`) whenever a selection carries
a `pdbId`.

`AtlasShell` composes the regions: a header with `GlobalSearch` and `AtlasTopNav`;
either the `LifeCladeExplorer` or the `AtlasWorkspaceView`; a `MobileAtlasDock`
that reflows the navigation and inspection panels for small screens; and the
floating `AtlasCopilot`. Inspection panels live in `src/components/panels/`
(`DetailPanel`, `ContextPanel`, `DataSourcesPanel`, `PhysicsPanel`,
`ScaleNavigatorPanel`, `AnatomyModelsPanel`, `RelatedRail`, `TaxonomyNavigator`,
plus `panels/detail/*` sections for UniProt, AlphaFold, PubChem, structure, pathway,
taxonomy, element, and mitochondrial-protein views). Three error boundaries
(`components/errors/`) isolate app, scene, and component failures so a WebGL or data
fault never blanks the whole atlas. Styling is Tailwind CSS v4 via the
`@tailwindcss/vite` plugin (`src/index.css`).

---

## SEO, social, and AI discovery

A full discovery layer ships alongside the WebGL app:

- `index.html` includes a description, keywords, robots/googlebot directives,
  Open Graph + Twitter cards with large-image preview, a canonical link, a
  `<noscript>` semantic fallback, and Schema.org `WebSite` + `SoftwareApplication`
  + `WebPage` JSON-LD (`@graph`).
- `public/social-preview.svg` is a text-based 1200×630 social card (no binary asset
  required). `public/favicon.svg`, `public/site.webmanifest` (installable PWA
  metadata), `public/robots.txt`, and `public/sitemap.xml` round out static hosting.
- `public/llms.txt` gives language models a technical/scientific overview;
  `public/humans.txt` summarizes the stack and principles.
- In production the Express server (`src/server/seo.ts`) serves a **dynamic**
  `robots.txt` and `sitemap.xml` built from the resolved origin, and
  `injectAbsoluteSeoUrls` rewrites the root-relative canonical, `og:url`,
  social-image, and JSON-LD `@id` URLs to absolute ones using the deployment origin.

`getSiteUrl(req)` resolves the origin from `SITE_URL` if set, otherwise from
`x-forwarded-proto` + `Host` (the app trusts one proxy hop), falling back to
`http://localhost:3000`.

---

## Repository layout

```text
src/
  main.tsx, App.tsx          React entry and landing/atlas view switch
  types.ts                   Scale enum, BioObject, DataSource, TaxonRank, PickTag
  index.css                  Tailwind v4 styles
  server/
    index.ts                 process entry: createApp().listen(PORT)
    app.ts                   Express app (dev = Vite middleware, prod = static + SEO)
    scienceProxy.ts          allowlisted, de-duped, caching /api/science gateway
    seo.ts                   origin resolution, robots.txt, sitemap.xml, URL injection
  three/
    BioGalaxyScene.ts        renderer/loop/teardown orchestrator
    ScaleNavigator.ts        eased position + per-layer cross-fade weights
    core/                    SceneLayer contract, camera-scale control, raycasting,
                             lighting, performance gate, post-FX, GLB loader, dispose
    shaders/                 membrane + nebula GLSL materials
    textures/                procedural canvas textures + loaders
    labels/                  sprite labels
    layers/                  one module per scale range (+ cell/builders.ts)
  data/
    clients/                 typed public-database wrappers + shared http core
    sources.ts               authoritative DataSource registry
    scales.ts                the scale ladder + helpers
    types/registry/anatomy/ecology/science/taxonomy/stars/cosmos/physics/
    relations/resolve/copilot/history/search/modelCatalog/organModels/attributions
    __tests__/               node:test suites
  components/                React shell, landing, panels, explorers, error boundaries
  hooks/                     useAtlasController, useAsync
public/                      favicon, manifest, robots, sitemap, llms/humans.txt,
                             social-preview.svg, models/*.glb, textures/anatomy/*
docs/                        attribution notes (e.g. HYG catalogue)
```

---

## Build, run, and tooling

**Stack:** React 19, TypeScript ~5.8 (strict bundler resolution, `noEmit`), Three.js
0.184, Vite 6, Tailwind CSS v4, Express 4, `lucide-react` icons. Dev and prod share
one Express entry; the dev server runs Vite in middleware mode, prod serves the Vite
build plus the SEO-injecting catch-all. The production server is bundled to a single
CommonJS file with esbuild.

**Prerequisite:** Node.js 18 or newer (the gateway uses the built-in `fetch` and
`AbortSignal.timeout`).

```bash
npm install
npm run dev      # tsx src/server/index.ts → http://localhost:3000
```

Scripts (`package.json`):

```bash
npm run dev      # Express + Vite middleware dev server (tsx)
npm run build    # vite build, then esbuild-bundle the server to dist/server.cjs
npm run start    # node dist/server.cjs (production)
npm run lint     # tsc --noEmit (type-check only)
npm run test     # node test runner via tsx over data/server/component suites
npm run clean    # rm -rf dist
```

`vite.config.ts` aliases `@` to the repo root, splits `three` and `react`/`react-dom`
into their own manual chunks to keep the main bundle cacheable, and gates HMR/file
watching behind `DISABLE_HMR` to avoid flicker in constrained environments.

---

## Deployment

Bio Galaxy needs **no secrets** — every integrated endpoint is public and key-free.

```bash
SITE_URL="https://your-public-origin.example" npm run build
NODE_ENV=production SITE_URL="https://your-public-origin.example" npm run start
```

- `PORT` — port the production server binds (`0.0.0.0`); defaults to `3000`.
- `SITE_URL` — canonical public HTTPS origin (no path, no trailing slash). The
  server uses it to emit absolute canonical, social-image, JSON-LD, robots, and
  sitemap URLs. If omitted, the origin is derived from `x-forwarded-proto` + `Host`.

For **static-only** hosting (no Node server), replace the root-relative URLs in
`index.html`, `public/robots.txt`, and `public/sitemap.xml` with your public origin
at deploy time, since the dynamic injection only runs under the Express server.

See `.env.example` for the (small) configuration surface.

---

## Testing

Tests use the built-in Node test runner via `tsx`:

```bash
npm run test
```

Suites cover the data layer (`src/data/__tests__/`: `physics`, `relations`, `stars`,
`taxonomy`), the server SEO helpers (`src/server/__tests__/seo.test.ts`), and the
React error boundaries (`src/components/errors/__tests__/`).

---

## Attribution and licensing

Provenance is a first-class concern. The `AttributionSection` /
`AttributionStatus` model (`src/data/attributions.ts`) labels each credit as
**live** (active API integration), **asset** (bundled/loaded open asset),
**compatible** (a reference ecosystem we are interoperable with but do not call
live), or **foundation** (the rendering/scientific stack we build on). Swiss
Ephemeris, NASA/JPL Horizons, and Z-Anatomy are explicitly labeled *compatible*
reference ecosystems, not live integrations.

Bundled and loaded assets keep their own attribution and license files:
`public/models/ATTRIBUTION.txt`, `public/textures/anatomy/CREDITS.md`, and
`docs/HYG_CATALOG_ATTRIBUTION.md`. Public data providers remain the authoritative
sources for their own records.
</content>
</invoke>
