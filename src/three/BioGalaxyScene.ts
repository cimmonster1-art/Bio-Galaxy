import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Scale, PickTag } from '../types';
import { SceneLayer } from './core/SceneLayer';
import { SceneLightingRig } from './core/SceneLightingRig';
import { CameraScaleController } from './core/CameraScaleController';
import { SelectionRaycaster } from './core/SelectionRaycaster';
import { PerformanceManager } from './core/PerformanceManager';
import { PostFX } from './core/PostFX';
import { createNebulaBackground } from './shaders/nebula';
import { CosmosLayer } from './layers/CosmosLayer';
import { SolarSystemLayer } from './layers/SolarSystemLayer';
import { EarthLayer } from './layers/EarthLayer';
import { TreeOfLifeLayer } from './layers/TreeOfLifeLayer';
import { AnatomyModelLayer, ModelProvenance } from './layers/AnatomyModelLayer';
import { TissueField } from './layers/TissueField';
import { CellScene } from './layers/CellScene';
import { OrganelleDetailView } from './layers/OrganelleDetailView';
import { ProteinStructureLayer } from './layers/ProteinStructureLayer';

export interface SceneCallbacks {
  onHover?: (tag: PickTag | null) => void;
  onSelect?: (tag: PickTag | null) => void;
  onScaleSettled?: (scale: Scale) => void;
  onError?: (error: Error) => void;
}

/**
 * Main orchestrator. Owns the renderer, scene graph, post-processing, lighting,
 * and animation loop, and drives a stack of scale-specific layers through the
 * CameraScaleController. Selection runs through the SelectionRaycaster; demand
 * rendering is gated by the PerformanceManager. Every GPU resource, observer,
 * listener, and animation frame is released on dispose.
 */
export class BioGalaxyScene {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly lighting: SceneLightingRig;
  private readonly cameraController: CameraScaleController;
  private readonly raycaster: SelectionRaycaster;
  private readonly performance: PerformanceManager;
  private readonly postFX: PostFX;

  private readonly nebula: THREE.Mesh;
  private readonly nebulaMat: THREE.ShaderMaterial;
  private readonly envTexture: THREE.Texture;

  private readonly layers: SceneLayer[];
  private readonly cosmos: CosmosLayer;
  private readonly tree: TreeOfLifeLayer;
  private readonly anatomy: AnatomyModelLayer;
  private readonly cell: CellScene;
  private readonly protein: ProteinStructureLayer;

  private hoverTag: PickTag | null = null;
  private readonly clock = new THREE.Clock();
  private rafId = 0;
  private running = false;
  private hoverAccumulator = 0;
  private idleFrames = 0;
  private cinematicProgress: number | null = null;

  private readonly resizeObserver: ResizeObserver;

  constructor(
    private readonly container: HTMLElement,
    initialScale: Scale,
    private readonly callbacks: SceneCallbacks = {},
  ) {
    const width = container.clientWidth || 1;
    const height = container.clientHeight || 1;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0x02040a, 1);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    container.appendChild(this.renderer.domElement);

    this.scene.fog = new THREE.FogExp2(0x02040a, 0.0011);

    // Procedural studio environment for physically based reflections. Generated
    // once with PMREM, applied to the whole scene, and disposed on teardown.
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = this.envTexture;
    pmrem.dispose();

    const bg = createNebulaBackground(2000);
    this.nebula = bg.mesh;
    this.nebulaMat = bg.material;
    this.scene.add(this.nebula);

    this.lighting = new SceneLightingRig(this.scene);
    this.cameraController = new CameraScaleController(this.renderer.domElement, width / height, initialScale);
    this.raycaster = new SelectionRaycaster(this.renderer.domElement);

    this.cosmos = new CosmosLayer();
    this.tree = new TreeOfLifeLayer();
    this.anatomy = new AnatomyModelLayer();
    this.cell = new CellScene();
    this.protein = new ProteinStructureLayer();
    this.layers = [
      this.cosmos,
      new SolarSystemLayer(),
      new EarthLayer(),
      this.tree,
      this.anatomy,
      new TissueField(),
      this.cell,
      new OrganelleDetailView(),
      this.protein,
    ];
    for (const layer of this.layers) this.scene.add(layer.root);

    this.postFX = new PostFX(this.renderer, this.scene, this.cameraController.camera, width, height);

    this.renderer.domElement.addEventListener('pointermove', this.onPointerMove);
    this.renderer.domElement.addEventListener('pointerleave', this.onPointerLeave);
    this.renderer.domElement.addEventListener('click', this.onClick);
    this.cameraController.controls.addEventListener('change', this.onControlsChange);

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(container);

    this.performance = new PerformanceManager(container, {
      onActivate: () => this.start(),
      onDeactivate: () => this.stop(),
    });

