import { BioObject, Scale } from '../types';
import { BRIGHT_STAR_CATALOG, BrightStar, BRIGHT_STAR_CATALOG_SIZE } from './stars/brightStarCatalog';

/**
 * Turns the borrowed Astro-Insight bright-star catalogue into first-class atlas
 * records. Every catalogue star becomes a selectable Galaxy-scale BioObject so
 * the copilot corpus, global search, and the 3D Galaxy view all draw on the same
 * real positions and stellar properties — the deep sky beyond the Oort Cloud.
 */

export { BRIGHT_STAR_CATALOG, BRIGHT_STAR_CATALOG_SIZE } from './stars/brightStarCatalog';
export type { BrightStar } from './stars/brightStarCatalog';

const SPECTRAL_CLASS: Record<string, string> = {
  O: 'a scorching blue O-type star',
  B: 'a hot blue-white B-type star',
  A: 'a white A-type star',
  F: 'a yellow-white F-type star',
  G: 'a Sun-like yellow G-type star',
  K: 'a cool orange K-type star',
  M: 'a cool red M-type star',
  W: 'a Wolf–Rayet star shedding its outer layers',
};

const LUMINOSITY_CLASS: Array<[string, string]> = [
  ['Iab', 'luminous supergiant'],
  ['Ia', 'luminous supergiant'],
  ['Ib', 'supergiant'],
  ['II', 'bright giant'],
  ['III', 'giant'],
  ['IV', 'subgiant'],
  ['V', 'main-sequence (dwarf) star'],
];

function describeSpectral(spectral: string): string {
  const klass = SPECTRAL_CLASS[spectral.trim().charAt(0).toUpperCase()] ?? 'a star';
  const lum = LUMINOSITY_CLASS.find(([token]) => spectral.includes(token));
  return lum ? `${klass}, a ${lum[1]}` : klass;
}

/** Pretty hours-of-right-ascension as h m. */
function formatRa(raH: number): string {
  const h = Math.floor(raH);
  const m = Math.round((raH - h) * 60);
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

function starToObject(star: BrightStar, index: number): BioObject {
  const colorHex = `#${star.color.toString(16).padStart(6, '0')}`;
  return {
    id: `star:${index}`,
    name: star.name,
    scale: Scale.Galaxy,
    kind: 'star',
    summary: `${star.name} is ${describeSpectral(star.spectral)} (spectral type ${star.spectral.trim()}), shining at apparent magnitude ${star.mag.toFixed(2)} in the catalogue of stars beyond the Solar System.`,
    size: `apparent magnitude ${star.mag.toFixed(2)}`,
    facts: [
      `Right ascension ${formatRa(star.raH)}, declination ${star.decDeg.toFixed(2)}° (J2000).`,
      `Spectral classification ${star.spectral.trim()} — ${describeSpectral(star.spectral)}.`,
      `Apparent magnitude ${star.mag.toFixed(2)}; rendered tint ${colorHex}.`,
      'Position and photometry from the HYG Database (Hipparcos / Yale Bright Star Catalogue).',
    ],
    source: 'hyg',
    crossRefs: ['hipparcos', 'simbad'],
    provenanceNote: 'Star data from the HYG Database v4.1 (CC BY-SA 4.0), via the Astro-Insight celestial sphere.',
  };
}

/** Every catalogue star as a Galaxy-scale BioObject, keyed `star:<index>`. */
export const STAR_OBJECTS: Record<string, BioObject> = {};
BRIGHT_STAR_CATALOG.forEach((star, index) => {
  STAR_OBJECTS[`star:${index}`] = starToObject(star, index);
});

export function starObjectByIndex(index: number): BioObject | undefined {
  return STAR_OBJECTS[`star:${index}`];
}

/** A single placed star ready for the Galaxy-scale scene. */
export interface SceneStar {
  id: string;
  index: number;
  name: string;
  /** Unit direction from RA/Dec, in scene axes (y up). */
  dir: [number, number, number];
  color: number;
  /** Relative brightness 0..1 derived from apparent magnitude. */
  brightness: number;
}

/**
 * Equatorial (RA hours, Dec degrees) → a unit direction in scene space, with
 * the celestial poles aligned to the y axis so the catalogue keeps its real
 * on-sky geometry when projected onto the surrounding star shell.
 */
export function raDecToDirection(raH: number, decDeg: number): [number, number, number] {
  const ra = (raH / 24) * Math.PI * 2;
  const dec = (decDeg / 180) * Math.PI;
  const cosDec = Math.cos(dec);
  return [cosDec * Math.cos(ra), Math.sin(dec), -cosDec * Math.sin(ra)];
}

/**
 * The full catalogue placed for rendering. Brightness folds the apparent
 * magnitude range into 0..1 so the layer can scale point size and opacity.
 */
export function galaxySceneStars(): SceneStar[] {
  const mags = BRIGHT_STAR_CATALOG.map((s) => s.mag);
  const minMag = Math.min(...mags);
  const maxMag = Math.max(...mags);
  const span = Math.max(0.001, maxMag - minMag);
  return BRIGHT_STAR_CATALOG.map((star, index) => ({
    id: `star:${index}`,
    index,
    name: star.name,
    dir: raDecToDirection(star.raH, star.decDeg),
    color: star.color,
    brightness: 1 - (star.mag - minMag) / span,
  }));
}
