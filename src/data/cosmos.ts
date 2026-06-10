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
  color?: string;
}

/**
 * Procedural surface descriptor. The Solar System layer paints a textured map
 * from this offline, so every body looks sampled before (or instead of) the live
 * open-licensed photo map arrives over the network.
 */
export type SurfaceSpec =
  | { kind: 'sun' }
  | { kind: 'rocky'; base: string; highland?: string; craters?: number }
  | { kind: 'gas'; palette: string[]; storm?: { u: number; v: number; color: string; size: number } }
  | { kind: 'ice'; base: string; accent: string };

export interface PlanetData {
  id: string;
  name: string;
  /** Live open-licensed photo map layered on top of the procedural surface. */
  texture: string;
  /** Procedural surface painted offline. */
  surface: SurfaceSpec;
  /** Visible radius in compressed scene units. */
  radius: number;
  /** Semi-major axis in astronomical units; orbit radius is derived from it. */
  au: number;
  /** Sidereal orbital period in days (drives a Keplerian-ordered orbit speed). */
  periodDays: number;
  /** Sidereal rotation period in hours; the sign encodes spin direction. */
  rotationHours: number;
  /** Axial tilt in degrees. */
  tilt: number;
  /** Orbital inclination in degrees, tilting the orbit out of the ecliptic. */
  inclination?: number;
  color: string;
  /** Soft outer haze shell color and strength, for bodies with an atmosphere. */
  atmosphere?: { color: string; opacity: number };
  ring?: { texture: string; inner: number; outer: number };
  moons?: MoonData[];
}

// Open-licensed planetary maps (Planet Pixel Emporium via threex.planets, MIT).
const TEX = 'https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images';
// High-resolution NASA Visible Earth "Blue Marble" set, via the three.js repo.
const EARTH = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets';

export const SUN = {
  texture: `${TEX}/sunmap.jpg`,
  radius: 9,
};

export const EARTH_TEXTURES = {
  day: `${EARTH}/earth_atmos_2048.jpg`,
  clouds: `${EARTH}/earth_clouds_1024.png`,
  night: `${EARTH}/earth_lights_2048.png`,
};

/**
 * Compress a semi-major axis from AU into scene units. A square-root mapping (as
 * in Astro-insight) keeps Mercury readable while still fitting Neptune in frame.
 */
export function auToUnits(au: number): number {
  return 14 + Math.sqrt(au) * 16;
}

