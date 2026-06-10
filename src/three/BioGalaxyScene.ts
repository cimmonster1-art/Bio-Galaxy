import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Scale, PickTag } from '../types';
import { ScaleNavigator } from './ScaleNavigator';
import { SceneLayer } from './core/SceneLayer';
import { OrganismField } from './layers/OrganismField';
import { TissueField } from './layers/TissueField';
import { CellScene } from './layers/CellScene';
import { OrganelleDetailView } from './layers/OrganelleDetailView';
import { ProteinStructureLayer } from './layers/ProteinStructureLayer';

export interface SceneCallbacks {
  onHover?: (tag: PickTag | null) => void;
  onSelect?: (tag: PickTag | null) => void;
  onScaleSettled?: (scale: Scale) => void;
}

/**
 * Main orchestrator. Owns the renderer, camera, controls, lighting, scene
 * graph, animation loop, and lifecycle. Layers own their own geometry; this
 * class drives them through the ScaleNavigator and routes raycast selection.
 *
 * Performance and correctness measures:
 *   - render loop pauses when the canvas leaves the viewport
 *   - device pixel ratio is capped
 *   - hover raycasting is throttled
 *   - every geometry, material, control, listener, and RAF is disposed
 */
export class BioGalaxyScene {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly controls: OrbitControls;
  private readonly navigator: ScaleNavigator;
  private readonly layers: SceneLayer[];
  private readonly cell: CellScene;

  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private pointerActive = false;
  private hoverTag: PickTag | null = null;

  private readonly clock = new THREE.Clock();
  private rafId = 0;
  private running = false;
  private visible = true;
  private hoverAccumulator = 0;
  private lastSettled: Scale;

  private readonly resizeObserver: ResizeObserver;
  private readonly intersectionObserver: IntersectionObserver;

