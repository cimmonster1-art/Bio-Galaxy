import { BioObject, RANK_SCALE, Scale, TaxonRank } from '../types';
import { BIO_OBJECTS } from './registry';
import { ANATOMY_OBJECTS } from './anatomy';
import { ecologyObjects } from './ecology';
import { SCIENCE_OBJECTS } from './science';
import { STAR_OBJECTS } from './stars';
import { TaxonNode, allTaxa, lineageOf } from './taxonomy';

// Resolves a pick id coming from any scene layer into a full BioObject.
//
//   taxon:<id>      a node in the Tree of Life (clade or species)
//   organism:<id>   an organism-scale body derived from a species node
//   system:<id>     an organ system
//   organ:<id>      an organ
//   <registry id>   a curated subcellular record (organelle, complex, ...)

const RANK_LABEL: Record<TaxonRank, string> = {
  domain: 'Domain',
  kingdom: 'Kingdom',
  phylum: 'Phylum',
  class: 'Class',
  order: 'Order',
  family: 'Family',
  genus: 'Genus',
  species: 'Species',
};

const taxonObjects: Record<string, BioObject> = {};
for (const node of allTaxa()) {
  taxonObjects[`taxon:${node.id}`] = taxonToObject(node);
  if (node.rank === 'species') {
    taxonObjects[`organism:${node.id}`] = speciesToOrganism(node);
  }
}

function taxonToObject(node: TaxonNode): BioObject {
  const lineage = lineageOf(node.id);
  const path = lineage.map((n) => n.name).join(' › ');
  return {
    id: `taxon:${node.id}`,
    name: node.name,
    scale: RANK_SCALE[node.rank],
    kind: node.rank === 'species' ? 'taxon' : 'clade',
    rank: node.rank,
    ncbiTaxId: node.ncbiTaxId,
    summary:
      node.rank === 'species'
        ? `${node.name}${node.common ? ` (${node.common})` : ''}, a species in the Tree of Life.`
        : `${RANK_LABEL[node.rank]} ${node.name}${node.common ? ` (${node.common})` : ''}.`,
    size: `${RANK_LABEL[node.rank]} · lineage depth ${lineage.length}`,
    facts: [
      `Lineage: ${path}`,
      node.common ? `Common name: ${node.common}` : `Rank: ${RANK_LABEL[node.rank]}`,
      node.ncbiTaxId
        ? `NCBI Taxonomy id: ${node.ncbiTaxId}`
        : 'Taxonomy linked through NCBI.',
    ],
    source: 'ncbi',
    crossRefs: node.rank === 'species' ? ['ensembl', 'hpa'] : ['ensembl'],
  };
}

function speciesToOrganism(node: TaxonNode): BioObject {
  return {
    id: `organism:${node.id}`,
    name: node.name,
    scale: Scale.Organism,
    kind: 'organism',
    rank: 'species',
    ncbiTaxId: node.ncbiTaxId,
    summary: `An individual ${node.common ?? node.name} and its anatomical body plan.`,
    size: 'organism scale',
    facts: [
      `Species: ${node.name}`,
      'Anatomy rendered from open 3D models where licensing allows.',
      'Gene and expression context via Ensembl and the Human Protein Atlas.',
    ],
    source: 'ensembl',
    crossRefs: ['hpa', 'ncbi'],
  };
}


// Cosmic bodies surfaced by the cosmos and solar-system layers. These are not
// backed by a biological database, so they carry a plain provenance note for
// the imagery rather than a database source badge.
const IMAGERY_NOTE = 'Surface imagery: NASA Visible Earth and Planet Pixel Emporium maps.';

function planet(id: string, name: string, summary: string, facts: string[], scale: Scale): BioObject {
  return {
    id: `planet:${id}`,
    name,
    scale,
    kind: id === 'sun' ? 'star' : 'planet',
    summary,
    size: name,
    facts,
    provenanceNote: IMAGERY_NOTE,
  };
}

