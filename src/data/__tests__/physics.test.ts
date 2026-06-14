import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { physicsFor, hasPhysics } from '../physics';
import { relatedObjects } from '../relations';
import { resolveObject } from '../resolve';

const facetLabels = (id: string) => {
  const object = resolveObject(id);
  assert(object, `expected ${id} to resolve`);
  return physicsFor(object!).map((f) => f.label);
};
const down = (id: string) => relatedObjects(resolveObject(id)!).map((o) => o.id);

describe('physics facets', () => {
  it('gives planets gravity, escape velocity, atmosphere, and field', () => {
    const earth = facetLabels('planet:earth');
    for (const label of ['Surface gravity', 'Escape velocity', 'Atmosphere', 'Magnetic field']) {
      assert(earth.includes(label), `Earth should expose ${label}`);
    }
  });

  it('gives an atom its electron configuration and quantum numbers', () => {
    const carbon = facetLabels('atom_carbon');
    assert(carbon.includes('Electron configuration'));
    assert(carbon.includes('Valence electrons'));
  });

  it('gives a galaxy dark matter and a rotation curve', () => {
    const galaxy = facetLabels('galaxy');
    assert(galaxy.some((l) => l.includes('Dark matter')));
    assert(galaxy.includes('Rotation curve'));
  });

  it('falls back by kind, and is empty where physics does not apply', () => {
    assert(hasPhysics(resolveObject('star:0')!)); // generic star facets
    assert(!hasPhysics(resolveObject('organ:heart')!));
  });
});

describe('widened biology/chemistry graph', () => {
  it('descends the nervous chain into chemistry', () => {
    assert(down('organ:brain').includes('region:cerebral_cortex'));
    assert(down('region:cerebral_cortex').includes('cell:neuron'));
    assert(down('cell:neuron').includes('organelle:synapse'));
    assert(down('organelle:synapse').includes('mol_acetylcholine'));
  });

  it('descends the respiratory rung and branches chemistry', () => {
    assert(down('organ:lungs').includes('region:alveolus'));
    assert(down('region:alveolus').includes('mol_oxygen'));
    assert(down('atom_carbon').includes('mol_benzene'));
    assert(down('protein:actin').includes('mol_glycine'));
  });
});