  constructor(
    private readonly container: HTMLElement,
    initialScale: Scale,
    private readonly callbacks: SceneCallbacks = {},
  ) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.scene.fog = new THREE.FogExp2(0x02060d, 0.0008);
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      2000,
    );
    this.camera.position.set(0, 12, 150);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 6;
    this.controls.maxDistance = 320;
    this.controls.enablePan = false;

    this.addLights();

    this.navigator = new ScaleNavigator(initialScale);
    this.lastSettled = initialScale;

    this.cell = new CellScene();
    this.layers = [
      new OrganismField(),
      new TissueField(),
      this.cell,
      new OrganelleDetailView(),
      new ProteinStructureLayer(),
    ];
    for (const layer of this.layers) this.scene.add(layer.root);

    this.renderer.domElement.addEventListener('pointermove', this.onPointerMove);
    this.renderer.domElement.addEventListener('pointerleave', this.onPointerLeave);
    this.renderer.domElement.addEventListener('click', this.onClick);
    // Wheel zoom and momentum damping emit 'change' without a pointermove, so
    // restart the loop on control changes to keep interaction responsive.
    this.controls.addEventListener('change', this.onControlsChange);

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(container);

    this.intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        this.visible = entry.isIntersecting;
        if (this.visible) this.start();
        else this.stop();
      },
      { threshold: 0.05 },
    );
    this.intersectionObserver.observe(container);

    this.applyScale();
    this.start();
  }

  private addLights(): void {
    this.scene.add(new THREE.AmbientLight(0x4a6a85, 0.9));
    const key = new THREE.DirectionalLight(0xbfe9ff, 1.1);
    key.position.set(20, 30, 40);
    this.scene.add(key);
    const rim = new THREE.PointLight(0x27c4d9, 0.8, 400);
    rim.position.set(-40, -20, 30);
    this.scene.add(rim);
  }

  // ---- public API ----------------------------------------------------------

  setScale(scale: Scale): void {
    this.navigator.setScale(scale);
    this.start();
  }

  stepScale(direction: 1 | -1): void {
    this.navigator.step(direction);
    this.start();
  }

  /** Highlight a selected organelle inside the cell layer. */
  setSelected(id: string | null): void {
    this.cell.setSelected(id);
  }

  get currentScale(): Scale {
    return this.navigator.nearest;
  }

  // ---- loop ----------------------------------------------------------------

  private start(): void {
    if (this.running || !this.visible) return;
    this.running = true;
    this.clock.getDelta();
    this.rafId = requestAnimationFrame(this.tick);
  }

  private stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  private tick = (): void => {
    if (!this.running) return;
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.elapsedTime;

    const moving = this.navigator.update(dt);
    this.applyScale();

    if (moving) {
      const dist = this.navigator.cameraDistance();
      const dir = this.camera.position.clone().sub(this.controls.target).normalize();
      const target = this.controls.target.clone().add(dir.multiplyScalar(dist));
      this.camera.position.lerp(target, Math.min(1, dt * 4));
    } else if (this.lastSettled !== this.navigator.nearest) {
      this.lastSettled = this.navigator.nearest;
      this.callbacks.onScaleSettled?.(this.lastSettled);
    }

    for (const layer of this.layers) layer.update(dt, elapsed);

    this.hoverAccumulator += dt;
    if (this.hoverAccumulator > 0.06) {
      this.hoverAccumulator = 0;
      this.updateHover();
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);

    // Idle out the loop once settled and the user is not interacting, to save
    // the GPU. Pointer and control events restart it.
    if (!moving && !this.pointerActive) {
      this.idleFrames++;
      if (this.idleFrames > 90) {
        this.stop();
        this.idleFrames = 0;
        return;
      }
    } else {
      this.idleFrames = 0;
    }

    this.rafId = requestAnimationFrame(this.tick);
  };

  private idleFrames = 0;

  private applyScale(): void {
    const nearest = this.navigator.nearest;
    for (const layer of this.layers) {
      layer.onScaleChange(nearest, this.navigator.intensityFor(layer.activeScales));
    }
  }

  // ---- picking -------------------------------------------------------------

  private gatherPickables(): THREE.Object3D[] {
    const out: THREE.Object3D[] = [];
    for (const layer of this.layers) out.push(...layer.getPickables());
    return out;
  }

  private raycast(): PickTag | null {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.gatherPickables(), true);
    for (const hit of hits) {
      const tag = findPickTag(hit.object);
      if (tag) return tag;
    }
    return null;
  }

  private updateHover(): void {
    if (!this.pointerActive) return;
    const tag = this.raycast();
    const changed = tag?.id !== this.hoverTag?.id;
    if (changed) {
      this.hoverTag = tag;
      this.renderer.domElement.style.cursor = tag ? 'pointer' : 'default';
      this.callbacks.onHover?.(tag);
    }
  }

  private onPointerMove = (e: PointerEvent): void => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.pointerActive = true;
    this.start();
  };

  private onPointerLeave = (): void => {
    this.pointerActive = false;
    if (this.hoverTag) {
      this.hoverTag = null;
      this.callbacks.onHover?.(null);
      this.renderer.domElement.style.cursor = 'default';
    }
  };

  private onClick = (): void => {
    if (!this.pointerActive) return;
    const tag = this.raycast();
    this.callbacks.onSelect?.(tag);
  };

  private onControlsChange = (): void => {
    this.start();
  };

  // ---- resize / teardown ---------------------------------------------------

  private handleResize(): void {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.start();
  }

  dispose(): void {
    this.stop();
    this.resizeObserver.disconnect();
    this.intersectionObserver.disconnect();
    this.renderer.domElement.removeEventListener('pointermove', this.onPointerMove);
    this.renderer.domElement.removeEventListener('pointerleave', this.onPointerLeave);
    this.renderer.domElement.removeEventListener('click', this.onClick);
    this.controls.removeEventListener('change', this.onControlsChange);
    for (const layer of this.layers) layer.dispose();
    this.controls.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

/** Walk up the parent chain to find the nearest pick tag. */
function findPickTag(object: THREE.Object3D): PickTag | null {
  let current: THREE.Object3D | null = object;
  while (current) {
    const tag = current.userData?.pick as PickTag | undefined;
    if (tag) return tag;
    current = current.parent;
  }
  return null;
}
