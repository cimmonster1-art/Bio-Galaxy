import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Scale } from '../../types';
import {
  BRIGHT_STAR_CATALOG,
  STAR_OBJECTS,
  galaxySceneStars,
  raDecToDirection,
  starObjectByIndex,
} from '../stars';
import { resolveObject, allResolvedObjects } from '../resolve';
import { searchAtlas } from '../search';
import { DATA_SOURCES } from '../sources';

describe('borrowed star catalogue', () => {
  it('loads the full HYG / bright-star catalogue', () => {
    assert(BRIGHT_STAR_CATALOG.length > 900, 'expected the merged catalogue to load');
    assert(BRIGHT_STAR_CATALOG.some((s) => s.name === 'Sirius'));
  });

  it('exposes every star as a Galaxy-scale, HYG-sourced object', () => {
    const first = starObjectByIndex(0);
    assert(first);
    assert.equal(first!.kind, 'star');
    assert.equal(first!.scale, Scale.Galaxy);
    assert.equal(first!.source, 'hyg');
    assert.equal(Object.keys(STAR_OBJECTS).length, BRIGHT_STAR_CATALOG.length);
  });

  it('resolves star pick ids and includes them in the copilot corpus', () => {
    const star = resolveObject('star:0');
    assert(star);
    assert(allResolvedObjects().some((o) => o.id === 'star:0'));
  });

  it('registers the astronomy source databases', () => {
    for (const id of ['hyg', 'hipparcos', 'simbad'] as const) {
      assert(DATA_SOURCES[id], `expected ${id} to be a registered source`);
    }
  });

  it('places stars on a unit celestial sphere and finds them in search', () => {
    const placed = galaxySceneStars();
    assert.equal(placed.length, BRIGHT_STAR_CATALOG.length);
    const [x, y, z] = raDecToDirection(6.752, -16.72); // Sirius
    assert(Math.abs(Math.hypot(x, y, z) - 1) < 1e-6);
    assert(searchAtlas('Sirius').some((r) => r.scale === Scale.Galaxy));
  });
});