const cosmicObjects: Record<string, BioObject> = {
  'planet:sun': planet(
    'sun',
    'Sun',
    'A G-type main-sequence star holding the solar system in orbit.',
    ['Drives the day-night cycle and climate of every planet.', 'Fuses hydrogen into helium in its core.'],
    Scale.SolarSystem,
  ),
  'planet:mercury': planet('mercury', 'Mercury', 'The smallest planet and closest to the Sun.', ['No substantial atmosphere.', 'Extreme temperature swings.'], Scale.SolarSystem),
  'planet:venus': planet('venus', 'Venus', 'A rocky planet wrapped in a thick CO2 atmosphere.', ['Hottest planetary surface in the solar system.', 'Rotates slowly and in reverse.'], Scale.SolarSystem),
  'planet:earth': planet(
    'earth',
    'Earth',
    'The one world known to carry life, seen here as a blue marble.',
    ['Liquid water oceans cover most of the surface.', 'The starting point for the Tree of Life.', 'Continents, atmosphere, and a magnetic field.'],
    Scale.Planet,
  ),
  'planet:mars': planet('mars', 'Mars', 'A cold desert planet with the largest volcano in the solar system.', ['Thin CO2 atmosphere.', 'Evidence of ancient liquid water.'], Scale.SolarSystem),
  'planet:jupiter': planet('jupiter', 'Jupiter', 'The largest planet, a gas giant with dozens of moons.', ['Banded clouds and a centuries-old storm.', 'Four large Galilean moons.'], Scale.SolarSystem),
  'planet:saturn': planet('saturn', 'Saturn', 'A gas giant famous for its bright ring system.', ['Rings of ice and rock.', 'Titan has a thick atmosphere.'], Scale.SolarSystem),
  'planet:uranus': planet('uranus', 'Uranus', 'An ice giant tilted almost onto its side.', ['Rotates nearly on its orbital plane.', 'Cold methane-rich atmosphere.'], Scale.SolarSystem),
  'planet:neptune': planet('neptune', 'Neptune', 'The outermost planet, a deep blue ice giant.', ['Strongest winds in the solar system.', 'Triton orbits in reverse.'], Scale.SolarSystem),
};


// Living-world records for the physical spine between Earth and the organism:
// the biome environments and the ecosystem network nodes. These are procedural
// scenes rather than database entries, so they carry a plain provenance note.
const BIOME_NOTE = 'Procedural biome environment rendered from CC0-style primitives and shaders.';
const ECO_NOTE = 'Schematic ecological network illustrating relationships between organisms.';

function biome(id: string, name: string, summary: string, facts: string[]): BioObject {
  return { id: `biome:${id}`, name, scale: Scale.Biome, kind: 'biome', summary, size: 'biome scale (~10–100 km)', facts, provenanceNote: BIOME_NOTE };
}

const biomeObjects: Record<string, BioObject> = {
  'biome:rainforest': biome('rainforest', 'Tropical Rainforest', 'A warm, wet, layered forest holding the greatest terrestrial biodiversity on Earth.', ['Dense canopy, understory, and forest floor strata.', 'Drives a large share of terrestrial photosynthesis.']),
  'biome:reef': biome('reef', 'Coral Reef', 'A shallow marine biome built by colonial corals, often called the rainforest of the sea.', ['Coral animals host photosynthetic algae.', 'Supports roughly a quarter of marine species.']),
  'biome:tundra': biome('tundra', 'Arctic Tundra', 'A cold, treeless biome where low temperatures and permafrost shape life.', ['Short growing season with low shrubs and lichens.', 'Carbon-rich permafrost soils.']),
  'biome:savanna': biome('savanna', 'Savanna', 'A grassland with scattered trees, shaped by seasonal rains and fire.', ['Grazing herds and their predators.', 'Maintained by drought and periodic fire.']),
  'biome:temperate': biome('temperate', 'Temperate Forest', 'A seasonal forest of broadleaf and conifer trees in mid-latitudes.', ['Marked spring, summer, autumn, and winter cycles.', 'Deep leaf-litter soils.']),
  'biome:desert': biome('desert', 'Desert', 'An arid biome where scarce water selects for extreme adaptation.', ['Wide day-to-night temperature swings.', 'Specialized water-storing and nocturnal life.']),
};

