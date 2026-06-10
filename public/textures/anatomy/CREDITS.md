# Anatomy detail textures

Open-source surface-detail textures used to enrich the 3D anatomy model
(triplanar detail + bump in `BodyExplorer3D`).

| File | Purpose | Source | License |
|------|---------|--------|---------|
| `muscle_fibre.jpg` | Muscle / skin organic fibre detail | three.js `examples/textures/lava/lavatile.jpg` | MIT (three.js) |
| `tissue_grain.jpg` | Bone / organ grain + bump | three.js `examples/textures/disturb.jpg` | MIT (three.js) |

Both files are redistributed from the three.js repository
(https://github.com/mrdoob/three.js), which is licensed under the MIT License.
They are used here purely as procedural surface-detail maps (sampled triplanar,
no UVs required), modulating brightness and driving normal-perturbation relief.
