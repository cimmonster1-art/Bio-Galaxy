import * as THREE from 'three';

/**
 * Shared loaders for the bundled, open-licensed anatomy detail maps living in
 * public/textures/anatomy. These are real photographic grayscale-ish surfaces
 * used as bumpMap / roughnessMap data on the living organelle and tissue
 * materials, layered on top of (or instead of) the canvas procedural noise.
 *
 * The textures are loaded once and shared across every material that wants them,
 * so the GPU only ever holds a single copy. Because they are consumed as
 * non-color data (height / roughness, not albedo) their colorSpace is forced to
 * NoColorSpace. Call disposeDetailTextures() on teardown to free the shared
 * instances. Loading is asynchronous and failures are swallowed so a missing
 * asset never breaks the scene, matching loadTexture.ts.
 */

const TISSUE_GRAIN_URL = '/textures/anatomy/tissue_grain.jpg';
const MUSCLE_FIBRE_URL = '/textures/anatomy/muscle_fibre.jpg';

let loader: THREE.TextureLoader | null = null;
let tissueGrain: THREE.Texture | null = null;
let muscleFibre: THREE.Texture | null = null;

function load(url: string, repeat: number): THREE.Texture {
  if (!loader) loader = new THREE.TextureLoader();
  const texture = loader.load(
    url,
    undefined,
    undefined,
    () => {
      // Leave the material with no detail map; base shading still renders.
    },
  );
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.anisotropy = 8;
  // Bump and roughness data is linear, not color, so keep it out of sRGB.
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

/**
 * Shared fine tissue grain map. Reads as a mottled, pored cellular surface and
 * suits membranes, nuclei, and vesicle skins.
 */
export function getTissueGrain(repeat = 3): THREE.Texture {
  if (!tissueGrain) tissueGrain = load(TISSUE_GRAIN_URL, repeat);
  return tissueGrain;
}

/**
 * Shared muscle fibre map. Its directional striations suit ribbed structures
 * like mitochondrial cristae, ER tubules, and the Golgi stack.
 */
export function getMuscleFibre(repeat = 3): THREE.Texture {
  if (!muscleFibre) muscleFibre = load(MUSCLE_FIBRE_URL, repeat);
  return muscleFibre;
}

/**
 * Clone a shared detail texture so a consumer can set its own repeat without
 * disturbing other users. The clone reuses the source image, so no extra GPU
 * upload happens. The clone is owned by the caller and is freed with its
 * material by core/dispose, like any other texture.
 */
export function cloneDetailTexture(source: THREE.Texture, repeat: number): THREE.Texture {
  const clone = source.clone();
  clone.wrapS = clone.wrapT = THREE.RepeatWrapping;
  clone.repeat.set(repeat, repeat);
  clone.colorSpace = THREE.NoColorSpace;
  clone.anisotropy = 8;
  clone.needsUpdate = true;
  return clone;
}

/** Free the shared detail textures. Safe to call when none were loaded. */
export function disposeDetailTextures(): void {
  tissueGrain?.dispose();
  muscleFibre?.dispose();
  tissueGrain = null;
  muscleFibre = null;
}
