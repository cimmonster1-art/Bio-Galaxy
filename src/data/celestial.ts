import * as THREE from 'three';
import { BioObject, DataSourceId, Scale } from '../types';
import { BRIGHT_STAR_CATALOG, BrightStar } from './stars/brightStarCatalog';

/**
 * Celestial catalogue for the Cosmos / Galaxy scales — the map beyond the Oort
 * Cloud, ported from the Astro Insight celestial sphere. It exposes the 1,000
 * brightest stars (HYG Database v4.1, CC BY-SA 4.0; see
 * docs/HYG_CATALOG_ATTRIBUTION.md) plus a compact, factual deep-sky catalogue of
 * notable galaxies, nebulae, clusters, and exotic objects.
 *
 * Every star and body is clickable in the scene, resolvable as a BioObject, and
 * indexed into the copilot corpus so the assistant is grounded in real star
 * catalogues with cited astronomy sources (HYG, Hipparcos, Gaia, SIMBAD, NASA).
 */

export { BRIGHT_STAR_CATALOG };
export type { BrightStar };

const STAR_SOURCES: DataSourceId[] = ['hyg', 'hipparcos', 'gaia', 'simbad', 'nasa', 'wikidata'];

/** Equatorial (RA hours, Dec degrees) → a 3D position on a sphere of `radius`. */
export function raDecToVec3(raH: number, decDeg: number, radius: number): THREE.Vector3 {
  const ra = (raH / 24) * Math.PI * 2;
  const dec = THREE.MathUtils.degToRad(decDeg);
  return new THREE.Vector3(
    radius * Math.cos(dec) * Math.cos(ra),
    radius * Math.sin(dec),
    -radius * Math.cos(dec) * Math.sin(ra),
  );
}

/** Plain-language description of a spectral class's first letter. */
function spectralClass(spectral: string): string {
  const cls = spectral.trim().charAt(0).toUpperCase();
  const map: Record<string, string> = {
    O: 'a very hot, blue O-type star',
    B: 'a hot, blue-white B-type star',
    A: 'a white A-type star',
    F: 'a yellow-white F-type star',
    G: 'a yellow G-type star, like the Sun',
    K: 'a cool, orange K-type star',
    M: 'a cool, red M-type star',
    W: 'a Wolf–Rayet star',
  };
  return map[cls] ?? `a ${spectral} star`;
}

/** A star is "named" when it has a proper name rather than a catalogue id. */
function isNamedStar(name: string): boolean {
  return !/^(HIP|HD|HR|NGC|TYC|PSR|Gliese|GJ)\b/i.test(name);
}

function starToObject(star: BrightStar, index: number): BioObject {
  return {
    id: `star:${index}`,
    name: star.name,
    scale: Scale.Galaxy,
    kind: 'star',
    summary: `${star.name} is ${spectralClass(star.spectral)} (spectral type ${star.spectral}), apparent magnitude ${star.mag.toFixed(2)}.`,
    size: `Spectral ${star.spectral} · mag ${star.mag.toFixed(2)}`,
    facts: [
      `Right ascension: ${star.raH.toFixed(3)} h.`,
      `Declination: ${star.decDeg.toFixed(2)}°.`,
      `Apparent magnitude: ${star.mag.toFixed(2)} (lower is brighter).`,
      `Spectral classification: ${star.spectral}.`,
      'Positions and magnitudes from the HYG Database (Hipparcos, Yale Bright Star, Gliese).',
    ],
    source: 'hyg',
    crossRefs: STAR_SOURCES.filter((s) => s !== 'hyg'),
    provenanceNote: 'Star data: HYG Database v4.1 (CC BY-SA 4.0); cross-referenced via Hipparcos, Gaia, and SIMBAD.',
  };
}

/** Resolve `star:<index>` to a full BioObject, synthesizing on demand. */
export function starObjectByIndex(index: number): BioObject | undefined {
  const star = BRIGHT_STAR_CATALOG[index];
  return star ? starToObject(star, index) : undefined;
}

/** Named stars only, for the corpus and search (all 1,000 remain clickable). */
export const NAMED_STAR_OBJECTS: BioObject[] = BRIGHT_STAR_CATALOG
  .map((star, i) => ({ star, i }))
  .filter(({ star }) => isNamedStar(star.name))
  .map(({ star, i }) => starToObject(star, i));

