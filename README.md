# Bio Galaxy

**Explore biology as a navigable universe.**

Bio Galaxy is an interactive biological atlas that turns proteins, pathways, cells, organelles, genes, and molecular structures into a navigable 3D visual interface, backed by public scientific databases.

---

## Overview

Most biological databases are powerful but difficult to navigate visually. Bio Galaxy creates a spatial interface for moving between scale, structure, function, and evidence, connecting protein, pathway, genomic, expression, literature, and molecular structure data through public scientific APIs.

## Data Sources

| Source | Provides |
|--------|----------|
| **UniProt** | Protein names, functions, sequences, subcellular locations, cross references |
| **Reactome** | Curated pathways, reactions, molecular events, participating entities |
| **RCSB Protein Data Bank** | Experimentally derived 3D molecular structures and metadata |
| **Ensembl** | Gene locations, transcripts, variants, and genomic references |
| **Human Protein Atlas** | Tissue expression, cell expression, and protein localization context |
| **NCBI E-Utilities** | Literature, taxonomy, genes, and publication references |

## Exploration Layers

Navigate continuously from organism to molecule:

`Human → Organ system → Organ → Tissue → Cell → Organelle → Protein complex → Molecule → Atom`

## Features

- **Protein intelligence** — Search proteins; inspect function, sequence, localization, and cross references through UniProt.
- **Pathway visualization** — Trace molecular events and pathway participants using Reactome data.
- **Structure viewer** — Load real molecular structures from RCSB PDB into an interactive 3D scene.

## Tech Stack

- React + TypeScript
- Tailwind CSS
- Three.js / WebGL for 3D visualization
- Vite

## Disclaimer

For education, visualization, and scientific exploration. Not for medical diagnosis or treatment.
