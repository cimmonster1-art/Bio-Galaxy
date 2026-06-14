import { Scale } from '../types';

export interface HistoryChapter {
  id: string;
  label: string;
  ageGya: number;
  time: string;
  scale: Scale;
  detail: string;
  color: string;
}

/** Approximate milestones used by the interactive history playback. */
export const HISTORY_CHAPTERS: HistoryChapter[] = [
  { id: 'origin', label: 'Big Bang', ageGya: 13.8, time: '13.8 billion years ago', scale: Scale.Cosmos, detail: 'Space, time, and energy begin in an unimaginably hot, dense state and expand. In the first fraction of a second, inflation stretches the cosmos and seeds every later structure.', color: '#7868ff' },
  { id: 'recombination', label: 'First light', ageGya: 13.8, time: '380,000 years after the Big Bang', scale: Scale.Cosmos, detail: 'The universe cools enough for electrons and nuclei to form neutral atoms. Light decouples from matter and streams free, leaving the cosmic microwave background we still detect today.', color: '#9a86ff' },
  { id: 'galaxies', label: 'First galaxies', ageGya: 13.4, time: 'about 13.4 billion years ago', scale: Scale.Galaxy, detail: 'Gravity draws primordial gas into the first stars, whose fusion forges the earliest heavy elements. These stars gather into the growing galaxies that thread the cosmic web.', color: '#b178ff' },
  { id: 'sun', label: 'Solar system', ageGya: 4.6, time: '4.6 billion years ago', scale: Scale.SolarSystem, detail: 'The Sun and planets form from a rotating cloud of gas and dust.', color: '#ffb44a' },
  { id: 'earth', label: 'Young Earth', ageGya: 4.54, time: '4.54 billion years ago', scale: Scale.Planet, detail: 'Earth differentiates into layers as its surface and atmosphere change.', color: '#55a9ff' },
  { id: 'life', label: 'Early life', ageGya: 3.8, time: 'about 3.8 billion years ago', scale: Scale.Cell, detail: 'Evidence indicates that cellular life was established early in Earth history.', color: '#3bd6b2' },
  { id: 'oxygen', label: 'Oxygenation', ageGya: 2.4, time: 'about 2.4 billion years ago', scale: Scale.Cell, detail: 'Photosynthetic activity contributes to a major rise in atmospheric oxygen.', color: '#42c8ed' },
  { id: 'eukaryotes', label: 'Complex cells', ageGya: 1.8, time: 'about 1.8 billion years ago', scale: Scale.Cell, detail: 'Eukaryotic cells combine internal compartments with larger genomes.', color: '#69dd8f' },
  { id: 'multicellular', label: 'Multicellular life', ageGya: 0.8, time: 'about 800 million years ago', scale: Scale.Organism, detail: 'Independent multicellular lineages expand in oceans and on land.', color: '#8dda65' },
  { id: 'cambrian', label: 'Cambrian diversification', ageGya: 0.539, time: '539 million years ago', scale: Scale.Ecosystem, detail: 'Over a few tens of millions of years, most major animal body plans appear in the fossil record, from arthropods to the first chordates.', color: '#d5d95b' },
  { id: 'land', label: 'Life on land', ageGya: 0.47, time: 'about 470 million years ago', scale: Scale.Biome, detail: 'Plants, fungi, and arthropods colonize the continents, and forests and soils begin to reshape the atmosphere and the carbon cycle.', color: '#e2af55' },
  { id: 'dinosaurs', label: 'Age of dinosaurs', ageGya: 0.23, time: 'about 230 million years ago', scale: Scale.Biome, detail: 'Dinosaurs rise to dominate terrestrial ecosystems through the Mesozoic, alongside the first mammals and flowering plants.', color: '#bcae5a' },
  { id: 'mammals', label: 'Mammal radiation', ageGya: 0.066, time: '66 million years ago', scale: Scale.Organism, detail: 'After an asteroid impact ends the non-avian dinosaurs, surviving mammal lineages rapidly diversify into the niches left open.', color: '#ec845c' },
  { id: 'humans', label: 'Homo sapiens', ageGya: 0.0003, time: 'about 300,000 years ago', scale: Scale.Organism, detail: 'Homo sapiens appears within a much older and branching hominin lineage.', color: '#f3d5a0' },
  { id: 'present', label: 'Living world', ageGya: 0, time: 'Present', scale: Scale.Organism, detail: 'Every living organism carries a history connected through common ancestry.', color: '#e8fbff' },
];
