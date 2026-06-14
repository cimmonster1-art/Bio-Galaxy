import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Best-effort loader for real open-source GLB models used to give the living
 * scales genuine species identity. Loading is non-blocking and always resolves:
 * on any network/parse failure it yields null so the caller can fall back to a
 * procedural stand-in. Mirrors the proven approach used for the HuBMAP organs.
 */
const loader = new GLTFLoader();

/** Open-source, permissively licensed wildlife models committed on GitHub and
 *  served with CORS from raw.githubusercontent.com. */
export const WILDLIFE_MODELS = {
  // PixelMannen (CC0) + rig by tomkranis (CC-BY 4.0), via KhronosGroup samples.
  wolf: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Fox/glTF-Binary/Fox.glb',
  // mirada / three.js examples (CC-BY).
  deer: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/Horse.glb',
  bird: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/Parrot.glb',
  stork: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/Stork.glb',
} as const;

export const WILDLIFE_CREDIT =
  'Animal models: three.js examples (CC-BY) and KhronosGroup glTF Sample Assets (CC0/CC-BY).';

/** Load a GLB, resolving null on any failure so callers can fall back. */
export function loadGlb(url: string): Promise<THREE.Group | null> {
  return new Promise((resolve) => {
    try {
      loader.load(url, (g) => resolve(g.scene), undefined, () => resolve(null));
    } catch {
      resolve(null);
    }
  });
}

/**
 * Normalize a loaded model to a target height, recentered on its footprint with
 * feet at y=0, and enable shadows on every mesh.
 */
export function fitModel(root: THREE.Object3D, targetHeight: number): void {
  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  box.getSize(size);
  const s = size.y > 0 ? targetHeight / size.y : 1;
  root.scale.setScalar(s);
  const fitted = new THREE.Box3().setFromObject(root);
  const center = new THREE.Vector3();
  fitted.getCenter(center);
  root.position.x -= center.x;
  root.position.z -= center.z;
  root.position.y -= fitted.min.y;
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
}
