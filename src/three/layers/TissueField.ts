import * as THREE from 'three';
import { Scale } from '../../types';
import { SceneLayer, fadeMaterial } from '../core/SceneLayer';
import { disposeObject } from '../core/dispose';
import { createBumpTexture } from '../textures/proceduralTextures';

/**
 * The tissue scale, rebuilt as a histology bench: four real tissue archetypes
 * float side by side as inspectable specimens — striated muscle fibres, a small
 * web of neurons, a cluster of alveolar sacs, and the stacked layers of skin.
 * Each is procedurally modelled, wet-shaded, and individually selectable, so the
 * scale finally reads as living tissue rather than a generic ball field.
 */

interface Specimen {
  root: THREE.Group;
  spin: number;
  bob: number;
}

export class TissueField implements SceneLayer {
  readonly root = new THREE.Group();
  readonly activeScales = [Scale.Tissue];

  private readonly bump: THREE.Texture;
  private readonly fadeables: (THREE.Material & { opacity: number })[] = [];
  private readonly specimens: Specimen[] = [];
  private readonly fill: THREE.PointLight;
  private intensity = 0;

  constructor() {
    this.root.name = 'TissueField';
    this.root.visible = false;
    this.bump = createBumpTexture(256, 0.08);

    const slots: Array<{ x: number; build: () => THREE.Group }> = [
      { x: -21, build: () => this.buildMuscle() },
      { x: -7, build: () => this.buildNeurons() },
      { x: 7, build: () => this.buildAlveoli() },
      { x: 21, build: () => this.buildSkin() },
    ];
    slots.forEach((slot, i) => {
      const g = slot.build();
      g.position.x = slot.x;
      this.root.add(g);
      this.specimens.push({ root: g, spin: 0.1 + (i % 2) * 0.06, bob: i * 1.3 });
    });

    // A soft warm fill from within gives every specimen translucent depth.
    this.fill = new THREE.PointLight(0x6fd6e6, 0, 120, 1.6);
    this.fill.position.set(0, 6, 14);
    this.root.add(this.fill);
  }

  /** Track a material so it fades with the scale. */
  private track<T extends THREE.Material & { opacity: number }>(mat: T): T {
    mat.transparent = true;
    mat.opacity = 0;
    this.fadeables.push(mat);
    return mat;
  }

  // ── Striated skeletal muscle: parallel fibres banded by cross-striations ────
  private buildMuscle(): THREE.Group {
    const g = new THREE.Group();
    g.userData.pick = { id: 'tissue:muscle', scale: Scale.Tissue };
    const fibreMat = this.track(new THREE.MeshStandardMaterial({
      color: 0xb24656, roughness: 0.5, metalness: 0.0,
      bumpMap: this.bump, bumpScale: 0.05, emissive: 0x3a0f16, emissiveIntensity: 0.3,
    }));
    const bandMat = this.track(new THREE.MeshStandardMaterial({
      color: 0x7a2230, roughness: 0.6, emissive: 0x250a10, emissiveIntensity: 0.2,
    }));
    const fibreGeo = new THREE.CylinderGeometry(0.7, 0.7, 13, 20, 1);
    fibreGeo.rotateZ(Math.PI / 2);
    const bandGeo = new THREE.TorusGeometry(0.72, 0.06, 8, 20);
    bandGeo.rotateY(Math.PI / 2);
    const offsets = [[0, 1.4], [0, -1.4], [1.3, 0], [-1.3, 0], [0, 0]];
    for (const [y, z] of offsets) {
      const fibre = new THREE.Mesh(fibreGeo, fibreMat);
      fibre.position.set(0, y, z);
      fibre.castShadow = true; fibre.receiveShadow = true;
      g.add(fibre);
      for (let b = -5; b <= 5; b++) {
        const ring = new THREE.Mesh(bandGeo, bandMat);
        ring.position.set(b * 1.15, y, z);
        g.add(ring);
      }
    }
    return g;
  }