// ── Deep-sky catalogue: notable bodies beyond the Oort Cloud ─────────────────

export interface DeepSkyObject {
  id: string;
  name: string;
  type: string;
  raH: number;
  decDeg: number;
  /** 'galaxy' renders/classifies as a galaxy; 'cosmos' for clusters/nebulae/etc. */
  kind: 'galaxy' | 'cosmos';
  distance: string;
  description: string;
  color: number;
  sources: DataSourceId[];
}

export const DEEP_SKY: DeepSkyObject[] = [
  { id: 'm31', name: 'Andromeda Galaxy (M31)', type: 'Barred spiral galaxy', raH: 0.712, decDeg: 41.27, kind: 'galaxy', distance: '~2.5 million light-years', description: 'The nearest large galaxy to the Milky Way and the most distant object visible to the unaided eye.', color: 0xbfd3ff, sources: ['nasa', 'esa', 'simbad', 'wikidata'] },
  { id: 'm33', name: 'Triangulum Galaxy (M33)', type: 'Spiral galaxy', raH: 1.564, decDeg: 30.66, kind: 'galaxy', distance: '~2.7 million light-years', description: 'The third-largest galaxy in the Local Group, after Andromeda and the Milky Way.', color: 0xbfd3ff, sources: ['nasa', 'esa', 'simbad'] },
  { id: 'm51', name: 'Whirlpool Galaxy (M51)', type: 'Grand-design spiral galaxy', raH: 13.498, decDeg: 47.20, kind: 'galaxy', distance: '~23 million light-years', description: 'A face-on spiral interacting with a smaller companion galaxy, NGC 5195.', color: 0xc8d8ff, sources: ['nasa', 'esa', 'simbad'] },
  { id: 'm87', name: 'Virgo A (M87)', type: 'Supergiant elliptical galaxy', raH: 12.514, decDeg: 12.39, kind: 'galaxy', distance: '~53 million light-years', description: 'Hosts the supermassive black hole first directly imaged by the Event Horizon Telescope.', color: 0xffe6b8, sources: ['nasa', 'esa', 'simbad'] },
  { id: 'lmc', name: 'Large Magellanic Cloud', type: 'Satellite galaxy', raH: 5.392, decDeg: -69.76, kind: 'galaxy', distance: '~160,000 light-years', description: 'A satellite galaxy of the Milky Way and home to the Tarantula Nebula.', color: 0xcfe0ff, sources: ['nasa', 'esa', 'simbad'] },
  { id: 'smc', name: 'Small Magellanic Cloud', type: 'Satellite galaxy', raH: 0.877, decDeg: -72.83, kind: 'galaxy', distance: '~200,000 light-years', description: 'A dwarf satellite galaxy of the Milky Way, visible from the southern sky.', color: 0xcfe0ff, sources: ['nasa', 'esa', 'simbad'] },
  { id: 'm42', name: 'Orion Nebula (M42)', type: 'Emission nebula', raH: 5.589, decDeg: -5.39, kind: 'cosmos', distance: '~1,344 light-years', description: 'A bright stellar nursery in Orion’s Sword where new stars are actively forming.', color: 0xff9bb0, sources: ['nasa', 'esa', 'simbad'] },
  { id: 'm1', name: 'Crab Nebula (M1)', type: 'Supernova remnant', raH: 5.575, decDeg: 22.01, kind: 'cosmos', distance: '~6,500 light-years', description: 'The expanding remnant of a supernova recorded in 1054 CE, with a pulsar at its heart.', color: 0x9fd8ff, sources: ['nasa', 'esa', 'simbad'] },
  { id: 'm45', name: 'Pleiades (M45)', type: 'Open star cluster', raH: 3.788, decDeg: 24.12, kind: 'cosmos', distance: '~444 light-years', description: 'A young open cluster of hot blue stars wrapped in reflection nebulosity.', color: 0xc8dcff, sources: ['hipparcos', 'gaia', 'simbad'] },
  { id: 'm13', name: 'Hercules Cluster (M13)', type: 'Globular cluster', raH: 16.695, decDeg: 36.46, kind: 'cosmos', distance: '~22,000 light-years', description: 'One of the brightest globular clusters in the northern sky, with hundreds of thousands of stars.', color: 0xfff0c8, sources: ['gaia', 'simbad', 'nasa'] },
  { id: 'omega_cen', name: 'Omega Centauri', type: 'Globular cluster', raH: 13.447, decDeg: -47.48, kind: 'cosmos', distance: '~17,000 light-years', description: 'The largest known globular cluster orbiting the Milky Way, possibly a stripped dwarf-galaxy core.', color: 0xfff0c8, sources: ['gaia', 'simbad', 'nasa'] },
  { id: 'm57', name: 'Ring Nebula (M57)', type: 'Planetary nebula', raH: 18.893, decDeg: 33.03, kind: 'cosmos', distance: '~2,300 light-years', description: 'A shell of gas cast off by a dying Sun-like star, glowing around its white-dwarf remnant.', color: 0x8ff0d0, sources: ['nasa', 'esa', 'simbad'] },
  { id: 'sgr_a', name: 'Sagittarius A*', type: 'Supermassive black hole', raH: 17.761, decDeg: -29.01, kind: 'cosmos', distance: '~26,000 light-years', description: 'The four-million-solar-mass black hole at the centre of the Milky Way.', color: 0xffb060, sources: ['esa', 'nasa', 'simbad'] },
  { id: 'eta_car', name: 'Eta Carinae', type: 'Luminous blue variable', raH: 10.732, decDeg: -59.68, kind: 'cosmos', distance: '~7,500 light-years', description: 'A massive, unstable star system that erupted in the 19th century and may end as a supernova.', color: 0xffcf9a, sources: ['nasa', 'esa', 'simbad'] },
  { id: 'sn1987a', name: 'SN 1987A', type: 'Supernova remnant', raH: 5.593, decDeg: -69.27, kind: 'cosmos', distance: '~168,000 light-years', description: 'The closest observed supernova since 1604, in the Large Magellanic Cloud.', color: 0xbfe0ff, sources: ['nasa', 'esa', 'simbad'] },
  { id: '51peg', name: '51 Pegasi', type: 'Sun-like star · first exoplanet host', raH: 22.961, decDeg: 20.77, kind: 'cosmos', distance: '~50 light-years', description: 'The first Sun-like star found to host an exoplanet (51 Pegasi b), announced in 1995.', color: 0xfff1c7, sources: ['nasa', 'gaia', 'simbad'] },
];

