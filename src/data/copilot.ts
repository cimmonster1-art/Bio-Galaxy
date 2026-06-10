import { BioObject, DataSourceId } from '../types';
import { DATA_SOURCES } from './sources';
import { EPOCHS } from './epochs';

/**
 * A grounded, offline copilot. It does not call a hosted language model, which
 * keeps the atlas key free and private; instead it composes answers from the
 * same curated corpus the rest of the UI draws on: the selected object's
 * record, the public-database registry, and the deep-time epochs. Suggested
 * questions are generated from whatever the user has clicked so the chat always
 * has a relevant entry point.
 */

export interface CopilotMessage {
  role: 'user' | 'copilot';
  text: string;
}

const SOURCE_BLURB: Record<DataSourceId, string> = {
  uniprot: 'protein sequence and function',
  reactome: 'the pathways and reactions it takes part in',
  rcsb: 'experimentally determined 3D structures',
  ensembl: 'gene models and genomic context',
  hpa: 'where it is expressed across tissues and cells',
  ncbi: 'taxonomy identifiers and primary literature',
};

/** Three context-aware questions for whatever is currently selected. */
export function suggestQuestions(obj: BioObject | null): string[] {
  if (!obj) {
    return [
      'What can I explore in this atlas?',
      'How does the timeline from the Big Bang work?',
      'Which scientific databases does the data come from?',
    ];
  }
  const q: string[] = [`What is ${obj.name}?`];

  switch (obj.kind) {
    case 'organelle':
      q.push(`What does ${obj.name} do inside the cell?`);
      q.push(`How did ${obj.name} evolve?`);
      break;
    case 'planet':
    case 'star':
      q.push(`Why does ${obj.name} matter for life?`);
      q.push('How are the planet positions calculated over time?');
      break;
    case 'clade':
    case 'taxon':
    case 'organism':
      q.push(`Where does ${obj.name} sit in the Tree of Life?`);
      q.push(`What is known about the genome of ${obj.name}?`);
      break;
    case 'organ':
    case 'system':
      q.push(`What is the role of the ${obj.name.toLowerCase()}?`);
      q.push(`Which tissues and cells build the ${obj.name.toLowerCase()}?`);
      break;
    default:
      q.push(`Why does ${obj.name} matter?`);
      q.push(`Which databases describe ${obj.name}?`);
  }
  return q.slice(0, 3);
}

function sourcesOf(obj: BioObject): DataSourceId[] {
  return [...(obj.source ? [obj.source] : []), ...(obj.crossRefs ?? [])];
}

function describeSources(obj: BioObject): string {
  const ids = sourcesOf(obj);
  if (ids.length === 0) {
    return obj.provenanceNote
      ? `Provenance: ${obj.provenanceNote}`
      : 'This is a reference object rather than a database record.';
  }
  const parts = ids.map((id) => `${DATA_SOURCES[id].name} (${SOURCE_BLURB[id]})`);
  return `It is described by ${joinList(parts)}.`;
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('');
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function relatedEpoch(obj: BioObject): string | null {
  const map: Record<string, string> = {
    organelle: 'eukaryotes',
    cell: 'eukaryotes',
    planet: 'solar_system',
    star: 'solar_system',
    organism: 'homo_sapiens',
  };
  if (obj.id === 'mitochondrion') return 'endosymbiosis_mito';
  const id = map[obj.kind];
  if (!id) return null;
  const e = EPOCHS.find((x) => x.id === id);
  return e ? `On the timeline this connects to "${e.title}" (${e.time}): ${e.detail}` : null;
}

/**
 * Answer a free-text question about the selected object. The matching is
 * keyword based and deliberately transparent: it surfaces the curated record,
 * its facts, its database provenance, and any related epoch.
 */
export function answerQuestion(obj: BioObject | null, question: string): string {
  const q = question.toLowerCase();

  if (!obj) {
    if (q.includes('database') || q.includes('data')) {
      return `The atlas reads from six public databases: ${joinList(
        Object.values(DATA_SOURCES).map((s) => s.name),
      )}. Select any object to see its records and a Wikipedia summary.`;
    }
    if (q.includes('timeline') || q.includes('big bang') || q.includes('time')) {
      return `The timeline runs from the Big Bang ${EPOCHS[0].time} to the rise of civilization. Press play, choose a speed, and the camera moves through ${EPOCHS.length} epochs while the solar system is positioned with real ephemeris data.`;
    }
    return 'Select something in the atlas, from a galaxy to an organelle, and I can explain it using the curated records and the public databases.';
  }

  const facts = obj.facts.length ? ` Key points: ${obj.facts.join(' ')}` : '';
  const epoch = relatedEpoch(obj);

  if (q.includes('database') || q.includes('source') || q.includes('data')) {
    return describeSources(obj);
  }
  if (q.includes('evolve') || q.includes('evolution') || q.includes('origin')) {
    return epoch ?? `${obj.name} is part of the lineage traced by the Tree of Life and the deep-time timeline.`;
  }
  if (q.includes('genome') || q.includes('gene') || q.includes('dna')) {
    return obj.ncbiTaxId
      ? `${obj.name} carries NCBI Taxonomy id ${obj.ncbiTaxId}; gene models and genomic context are available through Ensembl and NCBI.`
      : `Genomic context for ${obj.name} is reached through its Ensembl and NCBI cross references.`;
  }
  if (q.includes('where') || q.includes('expressed') || q.includes('tissue')) {
    return `${obj.summary} ${describeSources(obj)}`;
  }
  if (q.includes('position') || q.includes('orbit') || q.includes('ephemeris')) {
    return 'Planet and moon positions are computed from the astronomy-engine ephemeris for the scrubber date, so the solar system is laid out correctly for any moment you scrub to.';
  }

  // Default: the curated summary, facts, provenance, and any epoch link.
  return `${obj.summary}${facts} ${describeSources(obj)}${epoch ? ` ${epoch}` : ''}`.trim();
}
