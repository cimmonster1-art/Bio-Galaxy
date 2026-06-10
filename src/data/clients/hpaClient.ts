// Human Protein Atlas client. Provides tissue and single cell expression
// context for a gene. The HPA search API returns JSON for selected columns.

import { getJson, RequestOptions } from './http';

const BASE = 'https://www.proteinatlas.org/api/search_download.php';

export interface ExpressionContext {
  gene: string;
  ensemblId?: string;
  tissues: string[];
  singleCellTypes: string[];
}

interface RawRow {
  Gene?: string;
  Ensembl?: string;
  'RNA tissue specific nTPM'?: Record<string, number> | string;
  'RNA single cell type specific nTPM'?: Record<string, number> | string;
}

function keysOf(field: Record<string, number> | string | undefined): string[] {
  if (!field) return [];
  if (typeof field === 'string') {
    return field
      .split(';')
      .map((s) => s.split(':')[0].trim())
      .filter(Boolean)
      .slice(0, 8);
  }
  return Object.keys(field).slice(0, 8);
}

/** Fetch tissue and single cell expression context for a gene symbol. */
export async function getExpression(
  gene: string,
  opts: RequestOptions = {},
): Promise<ExpressionContext> {
  const columns =
    'g,eg,rnatsm,rnascsm';
  const url =
    `${BASE}?search=${encodeURIComponent(gene)}&format=json&columns=${columns}&compress=no`;
  const rows = await getJson<RawRow[]>(url, { cacheMs: 30 * 60_000, ...opts });
  const row = rows[0] ?? {};
  return {
    gene,
    ensemblId: row.Ensembl,
    tissues: keysOf(row['RNA tissue specific nTPM']),
    singleCellTypes: keysOf(row['RNA single cell type specific nTPM']),
  };
}
