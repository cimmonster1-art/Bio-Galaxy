import * as THREE from 'three';
import { Scale, PickTag } from '../../types';
import { SceneLayer, fadeMaterial } from '../core/SceneLayer';
import { disposeObject } from '../core/dispose';
import { createGlowTexture } from '../textures/proceduralTextures';
import { createSpriteLabel } from '../labels/SpriteLabel';
import { BRIGHT_STAR_CATALOG, DEEP_SKY, raDecToVec3 } from '../../data/celestial';

/**
 * The named celestial map beyond the Oort Cloud, ported from Astro Insight. The
 * 1,000 brightest stars (HYG v4.1) are rendered on a celestial sphere — each an
 * individually clickable instance, sized by apparent magnitude and coloured by
 * spectral class — over an additive glow. Notable deep-sky bodies (galaxies,
 * nebulae, clusters, Sgr A*) sit among them as labelled, clickable markers.
 *
 * Active across the Cosmos and Galaxy scales, alongside the procedural cosmic
 * web and spiral. Selecting any star or body grounds the copilot in real star
 * catalogues with cited astronomy sources.
 */

const STAR_RADIUS = 205;
const DEEP_SKY_RADIUS = 232;

export class StarFieldLayer implements SceneLayer {
  readonly root = new THREE.Group();
  readonly activeScales = [Scale.Cosmos, Scale.Galaxy];

  private readonly glowTex: THREE.Texture;
  private readonly stars: THREE.InstancedMesh;
  private readonly starMat: THREE.MeshBasicMaterial;
  private readonly glow: THREE.Points;
  private readonly glowMat: THREE.PointsMaterial;
  private readonly deepSky: THREE.Group[] = [];
  private readonly fadeables: (THREE.Material & { opacity: number })[] = [];
  private intensity = 0;

  constructor() {
    this.root.name = 'StarFieldLayer';
    this.root.visible = false;
    this.glowTex = createGlowTexture(128);

    const count = BRIGHT_STAR_CATALOG.length;
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
      const star = BRIGHT_STAR_CATALOG[i];
      const p = raDecToVec3(star.raH, star.decDeg, STAR_RADIUS);
      positions[i * 3] = p.x; positions[i * 3 + 1] = p.y; positions[i * 3 + 2] = p.z;
      // Brighter stars (lower magnitude) render larger.
      const size = THREE.MathUtils.clamp(THREE.MathUtils.mapLinear(star.mag, -1.5, 6, 3.6, 0.6), 0.6, 3.6);
      dummy.position.copy(p);
      dummy.scale.setScalar(size);
      dummy.updateMatrix();
      this.stars.setMatrixAt(i, dummy.matrix);
      color.set(star.color);
      this.stars.setColorAt(i, color);
      glowColors[i * 3] = color.r; glowColors[i * 3 + 1] = color.g; glowColors[i * 3 + 2] = color.b;
      pickInstances.push({ id: `star:${i}`, scale: Scale.Galaxy });
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
      map: this.glowTex, size: 6, sizeAttenuation: true, vertexColors: true,
      transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.glow = new THREE.Points(glowGeo, this.glowMat);
    this.glow.frustumCulled = false;
    this.root.add(this.glow);
    this.fadeables.push(this.glowMat);

    // ── Labels for the brightest named stars ──────────────────────────────────
    const brightest = BRIGHT_STAR_CATALOG
      .map((star, i) => ({ star, i }))
      .filter(({ star }) => !/^(HIP|HD|HR|NGC|TYC|PSR|GJ|Gliese)\b/i.test(star.name))
      .sort((a, b) => a.star.mag - b.star.mag)
      .slice(0, 32);
    for (const { star } of brightest) {
      const label = createSpriteLabel(star.name, '#dfe9ff');
      label.position.copy(raDecToVec3(star.raH, star.decDeg, STAR_RADIUS).multiplyScalar(1.012));
      (label.material as THREE.SpriteMaterial).opacity = 0;
      this.root.add(label);
      this.fadeables.push(label.material as THREE.SpriteMaterial);
    }

    // ── Deep-sky markers (galaxies, nebulae, clusters, black holes) ───────────
    for (const d of DEEP_SKY) {
      const group = new THREE.Group();
      const pos = raDecToVec3(d.raH, d.decDeg, DEEP_SKY_RADIUS);
      group.position.copy(pos);
      group.userData.pick = { id: `deepsky:${d.id}`, scale: d.kind === 'galaxy' ? Scale.Galaxy : Scale.Cosmos };

      const haloMat = new THREE.SpriteMaterial({
        map: this.glowTex, color: new THREE.Color(d.color), transparent: true, opacity: 0,
        depthWrite: false, blending: THREE.AdditiveBlending,
      });
      const halo = new THREE.Sprite(haloMat);
      halo.scale.setScalar(d.kind === 'galaxy' ? 14 : 9);
      group.add(halo);
      this.fadeables.push(haloMat);

      const coreMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(d.color), transparent: true, opacity: 0 });
      const core = new THREE.Mesh(new THREE.SphereGeometry(1.4, 12, 12), coreMat);
      group.add(core);
      this.fadeables.push(coreMat);

      const label = createSpriteLabel(d.name, '#bfe0ff');
      label.position.set(0, d.kind === 'galaxy' ? 9 : 6, 0);
      (label.material as THREE.SpriteMaterial).opacity = 0;
      group.add(label);
      this.fadeables.push(label.material as THREE.SpriteMaterial);

      this.deepSky.push(group);
      this.root.add(group);
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
    if (this.intensity < 0.3) return [];
    return [this.stars, ...this.deepSky];
  }

  static tagFor(id: string): PickTag | null {
    if (/^star:\d+$/.test(id)) return { id, scale: Scale.Galaxy };
    if (id.startsWith('deepsky:')) return { id, scale: Scale.Cosmos };
    return null;
  }

  dispose(): void {
    this.glowTex.dispose();
    disposeObject(this.root);
  }
}
