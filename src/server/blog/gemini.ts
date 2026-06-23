// Article generation via the Google Gemini API. The key is read from the
// environment and never logged. The model is asked for structured JSON and an
// explicit house style; the caller is still responsible for sanitizing the
// result and running quality control, so this module never publishes on its own.

export interface DraftArticle {
  title: string;
  summary: string;
  body: string;
  tags: string[];
}

const DEFAULT_MODEL = 'gemini-2.5-flash';

// A rotating set of angles so consecutive days explore genuinely different
// ground rather than rewording one evergreen overview.
const ANGLES = [
  'how the continuous scale navigator connects the cosmos to a single atom',
  'why source-aware visualization matters for trust in open science',
  'the engineering behind streaming real protein structures from RCSB PDB',
  'turning a typed amino-acid sequence into a live 3D helix in the search bar',
  'how PubChem 3D conformers become ball-and-stick molecules in the browser',
  'rendering the Tree of Life as an explorable spatial structure',
  'the role of the same-origin caching gateway in keeping the atlas fast',
  'what learners gain from moving through anatomy, cells, and organelles in 3D',
  'how instanced rendering keeps thousands of stars and atoms at full frame rate',
  'designing an interface where every object cites the database behind it',
  'the journey from a galaxy view down to a beating heart and its proteins',
  'why a key-free, public-data approach lowers the barrier to exploring biology',
  'how the search bar previews organisms, molecules, and structures instantly',
  'connecting genomics, pathways, and expression data into one continuous map',
];

function pickAngle(seed: number): string {
  return ANGLES[seed % ANGLES.length];
}

function buildPrompt(existingTitles: string[], angle: string): string {
  const avoid = existingTitles.length
    ? `Do not repeat or closely paraphrase any of these already-published titles or their themes:\n- ${existingTitles.join('\n- ')}`
    : 'There are no previous posts yet.';
  return [
    'You are the staff science writer for Bio Galaxy, an open-source interactive 3D biological atlas.',
    'Bio Galaxy connects 22 scales from the observable cosmos down to single atoms in one continuous WebGL interface built with React, TypeScript, and Three.js.',
    'It pulls live records from public, key-free scientific databases: UniProt, Reactome, RCSB PDB, Ensembl, the Human Protein Atlas, NCBI Taxonomy, PubChem, and AlphaFold.',
    'A standout feature: typing into the search bar renders a real-time 3D model of the result, a protein backbone ribbon, a small-molecule ball-and-stick conformer, an idealized peptide helix, or a DNA double helix.',
    '',
    `Write one original blog article focused on this angle: ${angle}.`,
    '',
    'House style, strictly enforced:',
    '- Never use em dashes or en dashes. Use commas, periods, or rephrase. Plain hyphens inside words are fine.',
    '- Write 650 to 900 words of accurate, engaging prose for a curious general-science audience.',
    '- Use short paragraphs separated by a single blank line. Do not use markdown headings, lists, or bold.',
    '- Be specific and factual about the platform and the science. Do not invent features or fake statistics.',
    '- The article must be distinct from every previous post in both topic and wording.',
    avoid,
    '',
    'Return only JSON matching the requested schema.',
  ].join('\n');
}

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}

/** True when a Gemini key is configured. The scheduler stays idle without one. */
export function isConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

/**
 * Ask Gemini for one structured article. Throws when no key is configured, the
 * request fails, or the response cannot be parsed. The returned draft is raw and
 * must still be sanitized and quality-checked before publishing.
 */
export async function generateArticle(existingTitles: string[], seed = Date.now()): Promise<DraftArticle> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new Error('GEMINI_API_KEY is not configured');
  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

  const payload = {
    contents: [{ parts: [{ text: buildPrompt(existingTitles, pickAngle(seed)) }] }],
    generationConfig: {
      temperature: 1.0,
      topP: 0.95,
      maxOutputTokens: 2048,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          summary: { type: 'string' },
          body: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
        },
        required: ['title', 'summary', 'body', 'tags'],
      },
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`Gemini request failed (${res.status})`);

  const data = (await res.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  const draft = parseDraft(text);
  if (!draft) throw new Error('Gemini response could not be parsed into an article');
  return draft;
}

/** Parse a JSON article from model text, tolerating stray code fences. */
function parseDraft(text: string): DraftArticle | null {
  const cleaned = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Partial<DraftArticle>;
    if (!parsed.title || !parsed.body || !parsed.summary) return null;
    return {
      title: String(parsed.title),
      summary: String(parsed.summary),
      body: String(parsed.body),
      tags: Array.isArray(parsed.tags) ? parsed.tags.map(String).slice(0, 6) : [],
    };
  } catch {
    return null;
  }
}
