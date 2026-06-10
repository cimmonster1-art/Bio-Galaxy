// Major evolutionary and biological epochs, from the origin of life to the
// first agricultural civilizations. This is a curated narrative spine for the
// Evolution tab: each entry pairs a plain, accurate summary with a short list
// of downstream implications, a Wikipedia title for the encyclopedia card, and
// an optional link to a taxon id in the Tree of Life. Times are approximate and
// quoted as ranges where the science is genuinely uncertain. No hype.

/** One epoch on the evolutionary timeline. */
export interface EvolutionEpoch {
  id: string;
  title: string;
  /** Approximate time, e.g. "3.8 Gya" (billions of years ago) or "12 kya". */
  time: string;
  /** Two to three sentences of plain description. */
  description: string;
  /** Downstream consequences this event made possible. */
  implications: string[];
  /** Wikipedia article title for the encyclopedia thumbnail and extract. */
  wikipedia: string;
  /** Optional id of a related node in TREE_OF_LIFE. */
  relatedTaxonId?: string;
  /** Marks the two endosymbiosis events for emphasis in the UI. */
  endosymbiosis?: boolean;
}

export const EVOLUTION_EPOCHS: EvolutionEpoch[] = [
  {
    id: 'origin_of_life',
    title: 'Origin of life',
    time: '3.8 to 4.1 Gya',
    description:
      'Self replicating chemistry arose on the early Earth, probably in an RNA based system where the same molecules could both store information and catalyse reactions. The first cells enclosed this chemistry in a lipid membrane, separating an internal metabolism from the surrounding water.',
    implications: [
      'Heredity and natural selection became possible once molecules could copy themselves with errors.',
      'A membrane boundary let cells hold gradients and concentrate useful molecules.',
    ],
    wikipedia: 'Abiogenesis',
  },
  {
    id: 'luca',
    title: 'Last universal common ancestor',
    time: '3.5 to 3.8 Gya',
    description:
      'All living cells trace back to a single population known as LUCA, which already used DNA, RNA, proteins, and the genetic code we see today. LUCA was not the first life but the most recent ancestor shared by every organism now alive.',
    implications: [
      'The shared genetic code and core biochemistry across all life are inherited from this ancestor.',
      'The tree of life branches into its deepest lineages from this point.',
    ],
    wikipedia: 'Last universal common ancestor',
  },
  {
    id: 'prokaryotes',
    title: 'Prokaryotes and the bacterial and archaeal split',
    time: '3.5 Gya',
    description:
      'Life diverged early into two prokaryotic domains, Bacteria and Archaea, cells without a nucleus or internal compartments. They evolved a vast range of metabolisms, including ways to harvest energy from light, minerals, and simple chemicals.',
    implications: [
      'Prokaryotic metabolism reshaped Earth chemistry, including the early carbon and sulphur cycles.',
      'Archaea later contributed the host lineage that became the eukaryotic cell.',
    ],
    wikipedia: 'Prokaryote',
    relatedTaxonId: 'bacteria',
  },
  {
    id: 'great_oxidation',
    title: 'Oxygenic photosynthesis and the Great Oxidation',
    time: '2.4 Gya',
    description:
      'Cyanobacteria evolved photosynthesis that splits water and releases oxygen as a by product. Over hundreds of millions of years this oxygen saturated mineral sinks and then accumulated in the atmosphere, an event called the Great Oxidation.',
    implications: [
      'Free atmospheric oxygen enabled aerobic respiration, which yields far more energy than fermentation.',
      'The new oxygen was toxic to many existing anaerobes and drove a major turnover of life.',
    ],
    wikipedia: 'Great Oxidation Event',
  },
  {
    id: 'endosymbiosis_mitochondria',
    title: 'Endosymbiosis: origin of mitochondria',
    time: '1.6 to 2.0 Gya',
    description:
      'An archaeal host cell engulfed a free living alpha proteobacterium and, instead of digesting it, kept it alive inside the cytoplasm. Over time this captured bacterium became the mitochondrion, retaining its own small genome and double membrane while transferring most of its genes to the host nucleus. This single merger underlies every eukaryotic lineage.',
    implications: [
      'Mitochondria supply most of the cell ATP through aerobic respiration, raising the energy available per gene.',
      'The surplus energy made large, gene rich, complex cells possible, a precondition for all later eukaryotic diversity.',
      'Mitochondrial DNA is inherited maternally and is used to trace deep ancestry.',
    ],
    wikipedia: 'Symbiogenesis',
    relatedTaxonId: 'eukaryota',
    endosymbiosis: true,
  },
  {
    id: 'endosymbiosis_chloroplasts',
    title: 'Endosymbiosis: origin of chloroplasts',
    time: '1.0 to 1.6 Gya',
    description:
      'In a separate, later event a eukaryotic cell that already had mitochondria engulfed a photosynthetic cyanobacterium and retained it. This captured cyanobacterium became the chloroplast, giving its host the ability to make food from sunlight. The lineage that resulted gave rise to algae and, eventually, all land plants.',
    implications: [
      'Photosynthesis moved into the eukaryotic world, founding the algae and the green plant lineage.',
      'Chloroplasts keep a reduced genome and double membrane, mirroring the mitochondrial pattern of capture.',
      'Plant primary production became the base of most terrestrial food webs.',
    ],
    wikipedia: 'Chloroplast',
    relatedTaxonId: 'viridiplantae',
    endosymbiosis: true,
  },
  {
    id: 'eukaryotes',
    title: 'Eukaryotic cells',
    time: '1.6 to 2.1 Gya',
    description:
      'Eukaryotes are cells with a nucleus, an internal membrane system, a cytoskeleton, and mitochondria. They package their DNA into chromosomes inside the nucleus and can grow far larger and more structurally complex than prokaryotes.',
    implications: [
      'Internal compartments allowed specialised functions to be separated within one cell.',
      'Sexual reproduction and meiosis, which mix genomes each generation, became widespread.',
      'The eukaryotic body plan is the foundation for all animals, plants, and fungi.',
    ],
    wikipedia: 'Eukaryote',
    relatedTaxonId: 'eukaryota',
  },
  {
    id: 'multicellularity',
    title: 'Multicellularity',
    time: '0.6 to 1.5 Gya',
    description:
      'Multicellular life arose independently several times, in animals, plants, fungi, and various algae. Cells that stayed together after division and divided labour between cell types could form tissues, hold their shape, and grow large.',
    implications: [
      'Cell specialisation produced distinct tissues such as skin, muscle, and conductive tissue.',
      'Larger bodies opened new ecological roles in feeding, movement, and defence.',
      'Programmed cell death and tight growth control became essential to coordinate the body.',
    ],
    wikipedia: 'Multicellular organism',
    relatedTaxonId: 'animalia',
  },
  {
    id: 'cambrian',
    title: 'Cambrian explosion',
    time: '538 Mya',
    description:
      'Over a geologically short interval most major animal body plans appear in the fossil record, including the first hard skeletons, complex eyes, and active predators. Rising oxygen, new genetic toolkits, and ecological feedback such as predation are thought to have driven the rapid diversification.',
    implications: [
      'Nearly all living animal phyla can be traced to forms that appear in this interval.',
      'Predator and prey arms races accelerated the evolution of mobility, armour, and sensing.',
      'Mineralised skeletons left a far richer fossil record from this point on.',
    ],
    wikipedia: 'Cambrian explosion',
    relatedTaxonId: 'animalia',
  },
  {
    id: 'vertebrates',
    title: 'Vertebrates',
    time: '525 Mya',
    description:
      'Within the chordates a lineage evolved a backbone of vertebrae protecting a dorsal nerve cord, along with a distinct head and brain. Early vertebrates were jawless fishes; jaws and paired fins evolved later and improved feeding and swimming.',
    implications: [
      'A bony or cartilaginous internal skeleton supported larger, faster bodies.',
      'A centralised brain and paired sense organs enabled more complex behaviour.',
      'This lineage leads to all fishes, amphibians, reptiles, birds, and mammals.',
    ],
    wikipedia: 'Vertebrate',
    relatedTaxonId: 'chordata',
  },
  {
    id: 'tetrapods',
    title: 'Tetrapods and the move to land',
    time: '375 Mya',
    description:
      'Lobe finned fishes evolved sturdy limbs with digits and began to exploit shallow water and land. These tetrapods solved the problems of breathing air, supporting weight against gravity, and preventing water loss.',
    implications: [
      'Limbs with digits replaced fins, allowing walking on land.',
      'Lungs and, later, the amniotic egg freed vertebrates from breeding in water.',
      'Land plants and arthropods already present provided food and habitat for the newcomers.',
    ],
    wikipedia: 'Tetrapod',
    relatedTaxonId: 'amphibia',
  },
  {
    id: 'mammals',
    title: 'Mammals',
    time: '210 Mya',
    description:
      'Mammals arose from synapsid ancestors and are distinguished by hair, mammary glands that feed milk to young, and warm bloodedness. They lived alongside the dinosaurs as mostly small animals before radiating widely after the end Cretaceous extinction.',
    implications: [
      'Endothermy and insulating hair allowed activity in cold and at night.',
      'Parental care and milk improved offspring survival.',
      'After the dinosaur extinction 66 million years ago mammals diversified into most large land roles.',
    ],
    wikipedia: 'Mammal',
    relatedTaxonId: 'mammalia',
  },
  {
    id: 'primates',
    title: 'Primates',
    time: '65 Mya',
    description:
      'Primates are mammals adapted to life in trees, with grasping hands and feet, nails instead of claws, and forward facing eyes giving stereoscopic vision. Their large brains relative to body size support dexterous manipulation and complex social life.',
    implications: [
      'Grasping hands and binocular vision suited an arboreal, reaching way of life.',
      'Enlarged brains and prolonged development supported learning and social bonds.',
      'This order contains the lineage leading to apes and humans.',
    ],
    wikipedia: 'Primate',
    relatedTaxonId: 'primates',
  },
  {
    id: 'hominins',
    title: 'Hominins',
    time: '7 Mya',
    description:
      'After the split from the chimpanzee lineage, hominins evolved habitual upright walking on two legs. Bipedalism freed the hands, reshaped the pelvis and spine, and was followed over millions of years by tool use and steadily larger brains.',
    implications: [
      'Walking upright freed the hands for carrying and tool making.',
      'Stone tools from about 3.3 million years ago mark a turn toward technology.',
      'Brain size increased markedly across successive hominin species.',
    ],
    wikipedia: 'Hominini',
    relatedTaxonId: 'homo',
  },
  {
    id: 'homo_sapiens',
    title: 'Homo sapiens',
    time: '300 kya',
    description:
      'Anatomically modern humans appear in the African fossil record around 300,000 years ago. They combined a large brain with full language, symbolic thought, and cumulative culture, and later spread across every continent.',
    implications: [
      'Language and shared culture let knowledge accumulate across generations.',
      'Symbolic art, trade, and cooperation supported large social networks.',
      'Modern humans became the only surviving hominin species.',
    ],
    wikipedia: 'Homo sapiens',
    relatedTaxonId: 'homo_sapiens',
  },
  {
    id: 'agriculture',
    title: 'Agriculture and civilization',
    time: '12 kya',
    description:
      'After the last ice age, several human populations independently began to farm crops and herd animals. Reliable food surpluses allowed permanent settlements, dense populations, specialised labour, writing, and the first cities and states.',
    implications: [
      'Food surpluses freed people from full time foraging and supported specialists.',
      'Permanent settlements grew into towns, cities, and organised states.',
      'Domestication reshaped many plant and animal species and the landscapes around them.',
    ],
    wikipedia: 'Neolithic Revolution',
    relatedTaxonId: 'homo_sapiens',
  },
];

/**
 * The two endosymbiosis events, surfaced as a typed subset so the UI can give
 * them special emphasis. Derived from EVOLUTION_EPOCHS so the copy stays in one
 * place.
 */
export const ENDOSYMBIOSIS_EVENTS: EvolutionEpoch[] = EVOLUTION_EPOCHS.filter(
  (e) => e.endosymbiosis === true,
);
