import { TaxonRank } from '../types';

/**
 * A representative slice of the Tree of Life. This is deliberately a curated
 * sample, not the whole of NCBI Taxonomy: it carries the canonical lineage from
 * the three domains down to Homo sapiens, plus enough sibling clades at each
 * rank for the phylogenetic galaxy to read as a real tree.
 *
 * The shape mirrors what a paginated NCBI Taxonomy or Open Tree of Life client
 * would return (id, rank, parent, children, tax id), so `ncbiTaxonomyClient`
 * can later stream children on demand without changing the scene code.
 */
export interface TaxonNode {
  id: string;
  name: string;
  common?: string;
  rank: TaxonRank;
  ncbiTaxId?: number;
  /** Hue in degrees used to tint this clade in the galaxy. */
  hue: number;
  children: TaxonNode[];
}

const species = (
  id: string,
  name: string,
  common: string,
  ncbiTaxId: number,
  hue: number,
): TaxonNode => ({ id, name, common, rank: 'species', ncbiTaxId, hue, children: [] });

export const TREE_OF_LIFE: TaxonNode[] = [
  {
    id: 'eukaryota',
    name: 'Eukaryota',
    common: 'Eukaryotes',
    rank: 'domain',
    ncbiTaxId: 2759,
    hue: 28,
    children: [
      {
        id: 'animalia',
        name: 'Animalia',
        common: 'Animals',
        rank: 'kingdom',
        ncbiTaxId: 33208,
        hue: 20,
        children: [
          {
            id: 'chordata',
            name: 'Chordata',
            common: 'Chordates',
            rank: 'phylum',
            ncbiTaxId: 7711,
            hue: 18,
            children: [
              {
                id: 'mammalia',
                name: 'Mammalia',
                common: 'Mammals',
                rank: 'class',
                ncbiTaxId: 40674,
                hue: 26,
                children: [
                  {
                    id: 'primates',
                    name: 'Primates',
                    common: 'Primates',
                    rank: 'order',
                    ncbiTaxId: 9443,
                    hue: 30,
                    children: [
                      {
                        id: 'hominidae',
                        name: 'Hominidae',
                        common: 'Great apes',
                        rank: 'family',
                        ncbiTaxId: 9604,
                        hue: 34,
                        children: [
                          {
                            id: 'homo',
                            name: 'Homo',
                            common: 'Humans',
                            rank: 'genus',
                            ncbiTaxId: 9605,
                            hue: 38,
                            children: [
                              species('homo_sapiens', 'Homo sapiens', 'Human', 9606, 40),
                            ],
                          },
                          {
                            id: 'pan',
                            name: 'Pan',
                            common: 'Chimpanzees',
                            rank: 'genus',
                            ncbiTaxId: 9596,
                            hue: 44,
                            children: [
                              species('pan_troglodytes', 'Pan troglodytes', 'Chimpanzee', 9598, 46),
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  {
                    id: 'rodentia',
                    name: 'Rodentia',
                    common: 'Rodents',
                    rank: 'order',
                    ncbiTaxId: 9989,
                    hue: 50,
                    children: [
                      {
                        id: 'muridae',
                        name: 'Muridae',
                        common: 'Murids',
                        rank: 'family',
                        ncbiTaxId: 10066,
                        hue: 54,
                        children: [
                          {
                            id: 'mus',
                            name: 'Mus',
                            common: 'Mice',
                            rank: 'genus',
                            ncbiTaxId: 10088,
                            hue: 58,
                            children: [species('mus_musculus', 'Mus musculus', 'House mouse', 10090, 60)],
                          },
                        ],
                      },
                    ],
                  },
                  {
                    id: 'carnivora',
                    name: 'Carnivora',
                    common: 'Carnivorans',
                    rank: 'order',
                    ncbiTaxId: 33554,
                    hue: 12,
                    children: [
                      {
                        id: 'felidae',
                        name: 'Felidae',
                        common: 'Cats',
                        rank: 'family',
                        ncbiTaxId: 9608,
                        hue: 8,
                        children: [
                          {
                            id: 'felis',
                            name: 'Felis',
                            common: 'Small cats',
                            rank: 'genus',
                            ncbiTaxId: 9682,
                            hue: 4,
                            children: [species('felis_catus', 'Felis catus', 'Domestic cat', 9685, 2)],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                id: 'aves',
                name: 'Aves',
                common: 'Birds',
                rank: 'class',
                ncbiTaxId: 8782,
                hue: 200,
                children: [
                  {
                    id: 'galliformes',
                    name: 'Galliformes',
                    common: 'Landfowl',
                    rank: 'order',
                    ncbiTaxId: 8976,
                    hue: 205,
                    children: [
                      {
                        id: 'phasianidae',
                        name: 'Phasianidae',
                        common: 'Pheasants',
                        rank: 'family',
                        ncbiTaxId: 9005,
                        hue: 210,
                        children: [
                          {
                            id: 'gallus',
                            name: 'Gallus',
                            common: 'Junglefowl',
                            rank: 'genus',
                            ncbiTaxId: 9030,
                            hue: 214,
                            children: [species('gallus_gallus', 'Gallus gallus', 'Chicken', 9031, 218)],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            id: 'arthropoda',
            name: 'Arthropoda',
            common: 'Arthropods',
            rank: 'phylum',
            ncbiTaxId: 6656,
            hue: 95,
            children: [
              {
                id: 'insecta',
                name: 'Insecta',
                common: 'Insects',
                rank: 'class',
                ncbiTaxId: 50557,
                hue: 100,
                children: [
                  {
                    id: 'diptera',
                    name: 'Diptera',
                    common: 'True flies',
                    rank: 'order',
                    ncbiTaxId: 7147,
                    hue: 104,
                    children: [
                      {
                        id: 'drosophilidae',
                        name: 'Drosophilidae',
                        common: 'Fruit flies',
                        rank: 'family',
                        ncbiTaxId: 7214,
                        hue: 108,
                        children: [
                          {
                            id: 'drosophila',
                            name: 'Drosophila',
                            common: 'Fruit flies',
                            rank: 'genus',
                            ncbiTaxId: 7215,
                            hue: 112,
                            children: [
                              species('drosophila_melanogaster', 'Drosophila melanogaster', 'Fruit fly', 7227, 116),
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'viridiplantae',
        name: 'Viridiplantae',
        common: 'Green plants',
        rank: 'kingdom',
        ncbiTaxId: 33090,
        hue: 140,
        children: [
          {
            id: 'streptophyta',
            name: 'Streptophyta',
            common: 'Land plants',
            rank: 'phylum',
            ncbiTaxId: 35493,
            hue: 144,
            children: [
              {
                id: 'magnoliopsida',
                name: 'Magnoliopsida',
                common: 'Dicots',
                rank: 'class',
                ncbiTaxId: 3398,
                hue: 148,
                children: [
                  {
                    id: 'brassicales',
                    name: 'Brassicales',
                    common: 'Mustard order',
                    rank: 'order',
                    ncbiTaxId: 3699,
                    hue: 152,
                    children: [
                      {
                        id: 'brassicaceae',
                        name: 'Brassicaceae',
                        common: 'Mustards',
                        rank: 'family',
                        ncbiTaxId: 3700,
                        hue: 156,
                        children: [
                          {
                            id: 'arabidopsis',
                            name: 'Arabidopsis',
                            common: 'Rockcress',
                            rank: 'genus',
                            ncbiTaxId: 3701,
                            hue: 160,
                            children: [
                              species('arabidopsis_thaliana', 'Arabidopsis thaliana', 'Thale cress', 3702, 164),
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'fungi',
        name: 'Fungi',
        common: 'Fungi',
        rank: 'kingdom',
        ncbiTaxId: 4751,
        hue: 48,
        children: [
          {
            id: 'ascomycota',
            name: 'Ascomycota',
            common: 'Sac fungi',
            rank: 'phylum',
            ncbiTaxId: 4890,
            hue: 52,
            children: [
              {
                id: 'saccharomycetes',
                name: 'Saccharomycetes',
                common: 'True yeasts',
                rank: 'class',
                ncbiTaxId: 4891,
                hue: 56,
                children: [
                  {
                    id: 'saccharomycetales',
                    name: 'Saccharomycetales',
                    common: 'Budding yeasts',
                    rank: 'order',
                    ncbiTaxId: 4892,
                    hue: 60,
                    children: [
                      {
                        id: 'saccharomycetaceae',
                        name: 'Saccharomycetaceae',
                        common: 'Yeasts',
                        rank: 'family',
                        ncbiTaxId: 4893,
                        hue: 64,
                        children: [
                          {
                            id: 'saccharomyces',
                            name: 'Saccharomyces',
                            common: 'Yeasts',
                            rank: 'genus',
                            ncbiTaxId: 4930,
                            hue: 68,
                            children: [
                              species('saccharomyces_cerevisiae', 'Saccharomyces cerevisiae', "Baker's yeast", 4932, 72),
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'bacteria',
    name: 'Bacteria',
    common: 'Bacteria',
    rank: 'domain',
    ncbiTaxId: 2,
    hue: 280,
    children: [
      {
        id: 'pseudomonadota',
        name: 'Pseudomonadota',
        common: 'Proteobacteria',
        rank: 'phylum',
        ncbiTaxId: 1224,
        hue: 284,
        children: [
          {
            id: 'gammaproteobacteria',
            name: 'Gammaproteobacteria',
            common: 'Gamma proteobacteria',
            rank: 'class',
            ncbiTaxId: 1236,
            hue: 288,
            children: [
              {
                id: 'enterobacterales',
                name: 'Enterobacterales',
                common: 'Enterobacteria',
                rank: 'order',
                ncbiTaxId: 91347,
                hue: 292,
                children: [
                  {
                    id: 'enterobacteriaceae',
                    name: 'Enterobacteriaceae',
                    common: 'Enterics',
                    rank: 'family',
                    ncbiTaxId: 543,
                    hue: 296,
                    children: [
                      {
                        id: 'escherichia',
                        name: 'Escherichia',
                        common: 'Escherichia',
                        rank: 'genus',
                        ncbiTaxId: 561,
                        hue: 300,
                        children: [species('escherichia_coli', 'Escherichia coli', 'E. coli', 562, 304)],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'archaea',
    name: 'Archaea',
    common: 'Archaea',
    rank: 'domain',
    ncbiTaxId: 2157,
    hue: 320,
    children: [
      {
        id: 'methanocaldococcaceae_phylum',
        name: 'Methanococci',
        common: 'Methanococci',
        rank: 'phylum',
        ncbiTaxId: 183939,
        hue: 324,
        children: [
          {
            id: 'methanococci_class',
            name: 'Methanococci',
            common: 'Methanococci',
            rank: 'class',
            ncbiTaxId: 183939,
            hue: 328,
            children: [
              {
                id: 'methanococcales',
                name: 'Methanococcales',
                common: 'Methanococcales',
                rank: 'order',
                ncbiTaxId: 2182,
                hue: 332,
                children: [
                  {
                    id: 'methanocaldococcaceae',
                    name: 'Methanocaldococcaceae',
                    common: 'Methanocaldococci',
                    rank: 'family',
                    ncbiTaxId: 196117,
                    hue: 336,
                    children: [
                      {
                        id: 'methanocaldococcus',
                        name: 'Methanocaldococcus',
                        common: 'Methanocaldococcus',
                        rank: 'genus',
                        ncbiTaxId: 196118,
                        hue: 340,
                        children: [
                          species(
                            'methanocaldococcus_jannaschii',
                            'Methanocaldococcus jannaschii',
                            'M. jannaschii',
                            2190,
                            344,
                          ),
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

// ---- traversal helpers ------------------------------------------------------

const byId = new Map<string, TaxonNode>();
const parentOf = new Map<string, TaxonNode | null>();

(function index(nodes: TaxonNode[], parent: TaxonNode | null): void {
  for (const node of nodes) {
    byId.set(node.id, node);
    parentOf.set(node.id, parent);
    index(node.children, node);
  }
})(TREE_OF_LIFE, null);

export function getTaxon(id: string): TaxonNode | undefined {
  return byId.get(id);
}

/** Path from the domain down to (and including) the given node. */
export function lineageOf(id: string): TaxonNode[] {
  const path: TaxonNode[] = [];
  let node: TaxonNode | undefined = byId.get(id);
  while (node) {
    path.unshift(node);
    node = parentOf.get(node.id) ?? undefined;
  }
  return path;
}

export function childrenOf(id: string | null): TaxonNode[] {
  if (id === null) return TREE_OF_LIFE;
  return byId.get(id)?.children ?? [];
}

/** Flattened list of every node, for search and instanced rendering. */
export function allTaxa(): TaxonNode[] {
  return Array.from(byId.values());
}

export function searchTaxa(text: string, limit = 12): TaxonNode[] {
  const q = text.trim().toLowerCase();
  if (!q) return [];
  const out: TaxonNode[] = [];
  for (const node of byId.values()) {
    if (
      node.name.toLowerCase().includes(q) ||
      node.common?.toLowerCase().includes(q)
    ) {
      out.push(node);
      if (out.length >= limit) break;
    }
  }
  return out;
}
