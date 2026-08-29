# Bio Galaxy visual-quality pass — 2026-08-30

This branch replaces the generic recoloured-forest ecology implementation with biome-specific environments and removes mislabeled wildlife substitutions.

## What changed

- Coral reef now renders coral branches, seagrass, reef rock and underwater particulates rather than terrestrial trees.
- Tundra uses rock, lichen/cushion vegetation and snow-like airborne particles with no forest canopy.
- Desert uses dune terrain, cactus geometry, rock and dust instead of reduced-density forest clutter.
- Savanna, temperate forest and rainforest use distinct vegetation structures and densities.
- Open fauna assets preserve their actual identity. A horse is no longer used as a deer and a fox is no longer described as a wolf.
- Animated GLB fauna retain their first source animation when available.
- Global bloom/vignette is reduced so physical models read as scientific visualization rather than neon game assets.

Existing high-quality layers such as NASA-textured Earth, the Z-Anatomy/HuBMAP anatomy explorer, the volumetric cell and data-driven molecular/protein layers are retained rather than replaced for novelty.