    this.applyScale();
    this.start();
  }

  // ---- public API ----------------------------------------------------------

  setScale(scale: Scale): void {
    this.cameraController.setScale(scale);
    this.start();
  }

  stepScale(direction: 1 | -1): void {
    this.cameraController.step(direction);
    this.start();
  }

  /** Highlight a selected organelle inside the cell layer. */
  setSelected(id: string | null): void {
    this.cell.setSelected(id);
    this.anatomy.setSelected(id);
    this.start();
  }

  /** Keep every live layer animating beneath the interactive history cutscene. */
  setCinematicProgress(progress: number | null): void {
    this.cinematicProgress = progress;
    this.anatomy.setCinematicProgress(progress);
    this.cosmos.setCinematic(progress);
    if (progress !== null) this.start();
  }

  /** Focus a taxonomic lineage in the Tree of Life and orient toward it. */
  setFocusTaxon(id: string | null): void {
    this.tree.setSelected(id);
    if (id) {
      this.tree.focusLineage(id.replace(/^taxon:/, ''));
      this.anatomy.setOrganism(id.replace(/^taxon:/, ''));
    }
    this.start();
  }

  /** Load an external organism model (GLTF/GLB/FBX) with provenance. */
  loadOrganismModel(url: string, provenance: ModelProvenance): Promise<boolean> {
    this.start();
    return this.anatomy.loadModel(url, provenance);
  }

  /** Render a real molecular structure from parsed open PDB coordinates. */
  setStructure(
    atoms: { element: string; x: number; y: number; z: number }[] | null,
    pickId: string,
  ): void {
    if (atoms && atoms.length > 0) {
      this.protein.loadAtoms(atoms, pickId);
      this.start();
    }
  }

  get organismProvenance(): ModelProvenance {
    return this.anatomy.modelProvenance;
  }

  get currentScale(): Scale {
    return this.cameraController.nearestScale;
  }

  // ---- loop ----------------------------------------------------------------

  private start(): void {
    if (this.running || !this.performance.active) return;
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
    try {
      this.renderFrame();
    } catch (error) {
      this.stop();
      this.callbacks.onError?.(error instanceof Error ? error : new Error('The 3D scene stopped unexpectedly.'));
    }
  };

  private renderFrame(): void {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.elapsedTime;

    const camUpdate = this.cameraController.update(dt);
    this.applyScale();
    if (camUpdate.settled !== null) this.callbacks.onScaleSettled?.(camUpdate.settled);

    for (const layer of this.layers) layer.update(dt, elapsed);

    this.nebulaMat.uniforms.uTime.value = elapsed;
    this.nebula.rotation.y = elapsed * 0.003;

    this.hoverAccumulator += dt;
    if (this.hoverAccumulator > 0.06) {
      this.hoverAccumulator = 0;
      this.updateHover();
    }

    this.postFX.render();

    // Idle the loop out once settled and the pointer is quiet, to save the GPU.
    if (!camUpdate.moving && !this.raycaster.pointerActive && this.cinematicProgress === null) {
      if (++this.idleFrames > 90) {
        this.stop();
        this.idleFrames = 0;
        return;
      }
    } else {
      this.idleFrames = 0;
    }

    this.rafId = requestAnimationFrame(this.tick);
  }

  private applyScale(): void {
    const nearest = this.cameraController.nearestScale;
    for (const layer of this.layers) {
      layer.onScaleChange(nearest, this.cameraController.intensityFor(layer.activeScales));
    }
  }

  // ---- picking -------------------------------------------------------------

  private gatherPickables(): THREE.Object3D[] {
    const out: THREE.Object3D[] = [];
    for (const layer of this.layers) out.push(...layer.getPickables());
    return out;
  }

  private updateHover(): void {
    if (!this.raycaster.pointerActive) return;
    const tag = this.raycaster.pick(this.cameraController.camera, this.gatherPickables());
    if (tag?.id !== this.hoverTag?.id) {
      this.hoverTag = tag;
      this.renderer.domElement.style.cursor = tag ? 'pointer' : 'default';
      this.callbacks.onHover?.(tag);
    }
  }

  private onPointerMove = (e: PointerEvent): void => {
    this.raycaster.updatePointer(e);
    this.start();
  };

  private onPointerLeave = (): void => {
    this.raycaster.clear();
    if (this.hoverTag) {
      this.hoverTag = null;
      this.callbacks.onHover?.(null);
      this.renderer.domElement.style.cursor = 'default';
    }
  };

  private onClick = (): void => {
    if (!this.raycaster.pointerActive) return;
    const tag = this.raycaster.pick(this.cameraController.camera, this.gatherPickables());
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
    this.cameraController.setViewport(w / h);
    this.renderer.setSize(w, h);
    this.postFX.setSize(w, h);
    this.start();
  }

  dispose(): void {
    this.stop();
    this.resizeObserver.disconnect();
    this.performance.dispose();
    this.renderer.domElement.removeEventListener('pointermove', this.onPointerMove);
    this.renderer.domElement.removeEventListener('pointerleave', this.onPointerLeave);
    this.renderer.domElement.removeEventListener('click', this.onClick);
    this.cameraController.controls.removeEventListener('change', this.onControlsChange);

    for (const layer of this.layers) layer.dispose();
    this.scene.environment = null;
    this.envTexture.dispose();
    this.nebula.geometry.dispose();
    this.nebulaMat.dispose();
    this.lighting.dispose();
    this.cameraController.dispose();
    this.postFX.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
