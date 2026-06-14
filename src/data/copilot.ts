import { BioObject, DataSourceId, Scale } from '../types';
import { SCALE_LEVELS } from './scales';
import { allResolvedObjects } from './resolve';
import { DATA_SOURCES, DATA_SOURCE_ORDER } from './sources';

export interface CopilotContext {
  scale: Scale;
  selected: BioObject | null;
  hovered: BioObject | null;
}

export interface CopilotAnswer {
  title: string;
  paragraphs: string[];
  evidence: string[];
  sources: DataSourceId[];
}

const STOP_WORDS = new Set(['about', 'what', 'where', 'which', 'with', 'this', 'that', 'from', 'does', 'have', 'into', 'view', 'tell', 'explain', 'would', 'could', 'their', 'there', 'they', 'them', 'than']);

const tokens = (text: string): string[] => text.toLowerCase().match(/[a-z0-9]+/g)?.filter((word) => word.length > 2 && !STOP_WORDS.has(word)) ?? [];
const objectText = (object: BioObject): string => [object.name, object.kind, object.summary, object.size, ...object.facts].join(' ').toLowerCase();

export function observedObject(context: CopilotContext): BioObject | null {
  return context.hovered ?? context.selected;
}

export function contextualQuestions(context: CopilotContext): string[] {
  const object = observedObject(context);
  if (!object) {
    const level = SCALE_LEVELS[context.scale];
    return [
      `What defines the ${level.name} scale?`,
      `How does ${level.name} connect to the scales around it?`,
      'Which scientific sources can explain this view?',
    ];
  }
  // Cities at the Ecosystem scale are grounded as ecological places.
  if (object.kind === 'place') {
    return [
      `Why is ${object.name} biodiverse?`,
      `What endangered species live around ${object.name}?`,
      `How does the ${object.name} ecosystem function?`,
      `What invasive species threaten the ${object.name} region?`,
    ];
  }
  if (object.id.startsWith('organism:eco:')) {
    return [
      `What is the conservation status of ${object.name}?`,
      `What role does ${object.name} play in its ecosystem?`,
      `Which databases record ${object.name}?`,
    ];
  }
  return [
    `Explain ${object.name} from structure to function`,
    `How does ${object.name} connect to nearby biological scales?`,
    `What evidence and sources describe ${object.name}?`,
  ];
}

export function contextualStops(context: CopilotContext, limit = 3): BioObject[] {
  const focus = observedObject(context);
  return rankObjects('', context, focus).filter((object) => object.id !== focus?.id).slice(0, limit);
}

export function answerQuestion(query: string, context: CopilotContext): CopilotAnswer {
  const focus = observedObject(context);
  const matches = rankObjects(query, context, focus).slice(0, 5);
  const primary = matches[0] ?? focus;
  const level = SCALE_LEVELS[context.scale];
  const sources = collectSources(matches.length ? matches : focus ? [focus] : []);

  if (!primary) {
    return {
      title: `${level.name} view`,
      paragraphs: [
        `${level.blurb} Its characteristic magnitude is ${level.magnitude}. The copilot is observing the current scene and does not move the camera or change the selection.`,
        `Across the atlas, this scale is interpreted alongside adjacent levels so that form, function, ancestry, expression, pathways, and molecular structure remain connected rather than treated as isolated facts.`,
      ],
      evidence: DATA_SOURCE_ORDER.map((id) => `${DATA_SOURCES[id].name}: ${DATA_SOURCES[id].domain}.`),
      sources: DATA_SOURCE_ORDER,
    };
  }

  const related = matches.filter((object) => object.id !== primary.id).slice(0, 3);
  const paragraphs = [
    `${primary.name} is shown at the ${SCALE_LEVELS[primary.scale].name.toLowerCase()} scale. ${primary.summary} Its recorded size or scope is ${primary.size}.`,
    explainMechanism(primary),
    related.length
      ? `In the atlas corpus, the closest connected records are ${related.map((object) => `${object.name} (${SCALE_LEVELS[object.scale].name.toLowerCase()})`).join(', ')}. These links place the current view in a wider structural and functional context.`
      : `This record is interpreted against the neighboring ${SCALE_LEVELS[Math.max(0, primary.scale - 1) as Scale].name.toLowerCase()} and ${SCALE_LEVELS[Math.min(SCALE_LEVELS.length - 1, primary.scale + 1) as Scale].name.toLowerCase()} scales.`,
    `Evidence coverage is assembled from the atlas corpus across ${sourceNames(sources)}. Source coverage describes what the atlas can substantiate; it is not a claim that every open biological record has been loaded into this view.`,
  ];

  return {
    title: primary.name,
    paragraphs,
    evidence: [...primary.facts, ...related.slice(0, 2).map((object) => `${object.name}: ${object.summary}`)].slice(0, 6),
    sources: sources.length ? sources : DATA_SOURCE_ORDER,
  };
}

function explainMechanism(object: BioObject): string {
  const facts = object.facts.length ? object.facts.join(' ') : object.summary;
  return `At a finer level, its behavior emerges from interacting parts and processes: ${facts} At a broader level, those processes contribute to the organization and behavior of the surrounding ${SCALE_LEVELS[Math.max(0, object.scale - 1) as Scale].name.toLowerCase()}.`;
}

function rankObjects(query: string, context: CopilotContext, focus: BioObject | null): BioObject[] {
  const queryTokens = tokens(query);
  const corpus = allResolvedObjects();
  if (focus && !corpus.some((object) => object.id === focus.id)) corpus.unshift(focus);
  return corpus
    .map((object) => {
      const text = objectText(object);
      let score = queryTokens.reduce((sum, token) => sum + (text.includes(token) ? 8 : 0), 0);
      score += Math.max(0, 5 - Math.abs(object.scale - context.scale));
      if (focus) {
        if (object.id === focus.id) score += queryTokens.length ? 5 : 20;
        if (object.kind === focus.kind) score += 2;
        if (object.source && object.source === focus.source) score += 2;
        if (object.crossRefs?.some((source) => source === focus.source || focus.crossRefs?.includes(source))) score += 1;
      }
      return { object, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.object.name.localeCompare(b.object.name))
    .map(({ object }) => object);
}

function collectSources(objects: BioObject[]): DataSourceId[] {
  const found = new Set<DataSourceId>();
  for (const object of objects) {
    if (object.source) found.add(object.source);
    for (const source of object.crossRefs ?? []) found.add(source);
  }
  return DATA_SOURCE_ORDER.filter((source) => found.has(source));
}

function sourceNames(sources: DataSourceId[]): string {
  return (sources.length ? sources : DATA_SOURCE_ORDER).map((id) => DATA_SOURCES[id].name).join(', ');
}
