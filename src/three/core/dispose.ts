import * as THREE from 'three';

/**
 * Recursively dispose of every geometry, material, and texture under an object,
 * then detach it from its parent. Three.js does not free GPU resources on its
 * own, so layers call this on teardown to avoid leaks.
 */
export function disposeObject(object: THREE.Object3D): void {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh | THREE.LineSegments | THREE.Points;
    const geometry = (mesh as THREE.Mesh).geometry;
    if (geometry) geometry.dispose();

    const material = (mesh as THREE.Mesh).material;
    if (Array.isArray(material)) {
      material.forEach(disposeMaterial);
    } else if (material) {
      disposeMaterial(material);
    }
  });
  object.parent?.remove(object);
}

function disposeMaterial(material: THREE.Material): void {
  const record = material as unknown as Record<string, unknown>;
  for (const value of Object.values(record)) {
    if (value instanceof THREE.Texture) {
      value.dispose();
    }
  }
  material.dispose();
}