const ECO_STRUCTURES: { id: string; name: string; summary: string }[] = [
  { id: 'sun', name: 'Solar energy', summary: 'The energy input driving primary production across the ecosystem.' },
  { id: 'canopy', name: 'Canopy producers', summary: 'Photosynthetic trees forming the productive base of the food web.' },
  { id: 'flowering', name: 'Flowering plants', summary: 'Producers that exchange nectar for pollination services.' },
  { id: 'grass', name: 'Ground-cover producers', summary: 'Grasses and low plants grazed by herbivores at the base of the chain.' },
  { id: 'fungus', name: 'Fungal decomposers', summary: 'Fungi breaking down dead matter and returning nutrients to the soil.' },
  { id: 'bacteria', name: 'Bacterial decomposers', summary: 'Microbes mineralizing organic matter back into soil nutrients.' },
  { id: 'decomposer', name: 'Decomposers', summary: 'Fungi and microbes returning nutrients from dead matter to the soil.' },
  { id: 'soil', name: 'Soil & nutrients', summary: 'The nutrient reservoir cycling matter back into living producers.' },
];
const ECO_ORGANISMS: { id: string; name: string; summary: string }[] = [
  { id: 'pollinator', name: 'Pollinator', summary: 'An animal that carries pollen between flowers as it feeds.' },
  { id: 'herbivore', name: 'Herbivore', summary: 'A primary consumer feeding on producers.' },
  { id: 'predator', name: 'Predator', summary: 'A consumer that hunts other animals, regulating the network.' },
  { id: 'migratory', name: 'Migratory animal', summary: 'A consumer that moves between habitats along migration routes.' },
];

const ecosystemObjects: Record<string, BioObject> = {};
for (const s of ECO_STRUCTURES) {
  ecosystemObjects[`ecosystem:${s.id}`] = { id: `ecosystem:${s.id}`, name: s.name, scale: Scale.Ecosystem, kind: 'ecosystem', summary: s.summary, size: 'ecosystem component', facts: ['Part of a functioning ecological network.', 'Connected by energy, nutrient, and pollination flows.'], provenanceNote: ECO_NOTE };
}
for (const o of ECO_ORGANISMS) {
  ecosystemObjects[`organism:${o.id}`] = { id: `organism:${o.id}`, name: o.name, scale: Scale.Organism, kind: 'organism', summary: o.summary, size: 'organism scale', facts: ['Selecting it descends to the organism scale.', 'A node in the ecosystem interaction network.'], provenanceNote: ECO_NOTE };
}

// Cosmic structures clickable at the largest scales.
const cosmicStructures: Record<string, BioObject> = {
  cosmos: { id: 'cosmos', name: 'Observable Universe', scale: Scale.Cosmos, kind: 'cosmos', summary: 'The cosmic web of galaxy filaments, clusters, and voids spanning the observable universe.', size: '~93 billion light-years across', facts: ['Matter is organized into filaments and clusters separated by vast voids.', 'Structure traces the underlying dark-matter scaffold.'], provenanceNote: 'Procedural large-scale-structure visualization.' },
  galaxy: { id: 'galaxy', name: 'Spiral Galaxy', scale: Scale.Galaxy, kind: 'galaxy', summary: 'A spiral galaxy of hundreds of billions of stars with a bright core and winding arms.', size: '~100,000 light-years across', facts: ['A dense bulge surrounds the central core.', 'Spiral arms are sites of active star formation.'], provenanceNote: 'Procedural galaxy visualization.' },
};

// A representative atom (carbon), clickable at the deepest scale. Its live
// periodic-table data is pulled from PubChem.
const atomObjects: Record<string, BioObject> = {
  atom_carbon: { id: 'atom_carbon', name: 'Carbon atom', scale: Scale.Atom, kind: 'atom', summary: 'A dense nucleus of protons and neutrons surrounded by orbiting electrons — carbon, the scaffold of organic life.', size: '~140 pm (covalent radius)', facts: ['Nearly all the mass sits in the tiny nucleus.', 'Electrons occupy quantized orbital shells.', 'Four valence electrons let carbon form the backbone of every biomolecule.'], element: 'C', source: 'pubchem', provenanceNote: 'Schematic atomic model; element data from PubChem.' },
};

// Tissue: one immersive specimen (skeletal muscle) and its substructures.
function tissue(id: string, name: string, summary: string, facts: string[]): BioObject {
  return { id: `tissue:${id}`, name, scale: Scale.Tissue, kind: 'tissue', summary, size: 'tissue scale (~0.1–1 mm)', facts, source: 'hpa', crossRefs: ['ensembl', 'uniprot'] };
}
const tissueObjects: Record<string, BioObject> = {
  'tissue:muscle': tissue('muscle', 'Skeletal muscle fibre', 'A giant multinucleate fibre packed with striated myofibrils that contract.', ['Striations are repeating actin–myosin sarcomeres.', 'Fibres bundle into fascicles wrapped in connective tissue.']),
  'tissue:capillary': tissue('capillary', 'Capillary', 'A microvessel threading between fibres, delivering oxygen and nutrients.', ['Walls are a single endothelial cell thick.', 'Site of gas and nutrient exchange with tissue.']),
  'tissue:motor_neuron': tissue('motor_neuron', 'Motor neuron', 'A neuron whose axon reaches the muscle at the neuromuscular junction.', ['Releases acetylcholine to trigger contraction.', 'One motor neuron drives many fibres as a motor unit.']),
  'tissue:ecm': tissue('ecm', 'Extracellular matrix', 'The collagen-rich scaffold of connective tissue surrounding the fibres.', ['Mostly collagen and elastin fibres.', 'Transmits force and holds the tissue together.']),
};