  // ── Neural tissue: somata with branching dendrites and a long axon ──────────
  private buildNeurons(): THREE.Group {
    const g = new THREE.Group();
    g.userData.pick = { id: 'tissue:neuron', scale: Scale.Tissue };
    const somaMat = this.track(new THREE.MeshStandardMaterial({
      color: 0xf2e08a, emissive: 0x6a5a14, emissiveIntensity: 0.7,
      roughness: 0.45, bumpMap: this.bump, bumpScale: 0.04,
    }));
    const fibreMat = this.track(new THREE.LineBasicMaterial({
      color: 0xffe9a0, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    const somaGeo = new THREE.IcosahedronGeometry(0.9, 2);
    const cores = [new THREE.Vector3(0, 2.5, 0), new THREE.Vector3(-2, -1.5, 1), new THREE.Vector3(2.2, -2, -1)];
    const pts: number[] = [];
    for (const c of cores) {
      const soma = new THREE.Mesh(somaGeo, somaMat);
      soma.position.copy(c);
      soma.scale.setScalar(0.8 + Math.random() * 0.5);
      g.add(soma);
      // Dendrites: short branching spokes radiating from the soma.
      for (let d = 0; d < 7; d++) {
        const dir = new THREE.Vector3((Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5)).normalize();
        const len = 1.5 + Math.random() * 1.8;
        const mid = c.clone().add(dir.clone().multiplyScalar(len * 0.6));
        const end = c.clone().add(dir.multiplyScalar(len));
        pts.push(c.x, c.y, c.z, mid.x, mid.y, mid.z, mid.x, mid.y, mid.z, end.x, end.y, end.z);
      }
    }
    // Axon: a long connector between the first two somata.
    pts.push(cores[0].x, cores[0].y, cores[0].z, cores[1].x, cores[1].y, cores[1].z);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3));
    g.add(new THREE.LineSegments(geo, fibreMat));
    return g;
  }

  // ── Alveolar tissue: a grape-like cluster of thin gas-exchange sacs ─────────
  private buildAlveoli(): THREE.Group {
    const g = new THREE.Group();
    g.userData.pick = { id: 'tissue:alveoli', scale: Scale.Tissue };
    const sacMat = this.track(new THREE.MeshPhysicalMaterial({
      color: 0xe7b6c4, roughness: 0.3, metalness: 0.0,
      transmission: 0.6, thickness: 1.6, ior: 1.33,
      clearcoat: 0.8, clearcoatRoughness: 0.3,
      attenuationColor: new THREE.Color(0x9a4a5e), attenuationDistance: 5,
      envMapIntensity: 1.1,
    }));
    const ductMat = this.track(new THREE.MeshStandardMaterial({
      color: 0xc98aa6, roughness: 0.55,
    }));
    const sacGeo = new THREE.SphereGeometry(1, 24, 18);
    const cluster = [
      [0, 2.5, 0, 1.5], [1.8, 1.2, 0.5, 1.2], [-1.8, 1.1, -0.4, 1.3],
      [1.2, -0.6, -1.4, 1.1], [-1.3, -0.7, 1.3, 1.15], [0.2, -2.2, 0.2, 1.4],
      [2.1, -1.6, 0.8, 1.0], [-2.0, -1.7, -0.7, 1.05],
    ];
    for (const [x, y, z, s] of cluster) {
      const sac = new THREE.Mesh(sacGeo, sacMat);
      sac.position.set(x, y, z);
      sac.scale.setScalar(s);
      g.add(sac);
    }
    // A central bronchiole the sacs bud from.
    const duct = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 5, 16), ductMat);
    g.add(duct);
    return g;
  }

  // ── Skin: stacked epidermis / dermis / hypodermis layers ────────────────────
  private buildSkin(): THREE.Group {
    const g = new THREE.Group();
    g.userData.pick = { id: 'tissue:skin', scale: Scale.Tissue };
    const layers: Array<[number, number, number]> = [
      [0xeac6a8, 2.4, 0.9], // epidermis
      [0xd98a86, 1.6, 2.4], // dermis
      [0xe8c878, 1.2, 1.6], // hypodermis (fat)
    ];
    let y = 3;
    for (const [color, h, rough] of layers) {
      const mat = this.track(new THREE.MeshStandardMaterial({
        color, roughness: rough > 1 ? 0.8 : rough, metalness: 0.0,
        bumpMap: this.bump, bumpScale: 0.06,
      }));
      const slab = new THREE.Mesh(new THREE.BoxGeometry(5.5, h, 5.5), mat);
      slab.position.y = y - h / 2;
      slab.castShadow = true; slab.receiveShadow = true;
      g.add(slab);
      y -= h;
    }
    // A scatter of cells embedded in the dermis for histological texture.
    const cellMat = this.track(new THREE.MeshStandardMaterial({
      color: 0xb84a5a, emissive: 0x3a1018, emissiveIntensity: 0.4, roughness: 0.5,
    }));
    const cellGeo = new THREE.IcosahedronGeometry(0.22, 1);
    for (let i = 0; i < 26; i++) {
      const cell = new THREE.Mesh(cellGeo, cellMat);
      cell.position.set((Math.random() - 0.5) * 5, 1.2 - Math.random() * 2.2, (Math.random() - 0.5) * 5);
      g.add(cell);
    }
    return g;
  }

  onScaleChange(_scale: Scale, intensity: number): void {
    this.intensity = intensity;
    this.root.visible = intensity > 0.01;
  }

  update(dt: number, elapsed: number): void {
    for (const mat of this.fadeables) fadeMaterial(mat, this.intensity, dt);
    this.fill.intensity = this.intensity * 1.8;
    if (this.intensity < 0.02) return;
    this.specimens.forEach((sp) => {
      sp.root.rotation.y += dt * sp.spin;
      sp.root.position.y = Math.sin(elapsed * 0.6 + sp.bob) * 0.4;
    });
  }

  getPickables(): THREE.Object3D[] {
    return this.root.visible ? this.specimens.map((s) => s.root) : [];
  }

  dispose(): void {
    this.bump.dispose();
    disposeObject(this.root);
  }
}