// Sizes, orbits, periods, rotations, and tilts follow real values (relative,
// then compressed). Retrograde rotation on Venus and Uranus is preserved as a
// negative rotation period, and Uranus keeps its ~98 degree axial tilt.
export const PLANETS: PlanetData[] = [
  {
    id: 'mercury',
    name: 'Mercury',
    texture: `${TEX}/mercurymap.jpg`,
    surface: { kind: 'rocky', base: '#8a817a', highland: '#bdb2a4', craters: 2600 },
    radius: 0.78,
    au: 0.39,
    periodDays: 88,
    rotationHours: 1407.6,
    tilt: 0.03,
    inclination: 7,
    color: '#a8a29e',
  },
  {
    id: 'venus',
    name: 'Venus',
    texture: `${TEX}/venusmap.jpg`,
    surface: { kind: 'rocky', base: '#c9a96c', highland: '#e7cd9a', craters: 600 },
    radius: 1.5,
    au: 0.72,
    periodDays: 224.7,
    rotationHours: -5832.5,
    tilt: 177.4,
    inclination: 3.4,
    color: '#d8b27a',
    atmosphere: { color: '#e8c98a', opacity: 0.5 },
  },
  {
    id: 'earth',
    name: 'Earth',
    texture: `${EARTH}/earth_atmos_2048.jpg`,
    surface: { kind: 'rocky', base: '#1f4f8b', highland: '#3c7a4e', craters: 0 },
    radius: 1.6,
    au: 1.0,
    periodDays: 365.25,
    rotationHours: 23.93,
    tilt: 23.4,
    color: '#3a76c4',
    atmosphere: { color: '#5aa6ff', opacity: 0.45 },
    moons: [{ name: 'Moon', radius: 0.43, orbit: 3.2, speed: 1.6, color: '#c8c4bc' }],
  },
  {
    id: 'mars',
    name: 'Mars',
    texture: `${TEX}/marsmap1k.jpg`,
    surface: { kind: 'rocky', base: '#a8401f', highland: '#d07a44', craters: 2400 },
    radius: 1.05,
    au: 1.52,
    periodDays: 687,
    rotationHours: 24.6,
    tilt: 25.2,
    inclination: 1.85,
    color: '#c1502e',
    atmosphere: { color: '#e0926a', opacity: 0.22 },
    moons: [{ name: 'Phobos', radius: 0.16, orbit: 2.1, speed: 2.2, color: '#7a6f64' }],
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    texture: `${TEX}/jupitermap.jpg`,
    surface: {
      kind: 'gas',
      palette: ['#d8c39c', '#b89a6e', '#e7dcc4', '#c2a878', '#9c7e58', '#e3d4b6'],
      storm: { u: 0.62, v: 0.62, color: '#c1573a', size: 1 },
    },
    radius: 4.7,
    au: 5.2,
    periodDays: 4331,
    rotationHours: 9.93,
    tilt: 3.1,
    inclination: 1.3,
    color: '#cda878',
    moons: [
      { name: 'Io', radius: 0.36, orbit: 7, speed: 1.8, color: '#e6d27a' },
      { name: 'Europa', radius: 0.34, orbit: 8.6, speed: 1.5, color: '#d9cdb6' },
      { name: 'Ganymede', radius: 0.5, orbit: 10.4, speed: 1.2, color: '#9a8c7e' },
      { name: 'Callisto', radius: 0.46, orbit: 12.2, speed: 1.0, color: '#6e645a' },
    ],
  },
  {
    id: 'saturn',
    name: 'Saturn',
    texture: `${TEX}/saturnmap.jpg`,
    surface: { kind: 'gas', palette: ['#e3c98a', '#cdb47a', '#efe2c0', '#d8c596', '#bda472'] },
    radius: 4.0,
    au: 9.54,
    periodDays: 10747,
    rotationHours: 10.66,
    tilt: 26.7,
    inclination: 2.5,
    color: '#d8c79a',
    ring: { texture: `${TEX}/saturnringcolor.jpg`, inner: 5, outer: 9.2 },
    moons: [{ name: 'Titan', radius: 0.48, orbit: 11, speed: 1.1, color: '#c79a5a' }],
  },
  {
    id: 'uranus',
    name: 'Uranus',
    texture: `${TEX}/uranusmap.jpg`,
    surface: { kind: 'ice', base: '#a7d8d8', accent: '#cdeeec' },
    radius: 2.5,
    au: 19.2,
    periodDays: 30589,
    rotationHours: -17.24,
    tilt: 97.8,
    inclination: 0.77,
    color: '#9fd3d8',
    atmosphere: { color: '#bdeef0', opacity: 0.3 },
  },
  {
    id: 'neptune',
    name: 'Neptune',
    texture: `${TEX}/neptunemap.jpg`,
    surface: { kind: 'ice', base: '#3b66c4', accent: '#6f9bf0' },
    radius: 2.45,
    au: 30.06,
    periodDays: 59800,
    rotationHours: 16.11,
    tilt: 28.3,
    inclination: 1.77,
    color: '#3b66c4',
    atmosphere: { color: '#5a86e6', opacity: 0.34 },
    moons: [{ name: 'Triton', radius: 0.36, orbit: 5, speed: 1.3, color: '#cdd6dd' }],
  },
];

/** Inner edge, outer edge, and population of the main asteroid belt, in AU. */
export const ASTEROID_BELT = { innerAu: 2.1, outerAu: 3.3, count: 1600 };

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
