import * as THREE from 'three';
import { Scale } from '../../types';
import { SceneLayer, fadeMaterial } from '../core/SceneLayer';
import { disposeObject } from '../core/dispose';
import { createMembraneMaterial } from '../shaders/membrane';

export interface ModelProvenance {
  /** Human-readable source, shown in the UI. */
  label: string;
  /** Link to the model's origin, when external. */
  url?: string;
  /** True while a real external model is loaded rather than the placeholder. */
  external: boolean;
}

const DEFAULT_PROVENANCE: ModelProvenance = {
  label: 'Procedural anatomy placeholder',
  external: false,
};

type ModelFormat = 'gltf' | 'glb' | 'fbx';

/**
 * Organism-scale anatomy. Architected to load real open 3D models (for example
 * the Z-Anatomy GLB/GLTF/FBX assets) at runtime, with a lightweight procedural
 * body as the always-available fallback so the atlas works offline. No organism
 * is hardcoded into geometry: `loadModel` swaps the displayed body, and the
 * pickable organ-system and organ targets stay stable.
 *
 * Provenance is tracked and surfaced so the UI can always cite where a model
 * came from.
 */
export class AnatomyModelLayer implements SceneLayer {
  readonly root = new THREE.Group();
  readonly activeScales = [Scale.Organism, Scale.OrganSystem, Scale.Organ];

  private readonly placeholder = new THREE.Group();
  private loaded: THREE.Object3D | null = null;
  private mixer: THREE.AnimationMixer | null = null;
  private readonly membranes: THREE.ShaderMaterial[] = [];
  private heart: THREE.Group | null = null;
  private readonly pickables: THREE.Object3D[] = [];
  private intensity = 0;
  private currentScale: Scale = Scale.Organism;
  private organismId = 'homo_sapiens';
  private provenance: ModelProvenance = DEFAULT_PROVENANCE;

  constructor() {
    this.root.name = 'AnatomyModelLayer';
    this.root.visible = false;
    this.buildPlaceholder();
    this.root.add(this.placeholder);
  }

  get modelProvenance(): ModelProvenance {
    return this.provenance;
  }

  setOrganism(taxonId: string): void {
    this.organismId = taxonId;
    for (const p of this.pickables) {
      const pick = p.userData.pick as { id: string; scale: Scale } | undefined;
      if (pick?.id.startsWith('organism:')) pick.id = `organism:${taxonId}`;
    }
  }

  /**
   * Load an external anatomical model. GLTF/GLB are supported directly; FBX is
   * attempted via dynamic import so it never becomes a hard build dependency.
   * Falls back to the procedural body and reports failure to the caller.
   */
  async loadModel(url: string, provenance: ModelProvenance): Promise<boolean> {
    const format = formatFromUrl(url);
    try {
      const { object, animations } = await loadObject(url, format);
      this.clearLoaded();
      this.normalizeModel(object);
      object.userData.pick = { id: `organism:${this.organismId}`, scale: Scale.Organism };
      object.traverse((o) => {
        if (!o.userData.pick) o.userData.pick = object.userData.pick;
        if (!(o instanceof THREE.Mesh)) return;
        const materials = Array.isArray(o.material) ? o.material : [o.material];
        for (const material of materials) {
          material.toneMapped = true;
          if (material instanceof THREE.MeshStandardMaterial) {
            material.envMapIntensity = 1.25;
            material.roughness = Math.max(0.28, material.roughness);
            material.metalness = Math.min(0.18, material.metalness);
            material.emissiveIntensity = Math.min(0.08, material.emissiveIntensity);
          }
        }
      });
      this.loaded = object;
      this.root.add(object);
      if (animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(object);
        this.mixer.clipAction(animations[0]).play();
      }
      this.placeholder.visible = false;
      this.provenance = { ...provenance, external: true };
      return true;
    } catch {
      this.placeholder.visible = true;
      this.provenance = DEFAULT_PROVENANCE;
      return false;
    }
  }

