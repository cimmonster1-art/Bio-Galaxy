import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Small permissively licensed GLB catalogue for the ecology layer. The key is
 * the actual model identity; we never relabel a horse as a deer or a fox as a
 * wolf. When Bio Galaxy does not have an exact open asset for a species, that
 * biome simply renders without a token animal.
 */
const loader = new GLTFLoader();

export const WILDLIFE_MODELS = {
  // KhronosGroup glTF Sample Assets. Fox model: CC0 geometry with CC-BY rigging.
  fox: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Fox/glTF-Binary/Fox.glb',
  // three.js example assets, distributed with the project under its examples licensing.
  horse: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/Horse.glb',
  parrot: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/Parrot.glb',
  stork: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/Stork.glb',
  // KhronosGroup sample asset: the model is actually a barramundi fish.
  barramundi: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/BarramundiFish/glTF-Binary/BarramundiFish.glb',
} as const;

export const WILDLIFE_CREDIT =
  'Fauna assets: KhronosGroup glTF Sample Assets and three.js example models; exact model identity is preserved in Bio Galaxy.';

/**
 * Load a GLB, resolving null on any failure. If the asset contains animation,
 * play its first clip and attach the mixer to the scene so a living layer can
 * advance it without changing the simple Group return type used elsewhere.
 */
export function loadGlb(url: string): Promise<THREE.Group | null> {
  return new Promise((resolve) => {
    try {
      loader.load(url, (gltf) => {
        const scene = gltf.scene;
        if (gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(scene);
          mixer.clipAction(gltf.animations[0]).play();
          scene.userData.animationMixer = mixer;
        }
        resolve(scene);
      }, undefined, () => resolve(null));
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
  root.traverse((object) => {
    if ((object as THREE.Mesh).isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
}
