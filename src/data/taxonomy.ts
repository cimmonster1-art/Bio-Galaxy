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
                              species('homo_neanderthalensis', 'Homo neanderthalensis', 'Neanderthal', 63221, 39),
                              species('homo_heidelbergensis', 'Homo heidelbergensis', 'Heidelberg human', 1425170, 39),
                              species('homo_erectus', 'Homo erectus', 'Upright human', 9606, 38),
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
                              species('pan_paniscus', 'Pan paniscus', 'Bonobo', 9597, 47),
                            ],
                          },
                          {
                            id: 'gorilla',
                            name: 'Gorilla',
                            common: 'Gorillas',
                            rank: 'genus',
                            ncbiTaxId: 9592,
                            hue: 41,
                            children: [
                              species('gorilla_gorilla', 'Gorilla gorilla', 'Western gorilla', 9593, 42),
                            ],
                          },
                          {
                            id: 'pongo',
                            name: 'Pongo',
                            common: 'Orangutans',
                            rank: 'genus',
                            ncbiTaxId: 9599,
                            hue: 36,
                            children: [
                              species('pongo_abelii', 'Pongo abelii', 'Sumatran orangutan', 9601, 37),
                            ],
                          },
                        ],
                      },
                      {
                        id: 'hylobatidae',
                        name: 'Hylobatidae',
                        common: 'Gibbons',
                        rank: 'family',
                        ncbiTaxId: 9577,
                        hue: 33,
                        children: [
                          {
                            id: 'nomascus',
                            name: 'Nomascus',
                            common: 'Crested gibbons',
                            rank: 'genus',
                            ncbiTaxId: 61852,
                            hue: 32,
                            children: [
                              species('nomascus_leucogenys', 'Nomascus leucogenys', 'Northern white-cheeked gibbon', 61853, 32),
                            ],
                          },
                        ],
                      },
                      {
                        id: 'cercopithecidae',
                        name: 'Cercopithecidae',
                        common: 'Old World monkeys',
                        rank: 'family',
                        ncbiTaxId: 9527,
                        hue: 31,
                        children: [
                          {
                            id: 'macaca',
                            name: 'Macaca',
                            common: 'Macaques',
                            rank: 'genus',
                            ncbiTaxId: 9539,
                            hue: 31,
                            children: [
                              species('macaca_mulatta', 'Macaca mulatta', 'Rhesus macaque', 9544, 31),
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
                          {
                            id: 'rattus',
                            name: 'Rattus',
                            common: 'Rats',
                            rank: 'genus',
                            ncbiTaxId: 10114,
                            hue: 56,
                            children: [species('rattus_norvegicus', 'Rattus norvegicus', 'Brown rat', 10116, 56)],
                          },
                        ],
                      },
                      {
                        id: 'sciuridae',
                        name: 'Sciuridae',
                        common: 'Squirrels',
                        rank: 'family',
                        ncbiTaxId: 55153,
                        hue: 52,
                        children: [
                          {
                            id: 'marmota',
                            name: 'Marmota',
                            common: 'Marmots',
                            rank: 'genus',
                            ncbiTaxId: 9992,
                            hue: 52,
                            children: [species('marmota_marmota', 'Marmota marmota', 'Alpine marmot', 9994, 52)],
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
                        ncbiTaxId: 9681,
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
                          {
                            id: 'panthera',
                            name: 'Panthera',
                            common: 'Big cats',
                            rank: 'genus',
                            ncbiTaxId: 146712,
                            hue: 6,
                            children: [species('panthera_tigris', 'Panthera tigris', 'Tiger', 9694, 6)],
                          },
                        ],
                      },
                      {
                        id: 'canidae',
                        name: 'Canidae',
                        common: 'Dogs',
                        rank: 'family',
                        ncbiTaxId: 9608,
                        hue: 14,
                        children: [
                          {
                            id: 'canis',
                            name: 'Canis',
                            common: 'Wolves and dogs',
                            rank: 'genus',
                            ncbiTaxId: 9611,
                            hue: 16,
                            children: [species('canis_lupus', 'Canis lupus', 'Gray wolf', 9612, 16)],
                          },
                        ],
                      },
                    ],
                  },
                  {
                    id: 'cetartiodactyla',
                    name: 'Artiodactyla',
                    common: 'Even-toed ungulates',
                    rank: 'order',
                    ncbiTaxId: 91561,
                    hue: 22,
                    children: [
                      {
                        id: 'bovidae',
                        name: 'Bovidae',
                        common: 'Cattle and antelope',
                        rank: 'family',
                        ncbiTaxId: 9895,
                        hue: 23,
                        children: [
                          {
                            id: 'bos',
                            name: 'Bos',
                            common: 'Cattle',
                            rank: 'genus',
                            ncbiTaxId: 9903,
                            hue: 24,
                            children: [species('bos_taurus', 'Bos taurus', 'Cattle', 9913, 24)],
                          },
                        ],
                      },
                    ],
                  },
                  {
                    id: 'chiroptera',
                    name: 'Chiroptera',
                    common: 'Bats',
                    rank: 'order',
                    ncbiTaxId: 9397,
                    hue: 28,
                    children: [
                      {
                        id: 'pteropodidae',
                        name: 'Pteropodidae',
                        common: 'Fruit bats',
                        rank: 'family',
                        ncbiTaxId: 9398,
                        hue: 28,
                        children: [
                          {
                            id: 'pteropus',
                            name: 'Pteropus',
                            common: 'Flying foxes',
                            rank: 'genus',
                            ncbiTaxId: 9401,
                            hue: 28,
                            children: [species('pteropus_vampyrus', 'Pteropus vampyrus', 'Large flying fox', 132908, 28)],
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
                  {
                    id: 'passeriformes',
                    name: 'Passeriformes',
                    common: 'Perching birds',
                    rank: 'order',
                    ncbiTaxId: 9126,
                    hue: 198,
                    children: [
                      {
                        id: 'fringillidae',
                        name: 'Fringillidae',
                        common: 'True finches',
                        rank: 'family',
                        ncbiTaxId: 9133,
                        hue: 196,
                        children: [
                          {
                            id: 'taeniopygia',
                            name: 'Taeniopygia',
                            common: 'Australian finches',
                            rank: 'genus',
                            ncbiTaxId: 59729,
                            hue: 196,
                            children: [species('taeniopygia_guttata', 'Taeniopygia guttata', 'Zebra finch', 59729, 196)],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                id: 'reptilia',
                name: 'Reptilia',
                common: 'Reptiles',
                rank: 'class',
                ncbiTaxId: 8504,
                hue: 175,
                children: [
                  {
                    id: 'squamata',
                    name: 'Squamata',
                    common: 'Lizards and snakes',
                    rank: 'order',
                    ncbiTaxId: 8509,
                    hue: 173,
                    children: [
                      {
                        id: 'gekkonidae',
                        name: 'Gekkonidae',
                        common: 'Geckos',
                        rank: 'family',
                        ncbiTaxId: 8550,
                        hue: 172,
                        children: [
                          {
                            id: 'gekko',
                            name: 'Gekko',
                            common: 'True geckos',
                            rank: 'genus',
                            ncbiTaxId: 97162,
                            hue: 172,
                            children: [species('gekko_japonicus', 'Gekko japonicus', 'Schlegel gecko', 146911, 172)],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                id: 'amphibia',
                name: 'Amphibia',
                common: 'Amphibians',
                rank: 'class',
                ncbiTaxId: 8292,
                hue: 158,
                children: [
                  {
                    id: 'anura',
                    name: 'Anura',
                    common: 'Frogs and toads',
                    rank: 'order',
                    ncbiTaxId: 8342,
                    hue: 156,
                    children: [
                      {
                        id: 'pipidae',
                        name: 'Pipidae',
                        common: 'Tongueless frogs',
                        rank: 'family',
                        ncbiTaxId: 8352,
                        hue: 155,
                        children: [
                          {
                            id: 'xenopus',
                            name: 'Xenopus',
                            common: 'Clawed frogs',
                            rank: 'genus',
                            ncbiTaxId: 8353,
                            hue: 155,
                            children: [species('xenopus_tropicalis', 'Xenopus tropicalis', 'Western clawed frog', 8364, 155)],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                id: 'actinopterygii',
                name: 'Actinopterygii',
                common: 'Ray-finned fishes',
                rank: 'class',
                ncbiTaxId: 7898,
                hue: 188,
                children: [
                  {
                    id: 'cypriniformes',
                    name: 'Cypriniformes',
                    common: 'Carps and minnows',
                    rank: 'order',
                    ncbiTaxId: 7952,
                    hue: 186,
                    children: [
                      {
                        id: 'danionidae',
                        name: 'Danionidae',
                        common: 'Danios',
                        rank: 'family',
                        ncbiTaxId: 1490492,
                        hue: 185,
                        children: [
                          {
                            id: 'danio',
                            name: 'Danio',
                            common: 'Danios',
                            rank: 'genus',
                            ncbiTaxId: 7954,
                            hue: 185,
                            children: [species('danio_rerio', 'Danio rerio', 'Zebrafish', 7955, 185)],
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
                  {
                    id: 'hymenoptera',
                    name: 'Hymenoptera',
                    common: 'Ants, bees and wasps',
                    rank: 'order',
                    ncbiTaxId: 7399,
                    hue: 96,
                    children: [
                      {
                        id: 'apidae',
                        name: 'Apidae',
                        common: 'Bees',
                        rank: 'family',
                        ncbiTaxId: 7458,
                        hue: 94,
                        children: [
                          {
                            id: 'apis',
                            name: 'Apis',
                            common: 'Honey bees',
                            rank: 'genus',
                            ncbiTaxId: 7459,
                            hue: 94,
                            children: [species('apis_mellifera', 'Apis mellifera', 'Western honey bee', 7460, 94)],
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
            id: 'nematoda',
            name: 'Nematoda',
            common: 'Roundworms',
            rank: 'phylum',
            ncbiTaxId: 6231,
            hue: 80,
            children: [
              {
                id: 'chromadorea',
                name: 'Chromadorea',
                common: 'Chromadoreans',
                rank: 'class',
                ncbiTaxId: 119089,
                hue: 78,
                children: [
                  {
                    id: 'rhabditida',
                    name: 'Rhabditida',
                    common: 'Rhabditids',
                    rank: 'order',
                    ncbiTaxId: 6236,
                    hue: 76,
                    children: [
                      {
                        id: 'rhabditidae',
                        name: 'Rhabditidae',
                        common: 'Rhabditids',
                        rank: 'family',
                        ncbiTaxId: 6243,
                        hue: 75,
                        children: [
                          {
                            id: 'caenorhabditis',
                            name: 'Caenorhabditis',
                            common: 'Caenorhabditis',
                            rank: 'genus',
                            ncbiTaxId: 6237,
                            hue: 75,
                            children: [species('caenorhabditis_elegans', 'Caenorhabditis elegans', 'Roundworm', 6239, 75)],
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
            id: 'mollusca',
            name: 'Mollusca',
            common: 'Molluscs',
            rank: 'phylum',
            ncbiTaxId: 6447,
            hue: 70,
            children: [
              {
                id: 'cephalopoda',
                name: 'Cephalopoda',
                common: 'Cephalopods',
                rank: 'class',
                ncbiTaxId: 6605,
                hue: 70,
                children: [
                  {
                    id: 'octopoda',
                    name: 'Octopoda',
                    common: 'Octopuses',
                    rank: 'order',
                    ncbiTaxId: 6645,
                    hue: 70,
                    children: [
                      {
                        id: 'octopodidae',
                        name: 'Octopodidae',
                        common: 'Octopuses',
                        rank: 'family',
                        ncbiTaxId: 6647,
                        hue: 70,
                        children: [
                          {
                            id: 'octopus_genus',
                            name: 'Octopus',
                            common: 'Octopuses',
                            rank: 'genus',
                            ncbiTaxId: 6643,
                            hue: 70,
                            children: [species('octopus_vulgaris', 'Octopus vulgaris', 'Common octopus', 6645, 70)],
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
            id: 'cnidaria',
            name: 'Cnidaria',
            common: 'Cnidarians',
            rank: 'phylum',
            ncbiTaxId: 6073,
            hue: 65,
            children: [
              {
                id: 'hydrozoa',
                name: 'Hydrozoa',
                common: 'Hydrozoans',
                rank: 'class',
                ncbiTaxId: 6074,
                hue: 64,
                children: [
                  {
                    id: 'anthoathecata',
                    name: 'Anthoathecata',
                    common: 'Anthoathecate hydroids',
                    rank: 'order',
                    ncbiTaxId: 406427,
                    hue: 63,
                    children: [
                      {
                        id: 'hydridae',
                        name: 'Hydridae',
                        common: 'Hydras',
                        rank: 'family',
                        ncbiTaxId: 6083,
                        hue: 62,
                        children: [
                          {
                            id: 'hydra_genus',
                            name: 'Hydra',
                            common: 'Hydras',
                            rank: 'genus',
                            ncbiTaxId: 6083,
                            hue: 62,
                            children: [species('hydra_vulgaris', 'Hydra vulgaris', 'Freshwater hydra', 6087, 62)],
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
                id: 'liliopsida',
                name: 'Liliopsida',
                common: 'Monocots',
                rank: 'class',
                ncbiTaxId: 4447,
                hue: 138,
                children: [
                  {
                    id: 'poales',
                    name: 'Poales',
                    common: 'Grasses and sedges',
                    rank: 'order',
                    ncbiTaxId: 38820,
                    hue: 136,
                    children: [
                      {
                        id: 'poaceae',
                        name: 'Poaceae',
                        common: 'Grasses',
                        rank: 'family',
                        ncbiTaxId: 4479,
                        hue: 134,
                        children: [
                          {
                            id: 'oryza',
                            name: 'Oryza',
                            common: 'Rice',
                            rank: 'genus',
                            ncbiTaxId: 4527,
                            hue: 132,
                            children: [species('oryza_sativa', 'Oryza sativa', 'Asian rice', 4530, 132)],
                          },
                          {
                            id: 'zea',
                            name: 'Zea',
                            common: 'Maize',
                            rank: 'genus',
                            ncbiTaxId: 4574,
                            hue: 133,
                            children: [species('zea_mays', 'Zea mays', 'Maize', 4577, 133)],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
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
        id: 'amoebozoa',
        name: 'Amoebozoa',
        common: 'Amoebae and slime moulds',
        rank: 'kingdom',
        ncbiTaxId: 554915,
        hue: 120,
        children: [
          {
            id: 'evosea',
            name: 'Evosea',
            common: 'Evoseans',
            rank: 'phylum',
            ncbiTaxId: 2606975,
            hue: 122,
            children: [
              {
                id: 'eumycetozoa',
                name: 'Eumycetozoa',
                common: 'Slime moulds',
                rank: 'class',
                ncbiTaxId: 142796,
                hue: 124,
                children: [
                  {
                    id: 'dictyosteliales',
                    name: 'Dictyosteliales',
                    common: 'Cellular slime moulds',
                    rank: 'order',
                    ncbiTaxId: 33083,
                    hue: 126,
                    children: [
                      {
                        id: 'dictyosteliaceae',
                        name: 'Dictyosteliaceae',
                        common: 'Dictyostelids',
                        rank: 'family',
                        ncbiTaxId: 261658,
                        hue: 128,
                        children: [
                          {
                            id: 'dictyostelium',
                            name: 'Dictyostelium',
                            common: 'Slime moulds',
                            rank: 'genus',
                            ncbiTaxId: 5782,
                            hue: 130,
                            children: [species('dictyostelium_discoideum', 'Dictyostelium discoideum', 'Slime mould', 44689, 130)],
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
                      {
                        id: 'salmonella',
                        name: 'Salmonella',
                        common: 'Salmonella',
                        rank: 'genus',
                        ncbiTaxId: 590,
                        hue: 298,
                        children: [species('salmonella_enterica', 'Salmonella enterica', 'Salmonella', 28901, 298)],
                      },
                    ],
                  },
                ],
              },
              {
                id: 'pseudomonadales',
                name: 'Pseudomonadales',
                common: 'Pseudomonads',
                rank: 'order',
                ncbiTaxId: 72274,
                hue: 290,
                children: [
                  {
                    id: 'pseudomonadaceae',
                    name: 'Pseudomonadaceae',
                    common: 'Pseudomonads',
                    rank: 'family',
                    ncbiTaxId: 135621,
                    hue: 290,
                    children: [
                      {
                        id: 'pseudomonas',
                        name: 'Pseudomonas',
                        common: 'Pseudomonas',
                        rank: 'genus',
                        ncbiTaxId: 286,
                        hue: 290,
                        children: [species('pseudomonas_aeruginosa', 'Pseudomonas aeruginosa', 'P. aeruginosa', 287, 290)],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            id: 'alphaproteobacteria',
            name: 'Alphaproteobacteria',
            common: 'Alpha proteobacteria',
            rank: 'class',
            ncbiTaxId: 28211,
            hue: 286,
            children: [
              {
                id: 'rickettsiales',
                name: 'Rickettsiales',
                common: 'Rickettsias',
                rank: 'order',
                ncbiTaxId: 766,
                hue: 285,
                children: [
                  {
                    id: 'rickettsiaceae',
                    name: 'Rickettsiaceae',
                    common: 'Rickettsias',
                    rank: 'family',
                    ncbiTaxId: 775,
                    hue: 285,
                    children: [
                      {
                        id: 'rickettsia',
                        name: 'Rickettsia',
                        common: 'Rickettsia',
                        rank: 'genus',
                        ncbiTaxId: 780,
                        hue: 285,
                        // Free living relatives of this clade gave rise to mitochondria.
                        children: [species('rickettsia_prowazekii', 'Rickettsia prowazekii', 'Typhus agent', 782, 285)],
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
        id: 'bacillota',
        name: 'Bacillota',
        common: 'Firmicutes',
        rank: 'phylum',
        ncbiTaxId: 1239,
        hue: 270,
        children: [
          {
            id: 'bacilli',
            name: 'Bacilli',
            common: 'Bacilli',
            rank: 'class',
            ncbiTaxId: 91061,
            hue: 268,
            children: [
              {
                id: 'bacillales',
                name: 'Bacillales',
                common: 'Bacillales',
                rank: 'order',
                ncbiTaxId: 1385,
                hue: 266,
                children: [
                  {
                    id: 'bacillaceae',
                    name: 'Bacillaceae',
                    common: 'Bacilli',
                    rank: 'family',
                    ncbiTaxId: 186817,
                    hue: 264,
                    children: [
                      {
                        id: 'bacillus',
                        name: 'Bacillus',
                        common: 'Bacillus',
                        rank: 'genus',
                        ncbiTaxId: 1386,
                        hue: 262,
                        children: [species('bacillus_subtilis', 'Bacillus subtilis', 'Hay bacillus', 1423, 262)],
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
        id: 'cyanobacteria',
        name: 'Cyanobacteriota',
        common: 'Cyanobacteria',
        rank: 'phylum',
        ncbiTaxId: 1117,
        hue: 250,
        children: [
          {
            id: 'cyanophyceae',
            name: 'Cyanophyceae',
            common: 'Cyanobacteria',
            rank: 'class',
            ncbiTaxId: 3035060,
            hue: 248,
            children: [
              {
                id: 'synechococcales',
                name: 'Synechococcales',
                common: 'Synechococcales',
                rank: 'order',
                ncbiTaxId: 1890424,
                hue: 246,
                children: [
                  {
                    id: 'prochlorococcaceae',
                    name: 'Prochlorococcaceae',
                    common: 'Prochlorococci',
                    rank: 'family',
                    ncbiTaxId: 2890963,
                    hue: 244,
                    children: [
                      {
                        id: 'prochlorococcus',
                        name: 'Prochlorococcus',
                        common: 'Prochlorococcus',
                        rank: 'genus',
                        ncbiTaxId: 1218,
                        hue: 242,
                        // Cyanobacteria of this kind are the ancestors of chloroplasts.
                        children: [species('prochlorococcus_marinus', 'Prochlorococcus marinus', 'Marine cyanobacterium', 1219, 242)],
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
        id: 'thermoproteota',
        name: 'Thermoproteota',
        common: 'Crenarchaeota',
        rank: 'phylum',
        ncbiTaxId: 28889,
        hue: 312,
        children: [
          {
            id: 'thermoprotei',
            name: 'Thermoprotei',
            common: 'Thermoprotei',
            rank: 'class',
            ncbiTaxId: 183924,
            hue: 310,
            children: [
              {
                id: 'sulfolobales',
                name: 'Sulfolobales',
                common: 'Sulfolobales',
                rank: 'order',
                ncbiTaxId: 2281,
                hue: 308,
                children: [
                  {
                    id: 'sulfolobaceae',
                    name: 'Sulfolobaceae',
                    common: 'Sulfolobus group',
                    rank: 'family',
                    ncbiTaxId: 118883,
                    hue: 306,
                    children: [
                      {
                        id: 'saccharolobus',
                        name: 'Saccharolobus',
                        common: 'Saccharolobus',
                        rank: 'genus',
                        ncbiTaxId: 2100760,
                        hue: 304,
                        children: [species('saccharolobus_solfataricus', 'Saccharolobus solfataricus', 'S. solfataricus', 2287, 304)],
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
