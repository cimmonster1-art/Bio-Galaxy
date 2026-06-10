import * as THREE from 'three';
import { PickTag } from '../../types';

/**
 * Wraps raycast selection. Converts pointer events to normalized device
 * coordinates and resolves the nearest pickable to its biological pick tag by
 * walking up the parent chain. Holds no GPU resources.
 */
export class SelectionRaycaster {
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private active = false;

  constructor(private readonly domElement: HTMLElement) {}

  get pointerActive(): boolean {
    return this.active;
  }

  updatePointer(event: PointerEvent): void {
    const rect = this.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.active = true;
  }

  clear(): void {
    this.active = false;
  }

  pick(camera: THREE.Camera, objects: THREE.Object3D[]): PickTag | null {
    if (objects.length === 0) return null;
    this.raycaster.setFromCamera(this.pointer, camera);
    const hits = this.raycaster.intersectObjects(objects, true);
    for (const hit of hits) {
      const tag = findPickTag(hit.object, hit.instanceId);
      if (tag) return tag;
    }
    return null;
  }
}

/** Walk up the parent chain to find the nearest pick tag. */
export function findPickTag(object: THREE.Object3D, instanceId?: number): PickTag | null {
  let current: THREE.Object3D | null = object;
  while (current) {
    const instanceTags = current.userData?.pickInstances as PickTag[] | undefined;
    if (instanceId !== undefined && instanceTags?.[instanceId]) return instanceTags[instanceId];
    const tag = current.userData?.pick as PickTag | undefined;
    if (tag) return tag;
    current = current.parent;
  }
  return null;
}
