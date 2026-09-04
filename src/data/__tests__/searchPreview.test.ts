import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { searchAtlas, type SearchResult } from '../search';
import { asElement, asGalaxy, instantPreview } from '../searchPreview';

describe('element detection', () => {
  it('recognizes elements by name, with or without "atom"', () => {
    assert.equal(asElement('carbon')?.symbol, 'C');
    assert.equal(asElement('Carbon atom')?.symbol, 'C');
    assert.equal(asElement('  oxygen ')?.protons, 8);
    assert.equal(asElement('iron')?.protons, 26);
  });

  it('recognizes bare element symbols but not longer words', () => {
    assert.equal(asElement('Fe')?.protons, 26);
    assert.equal(asElement('na')?.symbol, 'Na');
    assert.equal(asElement('helium proteins'), undefined);
    assert.equal(asElement('water'), undefined);
  });
});

describe('galaxy detection', () => {
  it('recognizes named galaxies and the word galaxy', () => {
    assert.equal(asGalaxy('Milky Way'), true);
    assert.equal(asGalaxy('andromeda'), true);
    assert.equal(asGalaxy('Whirlpool Galaxy'), true);
    assert.equal(asGalaxy('spiral galaxy'), true);
  });

  it('does not treat unrelated text as a galaxy', () => {
    assert.equal(asGalaxy('heart'), false);
    assert.equal(asGalaxy('carbon'), false);
  });
});

describe('instantPreview resolution', () => {
  it('renders an atom for an element query with the right proton count', () => {
    const model = instantPreview('carbon', undefined);
    assert.equal(model?.kind, 'atom');
    if (model?.kind === 'atom') {
      assert.equal(model.protons, 6);
      assert.equal(model.symbol, 'C');
    }
  });

  it('renders a galaxy for a galaxy query', () => {
    const model = instantPreview('Andromeda Galaxy', undefined);
    assert.equal(model?.kind, 'galaxy');
  });

  it('renders a galaxy for the resolvable galaxy object', () => {
    const result: SearchResult = { id: 'galaxy', label: 'Spiral Galaxy', sublabel: 'Galaxy', scale: 0 as never };
    const model = instantPreview('ngc 1300', result);
    assert.equal(model?.kind, 'galaxy');
  });

  it('still detects peptides ahead of element symbols', () => {
    const model = instantPreview('ACDEFGHIK', undefined);
    assert.equal(model?.kind, 'peptide');
  });

  it('renders any element, not just carbon, with the right proton count', () => {
    const oganesson = instantPreview('oganesson', undefined);
    assert.equal(oganesson?.kind, 'atom');
    if (oganesson?.kind === 'atom') assert.equal(oganesson.protons, 118);
    const iron = instantPreview('Fe', undefined);
    assert.equal(iron?.kind, 'atom');
    if (iron?.kind === 'atom') assert.equal(iron.protons, 26);
  });

  it('renders an atom for a prefixed atom result id', () => {
    const result: SearchResult = { id: 'atom:O', label: 'Oxygen atom', sublabel: 'Element', scale: 13 as never };
    const model = instantPreview('breath', result);
    assert.equal(model?.kind, 'atom');
    if (model?.kind === 'atom') assert.equal(model.protons, 8);
  });

  it('renders a mitochondrion as an organelle', () => {
    assert.equal(instantPreview('mitochondrion', undefined)?.kind, 'organelle');
    assert.equal(instantPreview('mitochondria', undefined)?.kind, 'organelle');
  });

  it('keeps preview aliases navigable in atlas search', () => {
    assert.equal(searchAtlas('mitochondria')[0]?.id, 'mitochondrion');
    assert.equal(searchAtlas('mitochondrion')[0]?.id, 'mitochondrion');
  });

  it('renders a red blood cell as a biconcave disk', () => {
    assert.equal(instantPreview('red blood cell', undefined)?.kind, 'rbc');
    assert.equal(instantPreview('erythrocyte', undefined)?.kind, 'rbc');
  });
});
