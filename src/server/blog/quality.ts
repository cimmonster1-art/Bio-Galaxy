// Editorial quality control for the journal. Every candidate article, whether
// generated or seeded, must pass these gates before it is published:
//
//   - it contains no em dashes or en dashes (a hard house-style rule)
//   - it has a real title and enough substance to be worth reading
//   - it is not a near-duplicate of anything already published
//
// `sanitize` enforces the dash rule by rewriting the text; `assess` then judges
// the cleaned candidate against the existing catalogue.

import type { BlogPost } from './store';

const DASH_RE = /\s*[—–]\s*/g; // em dash (—) and en dash (–)
const DOUBLE_HYPHEN_RE = /\s*--\s*/g;

/**
 * Remove every em/en dash from a string, replacing it with a comma and space so
 * the prose still reads naturally. Also collapses typed double hyphens.
 */
export function sanitize(text: string): string {
  return text
    .replace(DASH_RE, ', ')
    .replace(DOUBLE_HYPHEN_RE, ', ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** True when any em or en dash remains in the text. */
export function hasForbiddenDash(text: string): boolean {
  return /[—–]/.test(text);
}

/** Word-shingle Jaccard similarity in [0, 1]; higher means more alike. */
export function similarity(a: string, b: string): number {
  const shingles = (text: string): Set<string> => {
    const words = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
    const out = new Set<string>();
    for (let i = 0; i < words.length - 2; i++) out.add(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
    return out;
  };
  const sa = shingles(a);
  const sb = shingles(b);
  if (sa.size === 0 || sb.size === 0) return 0;
  let shared = 0;
  for (const s of sa) if (sb.has(s)) shared += 1;
  return shared / (sa.size + sb.size - shared);
}

export interface Assessment {
  ok: boolean;
  reasons: string[];
}

const MIN_WORDS = 320;
const MAX_SIMILARITY = 0.35;

/**
 * Judge a sanitized candidate. It must clear the dash rule, the length and
 * structure minimums, and stay distinct from every existing post in both title
 * and body. Returns the verdict plus human-readable reasons for any failure.
 */
export function assess(
  candidate: Pick<BlogPost, 'title' | 'body'>,
  existing: readonly Pick<BlogPost, 'title' | 'body'>[],
): Assessment {
  const reasons: string[] = [];
  const title = candidate.title.trim();
  const body = candidate.body.trim();
  const words = body.split(/\s+/).filter(Boolean).length;
  const paragraphs = body.split(/\n{2,}/).filter((p) => p.trim().length > 0);

  if (title.length < 12 || title.length > 110) reasons.push(`title length ${title.length} out of range`);
  if (hasForbiddenDash(`${title} ${body}`)) reasons.push('contains an em or en dash');
  if (words < MIN_WORDS) reasons.push(`body too short (${words} words, need ${MIN_WORDS})`);
  if (paragraphs.length < 3) reasons.push(`needs at least 3 paragraphs (has ${paragraphs.length})`);

  const lowerTitle = title.toLowerCase();
  for (const post of existing) {
    if (post.title.trim().toLowerCase() === lowerTitle) {
      reasons.push('duplicate title');
      break;
    }
  }
  for (const post of existing) {
    const score = similarity(body, post.body);
    if (score > MAX_SIMILARITY) {
      reasons.push(`too similar to "${post.title}" (${score.toFixed(2)})`);
      break;
    }
  }

  return { ok: reasons.length === 0, reasons };
}