// Molecule-scale chemistry of life. Where a record maps cleanly to a single
// PubChem compound it carries a real CID so the detail panel resolves live
// chemical identity; polymers (DNA, the bilayer) stay procedurally provenanced.
function molecule(id: string, name: string, summary: string, facts: string[], extra: Partial<BioObject> = {}): BioObject {
  return { id, name, scale: Scale.Molecule, kind: 'molecule', summary, size: 'molecular scale (~1–10 nm)', facts, provenanceNote: 'Schematic molecular model rendered procedurally.', ...extra };
}
const moleculeObjects: Record<string, BioObject> = {
  dna_helix: molecule('dna_helix', 'DNA double helix', 'Two sugar-phosphate strands wound around base pairs that store the genome.', ['Base pairs: A–T and G–C.', 'Antiparallel strands twist into a right-handed helix.'], { crossRefs: ['ncbi', 'ensembl'] }),
  lipid_membrane: molecule('lipid_membrane', 'Lipid bilayer', 'A double sheet of phospholipids forming every cellular membrane.', ['Hydrophilic heads face water; hydrophobic tails face inward.', 'Self-assembles and is selectively permeable.']),
  water_cluster: molecule('water_cluster', 'Water cluster', 'A handful of hydrogen-bonded water molecules, the solvent of life.', ['Bent H–O–H geometry near 104.5°.', 'Hydrogen bonding gives water its unusual properties.'], { pubchemCid: 962, source: 'pubchem', provenanceNote: 'Schematic model; chemical identity from PubChem (CID 962).' }),
};

export function resolveObject(id: string): BioObject | undefined {
  const tissueMatch = /^tissue:cell:(\d+)$/.exec(id);
  if (tissueMatch) return tissueCellObject(Number(tissueMatch[1]));
  return BIO_OBJECTS[id] ?? taxonObjects[id] ?? ANATOMY_OBJECTS[id] ?? SCIENCE_OBJECTS[id] ?? cosmicObjects[id] ?? cosmicStructures[id] ?? STAR_OBJECTS[id] ?? atomObjects[id] ?? biomeObjects[id] ?? ecosystemObjects[id] ?? ecologyObjects[id] ?? tissueObjects[id] ?? moleculeObjects[id];
}

/** Complete locally indexed corpus used by search and the read-only copilot. */
export function allResolvedObjects(): BioObject[] {
  return [
    ...Object.values(BIO_OBJECTS),
    ...Object.values(taxonObjects),
    ...Object.values(ANATOMY_OBJECTS),
    ...Object.values(SCIENCE_OBJECTS),
    ...Object.values(cosmicObjects),
    ...Object.values(cosmicStructures),
    ...Object.values(STAR_OBJECTS),
    ...Object.values(atomObjects),
    ...Object.values(biomeObjects),
    ...Object.values(ecosystemObjects),
    ...Object.values(ecologyObjects),
    ...Object.values(tissueObjects),
    ...Object.values(moleculeObjects),
  ];
}

function tissueCellObject(index: number): BioObject {
  return {
    id: `tissue:cell:${index}`,
    name: `Tissue cell ${index + 1}`,
    scale: Scale.Tissue,
    kind: 'cell',
    summary: 'One individually raycastable cell within the rendered tissue field.',
    size: 'approximately 10 to 30 µm in this generalized tissue model',
    facts: [
      'A plasma membrane separates the cell from its local extracellular environment.',
      'The darker inner body represents the nucleus and its genomic compartment.',
      'Neighboring cells collectively create tissue-scale structure and function.',
    ],
    source: 'hpa',
    crossRefs: ['ensembl', 'uniprot', 'reactome', 'ncbi'],
  };
}
