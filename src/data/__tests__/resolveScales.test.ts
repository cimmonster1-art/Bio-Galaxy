import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveObject } from '../resolve';
import { searchAtlas } from '../search';
import { relatedObjects, relatedGroups } from '../relations';
import { Scale } from '../../types';

const childIds = (id: string): string[] => relatedObjects(resolveObject(id)!).map((o) => o.id);
const parentIds = (id: string): string[] => relatedGroups(resolveObject(id)!).up.map((o) => o.id);

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

describe('navigable hierarchy for the new scales', () => {
  it('descends red blood cell to haemoglobin, then heme, then the iron atom', () => {
    assert(childIds('cell:rbc').includes('protein:hemoglobin'));
    assert(childIds('protein:hemoglobin').includes('mol_heme'));
    const heme = childIds('mol_heme');
    assert(heme.includes('atom:Fe'));
    // The whole chain resolves to real objects, not dead links.
    for (const id of ['protein:hemoglobin', 'mol_heme', 'atom:Fe']) {
      assert(resolveObject(id), `${id} should resolve`);
    }
  });

  it('lets a red blood cell climb back into the cardiovascular system', () => {
    assert(parentIds('cell:rbc').includes('system:cardiovascular'));
  });

  it('surfaces haemoglobin and heme from search by their alternate spellings', () => {
    assert(searchAtlas('hemoglobin').some((r) => r.id === 'protein:hemoglobin'));
    assert(searchAtlas('haemoglobin').some((r) => r.id === 'protein:hemoglobin'));
    assert(searchAtlas('heme').some((r) => r.id === 'mol_heme'));
  });

  it('descends a named galaxy into stars and our Solar System', () => {
    const kids = childIds('galaxy:andromeda');
    assert(kids.includes('planet:sun'));
    assert(kids.some((id) => id.startsWith('star:')));
  });

  it('keeps carbon connected whether reached as atom:C or the legacy id', () => {
    assert(childIds('atom:C').includes('mol_methane'));
    assert(childIds('atom_carbon').includes('mol_methane'));
  });
});
