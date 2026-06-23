import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { asElement, asGalaxy, instantPreview } from '../searchPreview';
import type { SearchResult } from '../search';

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
});
