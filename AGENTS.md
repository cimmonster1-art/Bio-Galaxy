# 🌌 Bio Galaxy: Developer & Agent Architect's Guide

This document defines the core structural discipline, development regulations, security tenets, and scale calculation profiles governing the **Bio Galaxy** biological observatory.

---

## 🏗️ 1. Absolute Architecture Regulations

### The "No God Files" Directive
* To avoid cognitive overload, keep trace files robust, and stay well within memory constraints, **no single file may exceed 500 lines of code**.
* Any core feature or layout that expands past this limit **must** be broken immediately into modular, focused helper modules (e.g., separating React controllers from canvas drawing helpers, as done in `CellViewport.tsx` and `cellRenderer.ts`).
* **Do not** pack multiple core components into a single file. Each component has an explicit file designation within `src/components/`.

### Directory Layout
```text
/ src
  / components
    - LandingPage.tsx     # Clean, immersive entrance screen (under 400 lines)
    - CellViewport.tsx    # Responsive cellular navigation panel (under 350 lines)
    - InfoModal.tsx       # Educational metadata and formulas dialog (under 135 lines)
    - Header.tsx          # Master navigation controller (under 90 lines)
    - RightSidebar.tsx    # Context-aware factual panel (under 120 lines)
    - LeftSidebar.tsx     # Logarithmic scale selector (under 150 lines)
  / utils
    - cellRenderer.ts     # Independent standard 2D drawing sub-routines (under 450 lines)
  - types.ts              # System-wide static scales and schemas
  - biologicalData.ts     # Primary curriculum data registry
```

---

## 🔒 2. God-Tier Security Tenets

All API and credentials operations within this application follow zero-trust server-side guidelines:

1. **Strict Secrets Decoupling**: 
   * Sensitivity credentials such as `GEMINI_API_KEY` are never marked with a `VITE_` prefix and **never** exposed to the client browser.
2. **Server-Side Proxy Architecture**:
   * Any future API or Gemini transactions **must** be handled strictly inside `server.ts` or backend API routing endpoints (`/api/*`). The client queries only server-secured endpoints.
3. **No Private Forms**:
   * The UI of Bio Galaxy contains **no forms** or dialogs prompting the user to type in their API keys. Values are loaded strictly from the environment context of the host deployment.

---

## 📊 3. Calculation Provenance & Calibration

Measurements shown in-app are strictly calibrated according to:

* **Micro-Scale Coordinates**: Dimension limits match standard structural values mapped in Picometers (pm), Angstroms (Å), Nanometers (nm), and Micrometers (µm) based on reference models from **RCSB PDB** and **UniProt**.
* **Logarithmic Magnification**: Magnification values displayed inside viewport dashboards are calculated using an exponential master grid, transforming meters down to the $10^{-12}$ base.
* **Metabolic Kinetics**: Chemical stoichiometry values shown in-app are formulated based on the biological reaction models curated by the **Reactome** database.
