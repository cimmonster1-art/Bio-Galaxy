import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { allTaxa, childrenOf, getTaxon, lineageOf, searchTaxa, TREE_OF_LIFE } from '../taxonomy';

describe('taxonomy traversal', () => {
  it('builds a lineage from domain to species', () => {
    const lineage = lineageOf('homo_sapiens');
    assert.equal(lineage.at(0)?.rank, 'domain');
    assert.equal(lineage.at(-1)?.name, 'Homo sapiens');
    assert(lineage.some((node) => node.id === 'homo'));
  });
  it('searches common names and respects limits', () => {
    assert(searchTaxa('human').includes(getTaxon('homo_sapiens')!));
    assert.equal(searchTaxa('a', 3).length, 3);
  });
  it('returns roots and a unique flattened index', () => {
    assert.equal(childrenOf(null), TREE_OF_LIFE);
    assert.equal(new Set(allTaxa().map((node) => node.id)).size, allTaxa().length);
  });
});
