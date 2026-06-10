import { Body, HelioVector } from 'astronomy-engine';

/**
 * Scientifically correct heliocentric positions, powered by the same ephemeris
 * library the sister Astro-Insight project uses: the npm package
 * `astronomy-engine`. For a given simulation date we ask the engine for each
 * body's heliocentric position vector in the J2000 ecliptic frame and reduce it
 * to an ecliptic longitude, which the scene maps onto each planet's compressed
 * orbit. Pure and dependency-light: a single call per body, no shared state.
 */

// The planet ids used in cosmos.ts PLANETS, mapped to astronomy-engine Body
// enum members. Pluto is included so the scrubber can place it correctly even
// though it is no longer a classical planet.
const BODY_BY_ID: Record<string, Body> = {
  mercury: Body.Mercury,
  venus: Body.Venus,
  earth: Body.Earth,
  mars: Body.Mars,
  jupiter: Body.Jupiter,
  saturn: Body.Saturn,
  uranus: Body.Uranus,
  neptune: Body.Neptune,
  pluto: Body.Pluto,
};

/**
 * Heliocentric ecliptic longitude, in radians, for each planet id, true for the
 * given date. Computed as atan2(y, x) of the heliocentric position vector. Any
 * per-body failure falls back to 0 so a single bad lookup never breaks the loop.
 */
export function heliocentricLongitudes(date: Date): Record<string, number> {
  const out: Record<string, number> = {};
  for (const id of Object.keys(BODY_BY_ID)) {
    try {
      const vec = HelioVector(BODY_BY_ID[id], date);
      out[id] = Math.atan2(vec.y, vec.x);
    } catch {
      // Guard against any throw (out-of-range date, missing body) by falling
      // back to a neutral longitude rather than propagating the error.
      out[id] = 0;
    }
  }
  return out;
}

/** Whether the ephemeris backend is present. The library is a hard dependency. */
export function isEphemerisAvailable(): boolean {
  return true;
}
