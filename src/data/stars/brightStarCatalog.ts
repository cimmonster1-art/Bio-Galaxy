/**
 * The 1,000 individually rendered, interactive stars in the 3D celestial sphere.
 *
 * The first 133 entries preserve Heliōra's hand-curated constellation and royal-
 * star set. The remaining brightest stars are derived from HYG Database v4.1
 * (CC BY-SA 4.0), using its real J2000 right ascension, declination, apparent
 * magnitude, and spectral classification. See docs/HYG_CATALOG_ATTRIBUTION.md.
 */
export interface BrightStar {
  name: string;
  raH: number;
  decDeg: number;
  mag: number;
  color: number;
  spectral: string;
}

import { CURATED_BRIGHT_STARS } from './brightStarCatalog.curated';
import { HYG_BRIGHT_STARS_A } from './brightStarCatalog.hygA';
import { HYG_BRIGHT_STARS_B } from './brightStarCatalog.hygB';

export const BRIGHT_STAR_CATALOG: BrightStar[] = [
  ...CURATED_BRIGHT_STARS,
  ...HYG_BRIGHT_STARS_A,
  ...HYG_BRIGHT_STARS_B,
];

export const BRIGHT_STAR_CATALOG_SIZE = BRIGHT_STAR_CATALOG.length;
