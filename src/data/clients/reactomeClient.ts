// Reactome client. Reactome supplies pathway relationships and the molecules
// that participate in them. The Content Service is public and key free.

import { getJson, RequestOptions } from './http';

const BASE = 'https://reactome.org/ContentService';

export interface ReactomeEntity {
  stId: string;
  name: string;
  schemaClass?: string;
}

export interface PathwayDetail {
  stId: string;
  name: string;
  species?: string;
  participants: ReactomeEntity[];
}

interface RawEntity {
  stId?: string;
  stIdVersion?: string;
  displayName?: string;
  name?: string[] | string;
  schemaClass?: string;
  speciesName?: string;
}

function name(raw: RawEntity): string {
  if (Array.isArray(raw.name)) return raw.name[0] ?? raw.displayName ?? 'Unknown';
  return raw.name ?? raw.displayName ?? 'Unknown';
}

/** Look up a pathway and a sampled set of its participating molecules. */
export async function getPathway(
  stId: string,
  opts: RequestOptions = {},
): Promise<PathwayDetail> {
  const detailUrl = `${BASE}/data/query/${encodeURIComponent(stId)}`;
  const partUrl = `${BASE}/data/participants/${encodeURIComponent(stId)}`;

  const [detail, participants] = await Promise.all([
    getJson<RawEntity>(detailUrl, { cacheMs: 10 * 60_000, ...opts }),
    getJson<Array<{ refEntities?: RawEntity[] }>>(partUrl, {
      cacheMs: 10 * 60_000,
      ...opts,
    }).catch(() => [] as Array<{ refEntities?: RawEntity[] }>),
  ]);

  const flat: ReactomeEntity[] = [];
  for (const group of participants) {
    for (const ref of group.refEntities ?? []) {
      if (!ref.stId && !ref.displayName) continue;
      flat.push({
        stId: ref.stId ?? ref.displayName ?? 'unknown',
        name: name(ref),
        schemaClass: ref.schemaClass,
      });
    }
  }

  return {
    stId: detail.stId ?? stId,
    name: name(detail),
    species: detail.speciesName,
    participants: dedupe(flat).slice(0, 40),
  };
}

function dedupe(entities: ReactomeEntity[]): ReactomeEntity[] {
  const seen = new Set<string>();
  const out: ReactomeEntity[] = [];
  for (const e of entities) {
    if (seen.has(e.stId)) continue;
    seen.add(e.stId);
    out.push(e);
  }
  return out;
}