const celestialObjects: Record<string, BioObject> = {};
for (const d of DEEP_SKY) {
  celestialObjects[`deepsky:${d.id}`] = {
    id: `deepsky:${d.id}`,
    name: d.name,
    scale: d.kind === 'galaxy' ? Scale.Galaxy : Scale.Cosmos,
    kind: d.kind,
    summary: `${d.name} — ${d.type.toLowerCase()} at a distance of ${d.distance}. ${d.description}`,
    size: `${d.type} · ${d.distance}`,
    facts: [
      `Type: ${d.type}.`,
      `Right ascension: ${d.raH.toFixed(3)} h; declination: ${d.decDeg.toFixed(2)}°.`,
      `Distance: ${d.distance}.`,
      d.description,
    ],
    crossRefs: d.sources,
    provenanceNote: 'Deep-sky positions and properties from public astronomy catalogues (NASA, ESA, SIMBAD).',
  };
}

/** All deep-sky BioObjects, for the corpus and search. */
export const DEEP_SKY_OBJECTS: BioObject[] = Object.values(celestialObjects);

export function resolveCelestial(id: string): BioObject | undefined {
  const starMatch = /^star:(\d+)$/.exec(id);
  if (starMatch) return starObjectByIndex(Number(starMatch[1]));
  return celestialObjects[id];
}

/** Named stars exposed for global search (id + name + index). */
export const NAMED_STAR_INDEX: { id: string; name: string }[] = BRIGHT_STAR_CATALOG
  .map((star, i) => ({ star, i }))
  .filter(({ star }) => isNamedStar(star.name))
  .map(({ star, i }) => ({ id: `star:${i}`, name: star.name }));
