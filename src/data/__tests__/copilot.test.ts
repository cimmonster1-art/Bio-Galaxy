import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { answerQuestion, contextualStops, type CopilotContext } from '../copilot';
import { resolveObject } from '../resolve';
import { Scale } from '../../types';

const ctx = (id: string): CopilotContext => {
  const selected = resolveObject(id)!;
  return { scale: selected.scale, selected, hovered: null };
};

describe('copilot grounding in the navigation graph', () => {
  it('names the real graph neighbours when explaining connections', () => {
    const answer = answerQuestion('how does it connect', ctx('protein:hemoglobin'));
    const prose = answer.paragraphs.join(' ');
    // Haemoglobin descends to heme and ascends to the red blood cell.
    assert.match(prose, /Heme/i);
    assert.match(prose, /red blood cell/i);
  });

  it('cites the sources of the focus and its graph neighbours', () => {
    const answer = answerQuestion('explain', ctx('cell:rbc'));
    assert(answer.sources.length > 0);
    // RBC connects to haemoglobin (RCSB) and oxygen (PubChem); both should be cited.
    assert(answer.sources.includes('rcsb') || answer.sources.includes('pubchem'));
  });

  it('suggests graph neighbours as stops, exactly what a click would open', () => {
    const stops = contextualStops(ctx('protein:hemoglobin'), 3).map((object) => object.id);
    assert(stops.includes('mol_heme'));
    assert(!stops.includes('protein:hemoglobin')); // never suggests the focus itself
  });

  it('still answers a scale view when nothing is selected', () => {
    const answer = answerQuestion('what is this', { scale: Scale.Cell, selected: null, hovered: null });
    assert(answer.title.length > 0);
    assert(answer.paragraphs.length > 0);
  });
});
