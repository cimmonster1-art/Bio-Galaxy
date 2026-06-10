import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Scale } from '../../types';
import { ScaleNavigator } from '../ScaleNavigator';

export interface CameraUpdate {
  /** True while the camera is still easing toward the target scale. */
  moving: boolean;
  /** Set on the frame the camera settles onto a new discrete scale. */
  settled: Scale | null;
}

/**
 * Owns the camera, orbit controls, and the ScaleNavigator, and choreographs
 * smooth dives between biological scales. The orchestrator asks it to change
 * scale and ticks it each frame; it eases the camera distance so movement reads
 * as a continuous zoom rather than a cut between pages.
 */
export class CameraScaleController {
  readonly camera: THREE.PerspectiveCamera;
  readonly controls: OrbitControls;
  private readonly navigator: ScaleNavigator;
  private lastSettled: Scale;

  constructor(domElement: HTMLElement, aspect: number, initial: Scale) {
    this.navigator = new ScaleNavigator(initial);
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 6000);
    this.camera.position.set(0, 40, 640).setLength(this.navigator.cameraDistance());

    this.controls = new OrbitControls(this.camera, domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 6;
    this.controls.maxDistance = 1000;
    this.controls.enablePan = false;

    this.lastSettled = initial;
  }

  get nearestScale(): Scale {
    return this.navigator.nearest;
  }

  get position(): number {
    return this.navigator.position;
  }

  intensityFor(scales: Scale[]): number {
    return this.navigator.intensityFor(scales);
  }

  setScale(scale: Scale): void {
    this.navigator.setScale(scale);
  }

  step(direction: 1 | -1): void {
    this.navigator.step(direction);
  }

  /** Ease the scale and camera. Returns movement state for the frame. */
  update(dt: number): CameraUpdate {
    const moving = this.navigator.update(dt);
    if (moving) {
      const dist = this.navigator.cameraDistance();
      const dir = this.camera.position.clone().sub(this.controls.target).normalize();
      const target = this.controls.target.clone().add(dir.multiplyScalar(dist));
      this.camera.position.lerp(target, Math.min(1, dt * 7));
      this.controls.update();
      return { moving: true, settled: null };
    }

    this.controls.update();
    if (this.lastSettled !== this.navigator.nearest) {
      this.lastSettled = this.navigator.nearest;
      return { moving: false, settled: this.lastSettled };
    }
    return { moving: false, settled: null };
  }

  setViewport(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  dispose(): void {
    this.controls.dispose();
  }
}
