import { BioObject, RANK_SCALE, Scale, TaxonRank } from '../types';
import { BIO_OBJECTS } from './registry';
import { ANATOMY_OBJECTS } from './anatomy';
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


export function resolveObject(id: string): BioObject | undefined {
  return BIO_OBJECTS[id] ?? taxonObjects[id] ?? ANATOMY_OBJECTS[id] ?? cosmicObjects[id];
}
