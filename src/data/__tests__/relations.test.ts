import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { relatedObjects, relatedGroups } from '../relations';
import { resolveObject } from '../resolve';

const down = (id: string) => {
  const object = resolveObject(id);
  assert(object, `expected ${id} to resolve`);
  return relatedObjects(object!).map((o) => o.id);
};
const up = (id: string) => {
  const object = resolveObject(id);
  assert(object, `expected ${id} to resolve`);
  return relatedGroups(object!).up.map((o) => o.id);
};

describe('ontology relationships (bottom-card rail)', () => {
  it('walks the physical spine downward', () => {
    assert(down('cosmos').includes('galaxy'));
    assert(down('planet:sun').includes('planet:earth'));
    assert(down('planet:earth').some((id) => id.startsWith('biome:')));
    assert(down('biome:rainforest').length > 0);
  });

  it('traverses the full biology chain heart → ACTA1 gene', () => {
    assert(down('organ:heart').includes('region:left_ventricle'));
    assert(down('region:left_ventricle').includes('cell:cardiomyocyte'));
    assert(down('cell:cardiomyocyte').includes('organelle:sarcomere'));
    assert(down('organelle:sarcomere').includes('complex:actin_filament'));
    assert(down('complex:actin_filament').includes('protein:actin'));
    assert(down('protein:actin').includes('gene:acta1'));
  });

  it('traverses the chemistry chain carbon → ATP', () => {
    assert(down('atom_carbon').includes('mol_methane'));
    assert(down('mol_methane').includes('mol_glucose'));
    assert(down('mol_glucose').includes('pathway_glycolysis'));
    assert(down('pathway_glycolysis').includes('mol_atp'));
  });

  it('is bidirectional — every object can be climbed back up', () => {
    assert(up('galaxy').includes('cosmos'));
    assert(up('planet:earth').includes('planet:sun'));
    assert(up('gene:acta1').length > 0);
    assert(up('atom_carbon').length > 0); // carbon climbs into chemistry/biology
    assert(up('organ:heart').includes('system:cardiovascular'));
  });

  it('uses the Tree of Life for clades, in both directions', () => {
    const kids = down('taxon:eukaryota');
    assert(kids.length > 0 && kids.every((id) => id.startsWith('taxon:')));
    assert(up('taxon:animalia').includes('taxon:eukaryota'));
  });

  it('never returns the object itself, and resolves every card', () => {
    const start = resolveObject('planet:earth')!;
    const { up: parents, down: children } = relatedGroups(start);
    assert([...parents, ...children].every((o) => o.id !== start.id));
    assert([...parents, ...children].every((o) => resolveObject(o.id)));
  });
});
