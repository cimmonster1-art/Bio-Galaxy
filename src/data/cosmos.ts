import { Scale } from '../types';

/**
 * Heliocentric solar system data and the cosmic timeline. Sizes and orbital
 * radii are compressed for legibility, not drawn to true scale, so the inner
 * and outer planets stay visible in one frame. Texture maps are open-licensed
 * and loaded from GitHub at runtime; provenance is recorded for citation.
 */

export interface MoonData {
  name: string;
  radius: number;
  orbit: number;
  speed: number;
}

export interface PlanetData {
  id: string;
  name: string;
  texture: string;
  radius: number;
  /** Orbital radius from the Sun, in compressed scene units. */
  orbit: number;
  /** Relative orbital speed. */
  speed: number;
  /** Axial spin speed. */
  spin: number;
  color: string;
  ring?: { texture: string; inner: number; outer: number };
  moons?: MoonData[];
}

// Open-licensed planetary maps (Planet Pixel Emporium via threex.planets, MIT).
const TEX = 'https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images';
// High-resolution NASA Visible Earth "Blue Marble" set, via the three.js repo.
const EARTH = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets';

export const SUN = {
  texture: `${TEX}/sunmap.jpg`,
  radius: 8,
};

export const EARTH_TEXTURES = {
  day: `${EARTH}/earth_atmos_2048.jpg`,
  clouds: `${EARTH}/earth_clouds_1024.png`,
  night: `${EARTH}/earth_lights_2048.png`,
};

export const PLANETS: PlanetData[] = [
  {
    id: 'mercury',
    name: 'Mercury',
    texture: `${TEX}/mercurymap.jpg`,
    radius: 0.9,
    orbit: 16,
    speed: 0.62,
    spin: 0.4,
    color: '#a8a29e',
  },
  {
    id: 'venus',
    name: 'Venus',
    texture: `${TEX}/venusmap.jpg`,
    radius: 1.5,
    orbit: 23,
    speed: 0.45,
    spin: 0.2,
    color: '#d8b27a',
  },
  {
    id: 'earth',
    name: 'Earth',
    texture: `${EARTH}/earth_atmos_2048.jpg`,
    radius: 1.6,
    orbit: 31,
    speed: 0.38,
    spin: 1.0,
    color: '#3a76c4',
    moons: [{ name: 'Moon', radius: 0.45, orbit: 3, speed: 1.6 }],
  },
  {
    id: 'mars',
    name: 'Mars',
    texture: `${TEX}/marsmap1k.jpg`,
    radius: 1.1,
    orbit: 40,
    speed: 0.31,
    spin: 0.95,
    color: '#c1502e',
    moons: [{ name: 'Phobos', radius: 0.18, orbit: 2, speed: 2.2 }],
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    texture: `${TEX}/jupitermap.jpg`,
    radius: 4.8,
    orbit: 62,
    speed: 0.17,
    spin: 2.2,
    color: '#cda878',
    moons: [
      { name: 'Io', radius: 0.4, orbit: 7, speed: 1.8 },
      { name: 'Europa', radius: 0.38, orbit: 8.6, speed: 1.5 },
      { name: 'Ganymede', radius: 0.55, orbit: 10.4, speed: 1.2 },
      { name: 'Callisto', radius: 0.5, orbit: 12.2, speed: 1.0 },
    ],
  },
  {
    id: 'saturn',
    name: 'Saturn',
    texture: `${TEX}/saturnmap.jpg`,
    radius: 4.1,
    orbit: 84,
    speed: 0.12,
    spin: 2.0,
    color: '#d8c79a',
    ring: { texture: `${TEX}/saturnringcolor.jpg`, inner: 5, outer: 9 },
    moons: [{ name: 'Titan', radius: 0.5, orbit: 11, speed: 1.1 }],
  },
  {
    id: 'uranus',
    name: 'Uranus',
    texture: `${TEX}/uranusmap.jpg`,
    radius: 2.7,
    orbit: 102,
    speed: 0.09,
    spin: 1.6,
    color: '#9fd3d8',
  },
  {
    id: 'neptune',
    name: 'Neptune',
    texture: `${TEX}/neptunemap.jpg`,
    radius: 2.6,
    orbit: 118,
    speed: 0.07,
    spin: 1.5,
    color: '#3b66c4',
    moons: [{ name: 'Triton', radius: 0.4, orbit: 5, speed: 1.3 }],
  },
];

export interface CosmicEra {
  scale: Scale;
  label: string;
  /** Time since the Big Bang, as a readable string. */
  time: string;
  detail: string;
  span: string;
  milestones: readonly string[];
}

// Timeline anchored at the Big Bang, mapped onto the cosmic and early-life
// scales. Times are approximate consensus values.
export const COSMIC_TIMELINE: CosmicEra[] = [
  { scale: Scale.Cosmos, label: 'Early universe', time: '13.8 Gya', span: 'First 1 billion years', detail: 'Matter cools, the first atoms form, and gravity gathers gas into the earliest stars and galaxies.', milestones: ['Big Bang and rapid expansion', 'First atoms after 380,000 years', 'First stars by about 13.6 Gya'] },
  { scale: Scale.Galaxy, label: 'Milky Way', time: '13.6 Gya', span: 'Galactic assembly', detail: 'The Milky Way grows through mergers and sustained star formation, building its halo, disk, and spiral structure.', milestones: ['Old halo stars form', 'Disk and spiral arms assemble', 'Heavy elements enrich later stars'] },
  { scale: Scale.SolarSystem, label: 'Solar System', time: '4.6 Gya', span: 'About 100 million years', detail: 'A molecular cloud collapses. The Sun forms at its center while dust and rock accrete into planets and moons.', milestones: ['Solar nebula collapses', 'Sun begins fusion', 'Planets accrete from the disk'] },
  { scale: Scale.Planet, label: 'Early Earth', time: '4.54 Gya', span: 'First 700 million years', detail: 'Earth differentiates into core, mantle, and crust. Cooling permits a persistent atmosphere and liquid-water oceans.', milestones: ['Moon-forming impact', 'Crust and oceans stabilize', 'Atmosphere evolves'] },
  { scale: Scale.TreeOfLife, label: 'Life diversifies', time: '3.8 Gya', span: 'Billions of years', detail: 'Cellular life changes Earth and branches into the lineages represented in the Tree of Life.', milestones: ['Early microbial life', 'Oxygenic photosynthesis', 'Eukaryotes and multicellular life'] },
];

export function eraForScale(scale: Scale): CosmicEra | undefined {
  // Use the nearest defined era at or below the current scale.
  let era: CosmicEra | undefined;
  for (const e of COSMIC_TIMELINE) {
    if (scale >= e.scale) era = e;
  }
  return era;
}

export const TEXTURE_PROVENANCE = [
  { label: 'Earth (Blue Marble)', source: 'NASA Visible Earth via three.js', url: 'https://github.com/mrdoob/three.js' },
  { label: 'Planet maps', source: 'Planet Pixel Emporium via threex.planets (MIT)', url: 'https://github.com/jeromeetienne/threex.planets' },
];
