import * as THREE from 'three';
import { Scale } from '../../types';

/**
 * Contract every scene layer implements. The orchestrator owns the renderer
 * and camera; layers own their own subgraph, animation, and cleanup.
 */
export interface SceneLayer {
  /** Root group added to the scene graph. */
  readonly root: THREE.Group;

  /** Scales at which this layer should be visible. */
  readonly activeScales: Scale[];

  /** Per-frame update. dt is seconds since last frame, elapsed is total. */
  update(dt: number, elapsed: number): void;

  /**
   * React to a scale change. `intensity` is 0..1 visibility weight derived from
   * how close the active scale is to this layer's range, letting layers fade.
   */
  onScaleChange(scale: Scale, intensity: number): void;

  /** Objects eligible for raycast selection at the current scale. */
  getPickables(): THREE.Object3D[];

  /** Free all GPU resources and detach from the scene. */
  dispose(): void;
}

/** Smoothly move a material's opacity toward a target. */
export function fadeMaterial(
  material: THREE.Material & { opacity: number },
  target: number,
  dt: number,
  rate = 6,
): void {
  material.transparent = true;
  material.opacity += (target - material.opacity) * Math.min(1, dt * rate);
  material.visible = material.opacity > 0.01;
}
