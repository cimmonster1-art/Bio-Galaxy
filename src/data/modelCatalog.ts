import { Scale } from '../types';

/**
 * Catalog of open-source 3D organism models hosted on GitHub. Entries point at
 * a directly committed glTF binary, optionally through a GitHub CDN with
 * permissive CORS headers. Provenance and license are recorded so the UI can
 * always cite the source.
 *
 * These are organism-scale animal meshes. Loading is best-effort: if a host is
 * unreachable (or a file is moved to Git LFS), the anatomy layer falls back to
 * its procedural body and reports it, so nothing here is faked.
 */
export interface ModelEntry {
  id: string;
  label: string;
  /** Common description shown beneath the label. */
  organism: string;
  /** Optional taxon id (data/taxonomy) this model best represents. */
  taxonHint?: string;
  scale: Scale;
  format: 'glb' | 'gltf';
  url: string;
  /** Source repository, shown as provenance. */
  repo: string;
  repoUrl: string;
  /** License as stated by the source repository. */
  license: string;
  attribution: string;
  animated: boolean;
}

const THREE_EXAMPLES = 'mrdoob/three.js';
const THREE_BASE = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf';

export const MODEL_CATALOG: ModelEntry[] = [
  {
    id: 'human',
    label: 'Animated reference figure',
    organism: 'General human proportion reference',
    taxonHint: 'homo_sapiens',
    scale: Scale.Organism,
    format: 'glb',
    url: 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0/CesiumMan/glTF-Binary/CesiumMan.glb',
    repo: 'KhronosGroup/glTF-Sample-Models',
    repoUrl: 'https://github.com/KhronosGroup/glTF-Sample-Models/tree/master/2.0/CesiumMan',
    license: 'CC-BY 4.0',
    attribution: 'Cesium',
    animated: true,
  },
  {
    id: 'flamingo',
    label: 'Flamingo',
    organism: 'Wading bird (Aves)',
    taxonHint: 'aves',
    scale: Scale.Organism,
    format: 'glb',
    url: `${THREE_BASE}/Flamingo.glb`,
    repo: THREE_EXAMPLES,
    repoUrl: 'https://github.com/mrdoob/three.js/tree/master/examples/models/gltf',
    license: 'three.js examples — see repository',
    attribution: 'mirada / three.js example assets',
    animated: true,
  },
  {
    id: 'stork',
    label: 'Stork',
    organism: 'Wading bird (Aves)',
    taxonHint: 'aves',
    scale: Scale.Organism,
    format: 'glb',
    url: `${THREE_BASE}/Stork.glb`,
    repo: THREE_EXAMPLES,
    repoUrl: 'https://github.com/mrdoob/three.js/tree/master/examples/models/gltf',
    license: 'three.js examples — see repository',
    attribution: 'mirada / three.js example assets',
    animated: true,
  },
  {
    id: 'parrot',
    label: 'Parrot',
    organism: 'Perching bird (Aves)',
    taxonHint: 'aves',
    scale: Scale.Organism,
    format: 'glb',
    url: `${THREE_BASE}/Parrot.glb`,
    repo: THREE_EXAMPLES,
    repoUrl: 'https://github.com/mrdoob/three.js/tree/master/examples/models/gltf',
    license: 'three.js examples — see repository',
    attribution: 'mirada / three.js example assets',
    animated: true,
  },
  {
    id: 'horse',
    label: 'Horse',
    organism: 'Mammal (Equus)',
    taxonHint: 'mammalia',
    scale: Scale.Organism,
    format: 'glb',
    url: `${THREE_BASE}/Horse.glb`,
    repo: THREE_EXAMPLES,
    repoUrl: 'https://github.com/mrdoob/three.js/tree/master/examples/models/gltf',
    license: 'three.js examples — see repository',
    attribution: 'mirada / three.js example assets',
    animated: true,
  },
  {
    id: 'fox',
    label: 'Fox',
    organism: 'Mammal (Vulpes)',
    taxonHint: 'carnivora',
    scale: Scale.Organism,
    format: 'glb',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Fox/glTF-Binary/Fox.glb',
    repo: 'KhronosGroup/glTF-Sample-Models',
    repoUrl: 'https://github.com/KhronosGroup/glTF-Sample-Models/tree/master/2.0/Fox',
    license: 'CC0 1.0 (model) / CC-BY 4.0 (rig)',
    attribution: 'PixelMannen (model), @tomkranis (rig)',
    animated: true,
  },
];

export function modelsForScale(scale: Scale): ModelEntry[] {
  return MODEL_CATALOG.filter((m) => m.scale === scale);
}

export function modelForTaxon(taxonId: string): ModelEntry | undefined {
  return MODEL_CATALOG.find((m) => m.taxonHint === taxonId);
}
