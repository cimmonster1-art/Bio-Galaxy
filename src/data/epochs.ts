import { Scale } from '../types';

/**
 * The grand timeline that the scrubber plays through: a single continuous arc
 * from the Big Bang to the rise of civilization. Each epoch anchors the camera
 * to a scale, carries an encyclopedic description and a list of implications,
 * and exposes a normalized deep-time position so the scrubber can ease between
 * them like a video timeline.
 *
 * Times are approximate consensus values. The `tPast` field is a log-spaced
 * position from 0 (the Big Bang) to 1 (the present) so that recent, fast-moving
 * epochs get as much of the scrubber as the slow deep past.
 */
export interface Epoch {
  id: string;
  title: string;
  /** Readable age, e.g. "13.8 Gya". */
  time: string;
  /** Years before present, used to compute the log-spaced scrubber position. */
  yearsAgo: number;
  /** Scale the camera commits to when this epoch is entered. */
  scale: Scale;
  /** One paragraph of restrained, accurate context. */
  detail: string;
  /** What this moment made possible. Shown as a bulleted card. */
  implications: string[];
  /** Wikipedia article title for the epoch's rich card image and extract. */
  wikipedia: string;
  /** Accent color for the marker and card. */
  accent: string;
  /** True for the endosymbiosis milestones so the UI can flag them. */
  endosymbiosis?: boolean;
}

// 13.8 billion years, in years, as the zero point of the deep-time axis.
const UNIVERSE_AGE = 13.8e9;

function tPast(yearsAgo: number): number {
  // Log-spaced so the last few hundred million years are not crushed against
  // the right edge. Clamped to keep the present at exactly 1.
  const a = Math.max(1, yearsAgo);
  const lo = Math.log10(1);
  const hi = Math.log10(UNIVERSE_AGE);
  return 1 - (Math.log10(a) - lo) / (hi - lo);
}