  private clearLoaded(): void {
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer = null;
    }
    if (this.loaded) {
      disposeObject(this.loaded);
      this.loaded = null;
    }
  }

  /** Fit an arbitrary model into the scene's organism volume. */
  private normalizeModel(object: THREE.Object3D): void {
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = 30 / maxDim;
    object.scale.setScalar(scale);
    object.position.sub(center.multiplyScalar(scale));
  }

  // ---- procedural fallback -------------------------------------------------

  private buildPlaceholder(): void {
    const bodyMat = createMembraneMaterial({
      color: '#173e52',
      rimColor: '#6ca7b5',
      opacity: 0.025,
      rimPower: 3.8,
    });
    this.membranes.push(bodyMat);

    const body = new THREE.Group();
    body.name = 'body';

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(4.4, 9, 12, 24), bodyMat);
    torso.position.y = 2;
    body.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(2.8, 24, 24), bodyMat);
    head.position.y = 11.5;
    body.add(head);

    const limb = (x: number, y: number, len: number, r: number, tilt: number): THREE.Mesh => {
      const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 8, 16), bodyMat);
      m.position.set(x, y, 0);
      m.rotation.z = tilt;
      return m;
    };
    body.add(limb(-5.2, 3, 8, 1.1, 0.35));
    body.add(limb(5.2, 3, 8, 1.1, -0.35));
    body.add(limb(-2.2, -9, 9, 1.4, 0.06));
    body.add(limb(2.2, -9, 9, 1.4, -0.06));

    body.userData.pick = { id: `organism:${this.organismId}`, scale: Scale.Organism };
    body.traverse((o) => {
      if (!o.userData.pick) o.userData.pick = body.userData.pick;
    });
    this.placeholder.add(body);
    this.pickables.push(body);

    // A matte internal skeleton keeps the fallback readable through the skin.
    this.placeholder.add(this.buildSkeleton());

    // Cardiovascular system: a luminous vessel network plus a beating heart.
    const vessels = this.buildVessels();
    this.placeholder.add(vessels);

    const heart = this.buildHeart();
    heart.position.set(-1.2, 4.5, 2.6);
    this.heart = heart;
    this.placeholder.add(heart);
    this.pickables.push(heart);

    const systemAnchor = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 16, 16),
      new THREE.MeshBasicMaterial({ color: '#ff5b6b', transparent: true, opacity: 0 }),
    );
    systemAnchor.position.set(-1.2, 4.5, 2.6);
    systemAnchor.userData.pick = { id: 'system:cardiovascular', scale: Scale.OrganSystem };
    this.placeholder.add(systemAnchor);
    this.pickables.push(systemAnchor);
  }

  private buildSkeleton(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'skeleton';
    const material = new THREE.MeshPhysicalMaterial({
      color: '#d8d4c4',
      roughness: 0.46,
      metalness: 0.02,
      clearcoat: 0.25,
      clearcoatRoughness: 0.6,
      envMapIntensity: 0.8,
    });
    const bone = (radius: number, length: number, x: number, y: number, rotation = 0): THREE.Mesh => {
      const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 6, 12), material);
      mesh.position.set(x, y, 0.25);
      mesh.rotation.z = rotation;
      return mesh;
    };
    group.add(bone(0.35, 13, 0, 1));
    group.add(bone(0.28, 8, -4.5, 3, 0.35), bone(0.28, 8, 4.5, 3, -0.35));
    group.add(bone(0.38, 10, -1.55, -9, 0.04), bone(0.38, 10, 1.55, -9, -0.04));
    const skull = new THREE.Mesh(new THREE.SphereGeometry(2.05, 20, 20), material);
    skull.position.set(0, 11.5, 0.25);
    skull.scale.set(0.8, 1, 0.75);
    group.add(skull);
    for (let i = 0; i < 7; i++) {
      const rib = new THREE.Mesh(new THREE.TorusGeometry(2.7 - i * 0.12, 0.13, 8, 24, Math.PI), material);
      rib.position.set(0, 6 - i * 0.85, 0.2);
      rib.rotation.x = Math.PI / 2;
      group.add(rib);
    }
    return group;
  }

  private buildVessels(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'vessels';
    const mat = new THREE.LineBasicMaterial({
      color: '#c0405a',
      transparent: true,
      opacity: 0,
    });
    const positions: number[] = [];
    // A handful of branching arterial paths down the torso.
    for (let b = 0; b < 8; b++) {
      let p = new THREE.Vector3(-1.2 + (Math.random() - 0.5), 5, 2.2);
      for (let s = 0; s < 14; s++) {
        const next = p.clone().add(
          new THREE.Vector3((Math.random() - 0.5) * 1.6, -1.0 - Math.random() * 0.4, (Math.random() - 0.5) * 1.2),
        );
        positions.push(p.x, p.y, p.z, next.x, next.y, next.z);
        p = next;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    const lines = new THREE.LineSegments(geo, mat);
    lines.userData.vesselMat = mat;
    group.add(lines);
    return group;
  }

  private buildHeart(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'heart';
    const mat = new THREE.MeshPhysicalMaterial({
      color: '#c0394e',
      emissive: '#3a0a12',
      emissiveIntensity: 0.12,
      roughness: 0.32,
      clearcoat: 1,
      clearcoatRoughness: 0.35,
      sheen: 0.6,
      sheenColor: new THREE.Color('#ff8595'),
      envMapIntensity: 1,
    });
    const a = new THREE.Mesh(new THREE.SphereGeometry(1.5, 24, 24), mat);
    a.position.x = -0.7;
    const b = new THREE.Mesh(new THREE.SphereGeometry(1.5, 24, 24), mat);
    b.position.x = 0.7;
    const base = new THREE.Mesh(new THREE.ConeGeometry(1.7, 2.6, 24), mat);
    base.position.y = -1.6;
    base.rotation.x = Math.PI;
    group.add(a, b, base);
    group.userData.pick = { id: 'organ:heart', scale: Scale.Organ };
    group.traverse((o) => {
      if (!o.userData.pick) o.userData.pick = group.userData.pick;
    });
    return group;
  }

  // ---- lifecycle -----------------------------------------------------------

  onScaleChange(scale: Scale, intensity: number): void {
    this.currentScale = scale;
    this.intensity = intensity;
    this.root.visible = intensity > 0.01;
  }

  update(dt: number, elapsed: number): void {
    if (this.mixer) this.mixer.update(dt);

    for (const m of this.membranes) {
      m.uniforms.uTime.value = elapsed;
      m.uniforms.uOpacity.value = 0.025 * this.intensity + 0.006;
    }

    // Fade the cardiovascular vessels in as the camera commits to systems.
    this.placeholder.traverse((o) => {
      const mat = o.userData.vesselMat as THREE.LineBasicMaterial | undefined;
      if (mat) {
        const target = this.currentScale >= Scale.OrganSystem ? this.intensity * 0.8 : this.intensity * 0.25;
        fadeMaterial(mat, target, dt);
      }
    });

    if (this.heart) {
      const beat = 1 + Math.sin(elapsed * 4.5) * 0.06 + Math.sin(elapsed * 9) * 0.02;
      const emphasis = this.currentScale >= Scale.Organ ? 1.5 : 1;
      this.heart.scale.setScalar(beat * emphasis);
    }

    this.root.rotation.y = Math.sin(elapsed * 0.1) * 0.15;
  }

  getPickables(): THREE.Object3D[] {
    if (this.intensity <= 0.2) return [];
    // A loaded external model is the organism; otherwise expose the procedural
    // body and its cardiovascular targets.
    return this.loaded ? [this.loaded] : this.pickables;
  }

  dispose(): void {
    this.clearLoaded();
    disposeObject(this.root);
  }
}

// ---- loaders ----------------------------------------------------------------

function formatFromUrl(url: string): ModelFormat {
  const lower = url.toLowerCase();
  if (lower.endsWith('.glb')) return 'glb';
  if (lower.endsWith('.fbx')) return 'fbx';
  return 'gltf';
}

interface LoadedModel {
  object: THREE.Object3D;
  animations: THREE.AnimationClip[];
}

async function loadObject(url: string, format: ModelFormat): Promise<LoadedModel> {
  if (format === 'fbx') {
    const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader.js');
    const object = await new FBXLoader().loadAsync(url);
    return { object, animations: object.animations ?? [] };
  }
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const gltf = await new GLTFLoader().loadAsync(url);
  return { object: gltf.scene, animations: gltf.animations ?? [] };
}
