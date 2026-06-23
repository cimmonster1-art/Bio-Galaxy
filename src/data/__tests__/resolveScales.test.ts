import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveObject } from '../resolve';
import { searchAtlas } from '../search';
import { Scale } from '../../types';

describe('atom navigation', () => {
  it('resolves any element by its atom: id with a live element symbol', () => {
    const oxygen = resolveObject('atom:O');
    assert.equal(oxygen?.kind, 'atom');
    assert.equal(oxygen?.element, 'O');
    assert.equal(oxygen?.scale, Scale.Atom);

    const gold = resolveObject('atom:Au');
    assert.equal(gold?.element, 'Au');
    assert.match(gold?.name ?? '', /gold/i);
  });

  it('keeps the legacy carbon id resolvable for existing relations', () => {
    const carbon = resolveObject('atom_carbon');
    assert.equal(carbon?.element, 'C');
  });

  it('surfaces elements from search by name and by symbol', () => {
    assert(searchAtlas('oxygen').some((r) => r.id === 'atom:O'));
    assert(searchAtlas('fe').some((r) => r.id === 'atom:Fe'));
  });
});

describe('named galaxy navigation', () => {
  it('resolves a named galaxy with its own morphology context', () => {
    const andromeda = resolveObject('galaxy:andromeda');
    assert.equal(andromeda?.kind, 'galaxy');
    assert.match(andromeda?.name ?? '', /Andromeda/);
    assert.match(andromeda?.provenanceNote ?? '', /spiral/i);
  });

  it('finds named galaxies from search by name and alias', () => {
    assert(searchAtlas('andromeda').some((r) => r.id === 'galaxy:andromeda'));
    assert(searchAtlas('m31').some((r) => r.id === 'galaxy:andromeda'));
    assert(searchAtlas('whirlpool').some((r) => r.id === 'galaxy:whirlpool'));
  });
});

describe('red blood cell navigation', () => {
  it('resolves the erythrocyte object at the cell scale', () => {
    const rbc = resolveObject('cell:rbc');
    assert.equal(rbc?.kind, 'cell');
    assert.equal(rbc?.scale, Scale.Cell);
  });

  it('is reachable from search', () => {
    assert(searchAtlas('red blood cell').some((r) => r.id === 'cell:rbc'));
  });
});
