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
  { id: 'origin', label: 'Cosmic origin', ageGya: 14, time: '14.0 billion years ago', scale: Scale.Cosmos, detail: 'The observable universe begins hot and dense, then expands and cools.', color: '#7868ff' },
  { id: 'galaxies', label: 'First galaxies', ageGya: 13.4, time: '13.4 billion years ago', scale: Scale.Galaxy, detail: 'Gravity gathers early stars and gas into growing galaxies.', color: '#b178ff' },
  { id: 'sun', label: 'Solar system', ageGya: 4.6, time: '4.6 billion years ago', scale: Scale.SolarSystem, detail: 'The Sun and planets form from a rotating cloud of gas and dust.', color: '#ffb44a' },
  { id: 'earth', label: 'Young Earth', ageGya: 4.54, time: '4.54 billion years ago', scale: Scale.Planet, detail: 'Earth differentiates into layers as its surface and atmosphere change.', color: '#55a9ff' },
  { id: 'life', label: 'Early life', ageGya: 3.8, time: 'about 3.8 billion years ago', scale: Scale.TreeOfLife, detail: 'Evidence indicates that cellular life was established early in Earth history.', color: '#3bd6b2' },
  { id: 'oxygen', label: 'Oxygenation', ageGya: 2.4, time: 'about 2.4 billion years ago', scale: Scale.Domain, detail: 'Photosynthetic activity contributes to a major rise in atmospheric oxygen.', color: '#42c8ed' },
  { id: 'eukaryotes', label: 'Complex cells', ageGya: 1.8, time: 'about 1.8 billion years ago', scale: Scale.Kingdom, detail: 'Eukaryotic cells combine internal compartments with larger genomes.', color: '#69dd8f' },
  { id: 'multicellular', label: 'Multicellular life', ageGya: 0.8, time: 'about 800 million years ago', scale: Scale.Phylum, detail: 'Independent multicellular lineages expand in oceans and on land.', color: '#8dda65' },
  { id: 'cambrian', label: 'Cambrian diversification', ageGya: 0.539, time: '539 million years ago', scale: Scale.Class, detail: 'Many animal body plans become visible in the fossil record.', color: '#d5d95b' },
  { id: 'land', label: 'Life on land', ageGya: 0.47, time: 'about 470 million years ago', scale: Scale.Order, detail: 'Plants, fungi, and animals establish increasingly complex land ecosystems.', color: '#e2af55' },
  { id: 'mammals', label: 'Mammal radiation', ageGya: 0.066, time: '66 million years ago', scale: Scale.Family, detail: 'Mammal lineages diversify after the end-Cretaceous extinction.', color: '#ec845c' },
  { id: 'humans', label: 'Homo sapiens', ageGya: 0.0003, time: 'about 300,000 years ago', scale: Scale.Species, detail: 'Homo sapiens appears within a much older and branching hominin lineage.', color: '#f3d5a0' },
  { id: 'present', label: 'Living world', ageGya: 0, time: 'Present', scale: Scale.Organism, detail: 'Every living organism carries a history connected through common ancestry.', color: '#e8fbff' },
];