export const EPOCHS: Epoch[] = [
  {
    id: 'big_bang',
    title: 'The Big Bang',
    time: '13.8 Gya',
    yearsAgo: 13.8e9,
    scale: Scale.Cosmos,
    accent: '#ffd27a',
    wikipedia: 'Big Bang',
    detail:
      'Spacetime, energy, and the first particles burst from an unimaginably hot, dense state. As the universe expands and cools, protons and neutrons form, then the first light atomic nuclei, and 380,000 years later the cosmos becomes transparent and releases the light we still see as the cosmic microwave background.',
    implications: [
      'Sets the arrow of time and the expansion that still carries galaxies apart.',
      'Forges hydrogen and helium, the raw material for every later star.',
      'Imprints the tiny density ripples that will grow into the cosmic web.',
    ],
  },
  {
    id: 'first_galaxies',
    title: 'First Galaxies',
    time: '13.6 Gya',
    yearsAgo: 13.6e9,
    scale: Scale.Galaxy,
    accent: '#bfa8ff',
    wikipedia: 'Galaxy formation and evolution',
    detail:
      'Gravity pulls primordial gas into the first stars and galaxies. Massive early stars fuse hydrogen into heavier elements and explode as supernovae, seeding space with carbon, oxygen, and iron. A barred spiral, the Milky Way, slowly assembles from smaller structures.',
    implications: [
      'Manufactures the heavy elements that biology and rocky planets require.',
      'Builds the galactic environment that will host the Sun.',
      'Establishes star formation as the engine of cosmic chemistry.',
    ],
  },
  {
    id: 'solar_system',
    title: 'The Solar System Forms',
    time: '4.6 Gya',
    yearsAgo: 4.6e9,
    scale: Scale.SolarSystem,
    accent: '#ffb65c',
    wikipedia: 'Formation and evolution of the Solar System',
    detail:
      'A collapsing cloud of gas and dust flattens into a spinning disk. The Sun ignites at the center while the planets accrete from the remaining material, the rocky worlds close in and the gas and ice giants far out. The positions of these worlds can be wound forward and back with real ephemeris data.',
    implications: [
      'Places Earth in a temperate orbit where liquid water can persist.',
      'Sorts the planets into the architecture we still observe today.',
      'Leaves the leftover comets and asteroids that later deliver water and organics.',
    ],
  },
  {
    id: 'earth',
    title: 'Earth and the Oceans',
    time: '4.54 Gya',
    yearsAgo: 4.54e9,
    scale: Scale.Planet,
    accent: '#5aa9ff',
    wikipedia: 'History of Earth',
    detail:
      'The young Earth differentiates into core, mantle, and crust, and a giant impact forms the Moon. As the surface cools, water vapor condenses into the first oceans and a protective magnetic field switches on, shielding the surface from the solar wind.',
    implications: [
      'Creates a stable, wet, shielded surface chemistry laboratory.',
      'The Moon stabilizes Earth’s tilt and drives the tides.',
      'Sets the stage for the chemistry that becomes life.',
    ],
  },
  {
    id: 'luca',
    title: 'Origin of Life (LUCA)',
    time: '3.8 Gya',
    yearsAgo: 3.8e9,
    scale: Scale.TreeOfLife,
    accent: '#39d4e6',
    wikipedia: 'Last universal common ancestor',
    detail:
      'Self-replicating chemistry crosses the threshold into life. The last universal common ancestor, a single-celled organism with DNA, RNA, proteins, and a genetic code, sits at the root of every branch of the Tree of Life that follows.',
    implications: [
      'Establishes the shared genetic code used by all life today.',
      'Roots the entire Tree of Life in a single ancestral cell.',
      'Begins three and a half billion years of unbroken descent.',
    ],
  },
  {
    id: 'oxygen',
    title: 'Photosynthesis and Oxygen',
    time: '2.4 Gya',
    yearsAgo: 2.4e9,
    scale: Scale.Domain,
    accent: '#7fe0a6',
    wikipedia: 'Great Oxidation Event',
    detail:
      'Cyanobacteria learn to split water with sunlight, releasing oxygen as a waste product. Over hundreds of millions of years this oxygen transforms the atmosphere and oceans, driving the Great Oxidation Event and making aerobic, energy-rich metabolism possible.',
    implications: [
      'Fills the atmosphere with the oxygen that complex life will breathe.',
      'Builds the ozone layer that later allows life onto land.',
      'Powers a leap in the energy budget available to cells.',
    ],
  },
  {
    id: 'endosymbiosis_mito',
    title: 'Endosymbiosis: Mitochondria',
    time: '1.8 Gya',
    yearsAgo: 1.8e9,
    scale: Scale.Kingdom,
    accent: '#e2a13c',
    wikipedia: 'Symbiogenesis',
    endosymbiosis: true,
    detail:
      'An early host cell engulfs a free-living alpha-proteobacterium but does not digest it. The two settle into partnership: the guest becomes the mitochondrion, the cell’s power plant, and keeps its own small genome. This single merger gives eukaryotic cells the energy to grow large and complex.',
    implications: [
      'Supplies the ATP budget that makes large, complex cells viable.',
      'Explains why mitochondria carry their own DNA and double membrane.',
      'Demonstrates that cooperation, not only competition, drives major change.',
    ],
  },
  {
    id: 'eukaryotes',
    title: 'The Eukaryotic Cell',
    time: '1.6 Gya',
    yearsAgo: 1.6e9,
    scale: Scale.Kingdom,
    accent: '#3a6ea5',
    wikipedia: 'Eukaryote',
    detail:
      'With a nucleus protecting the genome and mitochondria powering the cytoplasm, the eukaryotic cell takes shape. Internal membranes organize the cell into specialized organelles, an architecture rich enough to later build tissues, organs, and bodies.',
    implications: [
      'Compartmentalizes the cell into the organelles explored at the cell scale.',
      'Protects and organizes the genome inside a nucleus.',
      'Provides the cellular toolkit for all plants, animals, and fungi.',
    ],
  },
  {
    id: 'endosymbiosis_chloro',
    title: 'Endosymbiosis: Chloroplasts',
    time: '1.5 Gya',
    yearsAgo: 1.5e9,
    scale: Scale.Kingdom,
    accent: '#7fe0a6',
    wikipedia: 'Chloroplast',
    endosymbiosis: true,
    detail:
      'In a second great merger, a eukaryotic cell takes in a photosynthetic cyanobacterium. The guest becomes the chloroplast, and its host founds the lineage of algae and plants that will green the planet and feed nearly every food web.',
    implications: [
      'Gives the plant and algal lineages the power to harvest sunlight directly.',
      'Underpins the food webs that almost all animals depend on.',
      'Shows endosymbiosis happening more than once in life’s history.',
    ],
  },
  {
    id: 'multicellularity',
    title: 'Multicellular Life',
    time: '0.8 Gya',
    yearsAgo: 0.8e9,
    scale: Scale.Phylum,
    accent: '#9ad0ff',
    wikipedia: 'Multicellular organism',
    detail:
      'Cells begin to stay together and divide labor, some sensing, some moving, some digesting. Multicellularity arises independently many times, opening the door to organisms large enough to see and built from differentiated tissues.',
    implications: [
      'Introduces tissues, the scale just above the single cell.',
      'Allows specialization of cells into distinct functional types.',
      'Sets up the body plans that the Cambrian will diversify.',
    ],
  },
  {
    id: 'cambrian',
    title: 'The Cambrian Explosion',
    time: '538 Mya',
    yearsAgo: 538e6,
    scale: Scale.Phylum,
    accent: '#ff8fb0',
    wikipedia: 'Cambrian explosion',
    detail:
      'In a geologically brief window, almost every major animal body plan appears in the fossil record. Eyes, shells, limbs, and predators emerge together, and the great animal phyla that still structure the Tree of Life are established.',
    implications: [
      'Founds the animal phyla seen in the taxonomy navigator.',
      'Begins the evolutionary arms race between predator and prey.',
      'Leaves a rich fossil record that anchors the tree of animals.',
    ],
  },
  {
    id: 'tetrapods',
    title: 'Life Moves to Land',
    time: '375 Mya',
    yearsAgo: 375e6,
    scale: Scale.Class,
    accent: '#a6d97f',
    wikipedia: 'Tetrapod',
    detail:
      'Lobe-finned fish evolve sturdy limbs and air-breathing, and the first tetrapods haul themselves onto land. Plants and arthropods have already greened the continents, and vertebrates follow into a vast new habitat.',
    implications: [
      'Opens the continents to vertebrate life.',
      'Establishes the four-limbed body plan shared by amphibians, reptiles, birds, and mammals.',
      'Drives adaptations for breathing air and supporting weight against gravity.',
    ],
  },
  {
    id: 'mammals',
    title: 'The Age of Mammals',
    time: '66 Mya',
    yearsAgo: 66e6,
    scale: Scale.Class,
    accent: '#d8b27a',
    wikipedia: 'Mammal',
    detail:
      'An asteroid impact ends the reign of the non-avian dinosaurs. In the aftermath, small warm-blooded mammals radiate into the empty niches, evolving large brains, live birth, and the parental care that characterize the class.',
    implications: [
      'Clears the way for mammals to diversify across the planet.',
      'Selects for larger brains and flexible behavior.',
      'Sets the lineage that leads toward primates and humans.',
    ],
  },
  {
    id: 'hominins',
    title: 'Primates and Hominins',
    time: '7 Mya',
    yearsAgo: 7e6,
    scale: Scale.Family,
    accent: '#e6c54a',
    wikipedia: 'Hominini',
    detail:
      'The lineage leading to humans splits from that of chimpanzees. Upright walking frees the hands, tool use spreads, and brain size climbs across a succession of hominin species spread over millions of years.',
    implications: [
      'Begins the specifically human branch of the ape family tree.',
      'Couples upright posture, free hands, and tool making.',
      'Drives the rapid expansion of the brain.',
    ],
  },
  {
    id: 'homo_sapiens',
    title: 'Homo sapiens',
    time: '300 kya',
    yearsAgo: 300000,
    scale: Scale.Species,
    accent: '#ffd9a0',
    wikipedia: 'Homo sapiens',
    detail:
      'Anatomically modern humans appear in Africa. Language, symbolic art, and cumulative culture let knowledge pass between generations faster than genes ever could, and our species spreads across every continent.',
    implications: [
      'Centers the atlas on the human organism used as the reference body.',
      'Introduces cumulative culture as a new kind of inheritance.',
      'Connects every scale below, from organ systems down to the atom.',
    ],
  },
  {
    id: 'civilization',
    title: 'Agriculture and Civilization',
    time: '12 kya',
    yearsAgo: 12000,
    scale: Scale.Organism,
    accent: '#ff9f6b',
    wikipedia: 'Neolithic Revolution',
    detail:
      'Humans begin to farm, settle, and build cities. Writing, mathematics, and eventually science let people read the universe back to its beginning, the very journey this timeline retraces from a single body outward to the edge of deep space.',
    implications: [
      'Turns scattered bands into dense, interdependent societies.',
      'Builds the institutions that produce the databases behind this atlas.',
      'Makes a species able to reconstruct its own 13.8 billion year history.',
    ],
  },
];

// Precompute the normalized scrubber position for each epoch.
export const EPOCH_POSITIONS: number[] = EPOCHS.map((e) => tPast(e.yearsAgo));

/** The epoch nearest a normalized 0..1 scrubber position. */
export function epochAtPosition(pos: number): Epoch {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < EPOCH_POSITIONS.length; i++) {
    const d = Math.abs(EPOCH_POSITIONS[i] - pos);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return EPOCHS[best];
}

/** The deep-time position (0..1) for a given epoch id. */
export function positionOfEpoch(id: string): number {
  const i = EPOCHS.findIndex((e) => e.id === id);
  return i >= 0 ? EPOCH_POSITIONS[i] : 0;
}
