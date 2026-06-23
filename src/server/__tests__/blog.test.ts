import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { assess, hasForbiddenDash, sanitize, similarity } from '../blog/quality';
import { readingMinutes, toSlug } from '../blog/store';

describe('blog quality control', () => {
  it('strips em and en dashes from text', () => {
    const cleaned = sanitize('Cells are tiny — and complex – yet elegant.');
    assert.equal(hasForbiddenDash(cleaned), false);
    assert.match(cleaned, /tiny, and complex, yet elegant\./);
  });

  it('rejects an article that still contains a forbidden dash', () => {
    const body = `${'word '.repeat(400)}`.trim();
    const verdict = assess({ title: 'A perfectly fine long title', body: `${body}\n\nsecond — paragraph\n\nthird paragraph` }, []);
    assert.equal(verdict.ok, false);
    assert.ok(verdict.reasons.some((r) => r.includes('dash')));
  });

  it('rejects articles that are too short or too similar', () => {
    const longBody = `${Array.from({ length: 5 }, () => 'one continuous journey through reality from cosmos to atom.').join(' ')}\n\n${Array.from({ length: 30 }, () => 'each object cites its source database clearly.').join(' ')}\n\n${Array.from({ length: 30 }, () => 'typed clients normalize public records for the atlas.').join(' ')}`;
    const existing = [{ title: 'Existing', body: longBody }];
    const short = assess({ title: 'Way too short to publish', body: 'tiny body here.' }, []);
    assert.equal(short.ok, false);
    const dup = assess({ title: 'A genuinely different title here', body: longBody }, existing);
    assert.equal(dup.ok, false);
    assert.ok(dup.reasons.some((r) => r.includes('similar')));
  });

  it('accepts an original, well-formed, dash-free article', () => {
    const body = [
      Array.from({ length: 40 }, (_, i) => `alpha${i} beta gamma delta`).join(' '),
      Array.from({ length: 40 }, (_, i) => `epsilon${i} zeta eta theta`).join(' '),
      Array.from({ length: 40 }, (_, i) => `iota${i} kappa lambda mu`).join(' '),
    ].join('\n\n');
    const verdict = assess({ title: 'An Original Article About the Atlas', body }, []);
    assert.equal(verdict.ok, true, verdict.reasons.join('; '));
  });

  it('computes similarity symmetrically and within range', () => {
    const a = 'the quick brown fox jumps over the lazy dog repeatedly today';
    assert.equal(similarity(a, a) > 0.99, true);
    assert.equal(similarity(a, 'a totally unrelated set of words entirely different') < 0.1, true);
  });

  it('derives unique slugs and reading times', () => {
    assert.equal(toSlug('Hello, World!'), 'hello-world');
    assert.equal(toSlug('Hello World', new Set(['hello-world'])), 'hello-world-2');
    assert.equal(readingMinutes('word '.repeat(400)), 2);
  });
});
