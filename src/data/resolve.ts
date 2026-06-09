import { BioObject, Scale } from '../types';
import { BIO_OBJECTS } from './registry';
import { TAXON_GROUPS } from './organisms';

// Resolves a pick id coming from any scene layer into a full BioObject. Taxa
// and representative organisms are synthesized from the organism field data so
// the registry stays focused on subcellular records.

const taxonObjects: Record<string, BioObject> = {};
for (const group of TAXON_GROUPS) {
  taxonObjects[`taxon:${group.id}`] = {
    id: `taxon:${group.id}`,
    name: group.name,
    scale: Scale.Taxonomy,
    kind: 'taxon',
    summary: `${group.domain} lineage with roughly ${group.describedSpecies.toLocaleString()} described species.`,
    size: `${group.representatives.length} representative species shown`,
    facts: group.representatives.map((r) => `Representative: ${r}`),
    source: 'ncbi',
    crossRefs: ['ensembl'],
  };
  group.representatives.forEach((species, i) => {
    const id = `organism:${group.id}:${i}`;
    taxonObjects[id] = {
      id,
      name: species,
      scale: Scale.Organism,
      kind: 'organism',
      summary: `A representative organism within ${group.name}.`,
      size: 'organism scale',
      facts: [
        `Domain: ${group.domain}`,
        `Group: ${group.name}`,
        'Gene and expression data available through Ensembl and the Human Protein Atlas.',
      ],
      source: 'ensembl',
      crossRefs: ['hpa', 'ncbi'],
    };
  });
}

export function resolveObject(id: string): BioObject | undefined {
  return BIO_OBJECTS[id] ?? taxonObjects[id];
}
