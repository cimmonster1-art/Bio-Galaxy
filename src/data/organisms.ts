// Organism field data. The atlas does not fetch every organism; instead it
// renders representative, named taxa plus a procedurally sampled cloud of
// nodes around each one. The query interface mirrors a future paginated API so
// the field can later be backed by NCBI Taxonomy or Ensembl without changing
// the scene code.

export interface TaxonGroup {
  id: string;
  name: string;
  domain: 'Bacteria' | 'Archaea' | 'Eukaryota';
  /** Hue in degrees used to tint this constellation. */
  hue: number;
  /** Representative species shown as named anchor nodes. */
  representatives: string[];
  /** Rough number of described species, used only for node density. */
  describedSpecies: number;
  ncbiTaxId: number;
}

export const TAXON_GROUPS: TaxonGroup[] = [
  {
    id: 'mammals',
    name: 'Mammals',
    domain: 'Eukaryota',
    hue: 28,
    representatives: ['Homo sapiens', 'Mus musculus', 'Bos taurus'],
    describedSpecies: 6400,
    ncbiTaxId: 40674,
  },
  {
    id: 'birds',
    name: 'Birds',
    domain: 'Eukaryota',
    hue: 200,
    representatives: ['Gallus gallus', 'Taeniopygia guttata'],
    describedSpecies: 11000,
    ncbiTaxId: 8782,
  },
  {
    id: 'insects',
    name: 'Insects',
    domain: 'Eukaryota',
    hue: 95,
    representatives: ['Drosophila melanogaster', 'Apis mellifera'],
    describedSpecies: 1000000,
    ncbiTaxId: 50557,
  },
  {
    id: 'plants',
    name: 'Flowering Plants',
    domain: 'Eukaryota',
    hue: 140,
    representatives: ['Arabidopsis thaliana', 'Oryza sativa'],
    describedSpecies: 295000,
    ncbiTaxId: 3398,
  },
  {
    id: 'fungi',
    name: 'Fungi',
    domain: 'Eukaryota',
    hue: 48,
    representatives: ['Saccharomyces cerevisiae', 'Neurospora crassa'],
    describedSpecies: 148000,
    ncbiTaxId: 4751,
  },
  {
    id: 'bacteria',
    name: 'Bacteria',
    domain: 'Bacteria',
    hue: 280,
    representatives: ['Escherichia coli', 'Bacillus subtilis'],
    describedSpecies: 30000,
    ncbiTaxId: 2,
  },
  {
    id: 'archaea',
    name: 'Archaea',
    domain: 'Archaea',
    hue: 320,
    representatives: ['Methanocaldococcus jannaschii'],
    describedSpecies: 1000,
    ncbiTaxId: 2157,
  },
];

export interface OrganismQuery {
  /** Free text filter applied to taxon and representative names. */
  text?: string;
  /** Restrict to a single domain of life. */
  domain?: TaxonGroup['domain'];
}

/**
 * Filter the representative taxa. Shaped like a paginated query so a real API
 * client can drop in later without changing callers.
 */
export function queryTaxa(query: OrganismQuery = {}): TaxonGroup[] {
  const text = query.text?.trim().toLowerCase();
  return TAXON_GROUPS.filter((g) => {
    if (query.domain && g.domain !== query.domain) return false;
    if (!text) return true;
    if (g.name.toLowerCase().includes(text)) return true;
    return g.representatives.some((r) => r.toLowerCase().includes(text));
  });
}
