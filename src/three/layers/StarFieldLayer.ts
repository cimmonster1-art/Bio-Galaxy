import * as THREE from 'three';
import { Scale, PickTag } from '../../types';
import { SceneLayer, fadeMaterial } from '../core/SceneLayer';
import { disposeObject } from '../core/dispose';
import { createGlowTexture } from '../textures/proceduralTextures';
import { createSpriteLabel } from '../labels/SpriteLabel';
import { galaxySceneStars, SceneStar } from '../../data/stars';

/**
 * The named star map beyond the Oort Cloud, rendered in 3D. The borrowed
 * Astro Insight bright-star catalogue (HYG v4.1) is already first-class data —
 * `STAR_OBJECTS`, the copilot corpus, and global search all draw on it — but
 * nothing drew it in the scene. This layer closes that gap: every catalogue
 * star is placed on a celestial shell as an individually clickable instance,
 * sized by apparent magnitude and coloured by spectral class, over an additive
 * glow, with labels on the brightest named stars.
 *
 * Active across the Cosmos and Galaxy scales, alongside the procedural cosmic
 * web and spiral. Selecting a star resolves `star:<index>`, grounding the
 * copilot in the real catalogue with cited astronomy sources.
 */

const SHELL_RADIUS = 240;
const CATALOGUE_ID = /^(HIP|HD|HR|NGC|TYC|PSR|GJ|Gliese)\b/i;

export class StarFieldLayer implements SceneLayer {
  readonly root = new THREE.Group();
  readonly activeScales = [Scale.Cosmos, Scale.Galaxy];

  private readonly glowTex: THREE.Texture;
  private readonly stars: THREE.InstancedMesh;
  private readonly starMat: THREE.MeshBasicMaterial;
  private readonly glow: THREE.Points;
  private readonly glowMat: THREE.PointsMaterial;
  private readonly fadeables: (THREE.Material & { opacity: number })[] = [];
  private intensity = 0;

  constructor() {
    this.root.name = 'StarFieldLayer';
    this.root.visible = false;
    this.glowTex = createGlowTexture(128);

    const scene: SceneStar[] = galaxySceneStars();
    const count = scene.length;
    const positions = new Float32Array(count * 3);
    const glowColors = new Float32Array(count * 3);
    const pickInstances: PickTag[] = [];

    // ── Clickable star instances ────────────────────────────────────────────
    this.starMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0 });
    this.stars = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), this.starMat, count);
    this.stars.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const s = scene[i];
      const x = s.dir[0] * SHELL_RADIUS, y = s.dir[1] * SHELL_RADIUS, z = s.dir[2] * SHELL_RADIUS;
      positions[i * 3] = x; positions[i * 3 + 1] = y; positions[i * 3 + 2] = z;
      // Brighter stars (higher brightness) render larger.
      const size = 0.7 + s.brightness * s.brightness * 3.0;
      dummy.position.set(x, y, z);
      dummy.scale.setScalar(size);
      dummy.updateMatrix();
      this.stars.setMatrixAt(i, dummy.matrix);
      color.set(s.color);
      this.stars.setColorAt(i, color);
      glowColors[i * 3] = color.r; glowColors[i * 3 + 1] = color.g; glowColors[i * 3 + 2] = color.b;
      pickInstances.push({ id: s.id, scale: Scale.Galaxy });
    }
    this.stars.instanceMatrix.needsUpdate = true;
    if (this.stars.instanceColor) this.stars.instanceColor.needsUpdate = true;
    this.stars.userData.pickInstances = pickInstances;
    this.stars.frustumCulled = false;
    this.root.add(this.stars);
    this.fadeables.push(this.starMat);

    // ── Soft additive glow over every star ────────────────────────────────────
    const glowGeo = new THREE.BufferGeometry();
    glowGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    glowGeo.setAttribute('color', new THREE.BufferAttribute(glowColors, 3));
    this.glowMat = new THREE.PointsMaterial({
      map: this.glowTex, size: 7, sizeAttenuation: true, vertexColors: true,
      transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.glow = new THREE.Points(glowGeo, this.glowMat);
    this.glow.frustumCulled = false;
    this.root.add(this.glow);
    this.fadeables.push(this.glowMat);

    // ── Labels for the brightest named stars ──────────────────────────────────
    const labelled = scene
      .filter((s) => !CATALOGUE_ID.test(s.name))
      .sort((a, b) => b.brightness - a.brightness)
      .slice(0, 32);
    for (const s of labelled) {
      const label = createSpriteLabel(s.name, '#dfe9ff');
      label.position.set(s.dir[0], s.dir[1], s.dir[2]).multiplyScalar(SHELL_RADIUS * 1.012);
      (label.material as THREE.SpriteMaterial).opacity = 0;
      this.root.add(label);
      this.fadeables.push(label.material as THREE.SpriteMaterial);
    }
  }

  onScaleChange(_scale: Scale, intensity: number): void {
    this.intensity = intensity;
    this.root.visible = intensity > 0.01;
  }

  update(dt: number, elapsed: number): void {
    for (const mat of this.fadeables) fadeMaterial(mat, this.intensity, dt);
    // A slow, calm celestial drift shared by the whole sky.
    this.root.rotation.y = elapsed * 0.008;
  }

  getPickables(): THREE.Object3D[] {
    return this.intensity > 0.3 ? [this.stars] : [];
  }

  static tagFor(id: string): PickTag | null {
    return /^star:\d+$/.test(id) ? { id, scale: Scale.Galaxy } : null;
  }

  dispose(): void {
    this.glowTex.dispose();
    disposeObject(this.root);
  }
}
