import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { relatedObjects } from '../relations';
import { resolveObject } from '../resolve';

const related = (id: string) => {
  const object = resolveObject(id);
  assert(object, `expected ${id} to resolve`);
  return relatedObjects(object!).map((o) => o.id);
};

describe('ontology relationships (bottom-card rail)', () => {
  it('walks the physical spine downward', () => {
    assert(related('cosmos').includes('galaxy'));
    assert(related('planet:sun').includes('planet:earth'));
    assert(related('planet:earth').some((id) => id.startsWith('biome:')));
    assert(related('biome:rainforest').length > 0);
  });

  it('connects anatomy systems to organs to tissues', () => {
    assert(related('system:cardiovascular').includes('organ:heart'));
    assert(related('organ:heart').includes('tissue:muscle'));
  });

  it('descends from organelle to molecular machines to atoms', () => {
    assert(related('mitochondrion').includes('atp_synthase'));
    assert(related('atp_synthase').includes('atom_carbon'));
  });

  it('uses the Tree of Life for clades', () => {
    const kids = related('taxon:eukaryota');
    assert(kids.length > 0, 'a clade should surface child branches');
    assert(kids.every((id) => id.startsWith('taxon:')));
  });

  it('never returns the object itself, and resolves every card', () => {
    const start = resolveObject('planet:earth')!;
    const items = relatedObjects(start);
    assert(items.every((o) => o.id !== start.id));
    assert(items.every((o) => resolveObject(o.id)));
  });
});
