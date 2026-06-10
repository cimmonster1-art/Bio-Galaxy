import { Scale } from '../types';

/**
 * Heliocentric solar system data and the cosmic timeline. Sizes and orbital
 * radii are compressed for legibility, not drawn to true scale, so the inner
 * and outer planets stay visible in one frame. Texture maps are open-licensed
 * and bundled locally under public/textures, served by Vite at /textures;
 * provenance is recorded for citation.
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

// Open-licensed planetary maps, bundled locally and served at /textures.
const TEX = '/textures';

export const SUN = {
  texture: `${TEX}/sun.jpg`,
  radius: 8,
};

export const EARTH_TEXTURES = {
  day: `${TEX}/earth_day.jpg`,
  clouds: `${TEX}/earth_clouds.jpg`,
  night: `${TEX}/earth_night.jpg`,
};

// The Moon and the Milky Way panorama, also bundled locally.
export const MOON_TEXTURE = '/textures/moon.jpg';
export const MILKYWAY_TEXTURE = '/textures/milkyway.jpg';

export const PLANETS: PlanetData[] = [
  {
    id: 'mercury',
    name: 'Mercury',
    texture: `${TEX}/mercury.jpg`,
    radius: 0.9,
    orbit: 16,
    speed: 0.62,
    spin: 0.4,
    color: '#a8a29e',
  },
  {
    id: 'venus',
    name: 'Venus',
    texture: `${TEX}/venus_surface.jpg`,
    radius: 1.5,
    orbit: 23,
    speed: 0.45,
    spin: 0.2,
    color: '#d8b27a',
  },
  {
    id: 'earth',
    name: 'Earth',
    texture: `${TEX}/earth_day.jpg`,
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
    texture: `${TEX}/mars.jpg`,
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
    texture: `${TEX}/jupiter.jpg`,
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
    texture: `${TEX}/saturn.jpg`,
    radius: 4.1,
    orbit: 84,
    speed: 0.12,
    spin: 2.0,
    color: '#d8c79a',
    ring: { texture: `${TEX}/saturn_ring.png`, inner: 5, outer: 9 },
    moons: [{ name: 'Titan', radius: 0.5, orbit: 11, speed: 1.1 }],
  },
  {
    id: 'uranus',
    name: 'Uranus',
    texture: `${TEX}/uranus.jpg`,
    radius: 2.7,
    orbit: 102,
    speed: 0.09,
    spin: 1.6,
    color: '#9fd3d8',
  },
  {
    id: 'neptune',
    name: 'Neptune',
    texture: `${TEX}/neptune.jpg`,
    radius: 2.6,
    orbit: 118,
    speed: 0.07,
    spin: 1.5,
    color: '#3b66c4',
    moons: [{ name: 'Triton', radius: 0.4, orbit: 5, speed: 1.3 }],
  },
  {
    // Pluto: a dwarf planet, kept here so the ephemeris scrubber can place it
    // on a compressed orbit just beyond Neptune. There is no dedicated Pluto
    // map in public/textures, so it reuses the local Moon map for its small,
    // grey, icy body rather than pulling in a new asset.
    id: 'pluto',
    name: 'Pluto',
    texture: MOON_TEXTURE,
    radius: 0.8,
    orbit: 132,
    speed: 0.05,
    spin: 1.2,
    color: '#b6ada3',
  },
];

export interface CosmicEra {
  scale: Scale;
  label: string;
  /** Time since the Big Bang, as a readable string. */
  time: string;
  detail: string;
}

// Timeline anchored at the Big Bang, mapped onto the cosmic and early-life
// scales. Times are approximate consensus values.
export const COSMIC_TIMELINE: CosmicEra[] = [
  { scale: Scale.Cosmos, label: 'Big Bang', time: '13.8 Gya', detail: 'Cosmic web and the first galaxies form.' },
  { scale: Scale.Galaxy, label: 'Milky Way', time: '13.6 Gya', detail: 'A barred spiral galaxy assembles from earlier structure.' },
  { scale: Scale.SolarSystem, label: 'Solar System', time: '4.6 Gya', detail: 'The Sun ignites and planets accrete from the disk.' },
  { scale: Scale.Planet, label: 'Earth', time: '4.54 Gya', detail: 'Oceans, atmosphere, and continents take shape.' },
  { scale: Scale.TreeOfLife, label: 'First life', time: '3.8 Gya', detail: 'The earliest cells branch into the Tree of Life.' },
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
  { label: 'Planetary and solar maps', source: 'Solar System Scope (CC BY 4.0, NASA imagery), bundled locally', url: 'https://www.solarsystemscope.com/textures' },
  { label: 'Milky Way panorama', source: 'Solar System Scope (CC BY 4.0, NASA imagery), bundled locally', url: 'https://www.solarsystemscope.com/textures' },
];
