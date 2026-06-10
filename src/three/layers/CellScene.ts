import * as THREE from 'three';
import { Scale } from '../../types';
import { SceneLayer, fadeMaterial } from '../core/SceneLayer';
import { disposeObject } from '../core/dispose';
import { createBumpTexture } from '../textures/proceduralTextures';
import { disposeDetailTextures } from '../textures/detailTextures';
import {
  Pickable,
  buildCentriole,
  buildCytoskeleton,
  buildER,
  buildGolgi,
  buildLysosome,
  buildMembrane,
  buildMitochondrion,
  buildNucleus,
  buildPeroxisome,
  buildRibosomes,
  buildVesicles,
} from './cell/builders';

/**
 * The detailed volumetric cell. Assembles recognizable organelles from the
 * builder set, drifts them gently, and exposes each as a pickable. Visible at
 * the Cell and Organelle scales; at the Organelle scale the selected organelle
 * is emphasized so the descent reads as a focus rather than a page change.
 */
export class CellScene implements SceneLayer {
  readonly root = new THREE.Group();
  readonly activeScales = [Scale.Cell, Scale.Organelle];

  private readonly radius = 18;
  private readonly membrane: THREE.Mesh;
  private readonly pickables: Pickable[] = [];
  private readonly drifters: { group: THREE.Group; phase: number; base: THREE.Vector3 }[] = [];
  private readonly vesicles: Pickable;
  private readonly bump: THREE.Texture;
  private readonly innerLight: THREE.PointLight;
  private readonly warmLight: THREE.PointLight;
  private intensity = 0;
  private selectedId: string | null = null;

  constructor() {
    this.root.name = 'CellScene';
    this.root.visible = false;

    this.bump = createBumpTexture(256, 0.07);

    this.membrane = buildMembrane(this.radius, this.bump);
    this.root.add(this.membrane);

    const nucleus = buildNucleus(5.5, this.bump);
    this.place(nucleus, new THREE.Vector3(0, 0, 0));

    const er = buildER(5.5, this.bump);
    this.place(er, new THREE.Vector3(0, 0, 0));

    // Scatter the discrete organelles around the cytoplasm.
    this.placeMany(() => buildMitochondrion(this.bump), 4, 10);
    this.place(buildGolgi(this.bump), new THREE.Vector3(-9, -4, 3));
    this.place(buildCytoskeleton(this.radius), new THREE.Vector3(0, 0, 0));

    // The three new organelles: a couple of digestive lysosomes, a peroxisome,
    // and the centrosome's paired centrioles near the nucleus.
    this.place(buildLysosome(this.bump), new THREE.Vector3(8, 5, -5));
    this.place(buildLysosome(this.bump), new THREE.Vector3(-6, 7, 6));
    this.place(buildPeroxisome(this.bump), new THREE.Vector3(5, -7, 7));
    this.place(buildCentriole(this.bump), new THREE.Vector3(-7, 2, -8));

    this.vesicles = buildVesicles(40, this.radius);
    this.place(this.vesicles, new THREE.Vector3(0, 0, 0));

    this.place(buildRibosomes(60, this.radius), new THREE.Vector3(0, 0, 0));

    // Two colored interior lights give the cytoplasm translucent depth: a cool
    // teal key from one side and a warm amber fill from the other read as light
    // scattering through the wet, crowded cytosol.
    this.innerLight = new THREE.PointLight(0x4fd6e6, 0, 50, 1.8);
    this.innerLight.position.set(2, 3, 2);
    this.root.add(this.innerLight);

    this.warmLight = new THREE.PointLight(0xffb55a, 0, 46, 2.0);
    this.warmLight.position.set(-8, -5, -6);
    this.root.add(this.warmLight);
  }

  private place(p: Pickable, position: THREE.Vector3): void {
    p.group.position.copy(position);
    this.root.add(p.group);
    this.pickables.push(p);
    this.drifters.push({ group: p.group, phase: Math.random() * Math.PI * 2, base: position.clone() });
  }

  private placeMany(factory: () => Pickable, count: number, spread: number): void {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const pos = new THREE.Vector3(
        Math.cos(a) * spread,
        Math.sin(a * 1.7) * 4,
        Math.sin(a) * spread,
      );
      const p = factory();
      p.group.rotation.set(Math.random(), Math.random(), Math.random());
      this.place(p, pos);
    }
  }

  setSelected(id: string | null): void {
    this.selectedId = id;
  }

  onScaleChange(_scale: Scale, intensity: number): void {
    this.intensity = intensity;
    this.root.visible = intensity > 0.01;
  }

  update(dt: number, elapsed: number): void {
    fadeMaterial(this.membrane.material as THREE.MeshPhysicalMaterial, this.intensity * 0.16, dt);
    this.innerLight.intensity = this.intensity * 1.4;
    // The warm fill pulses gently out of phase for a soft volumetric shimmer.
    this.warmLight.intensity = this.intensity * (0.9 + Math.sin(elapsed * 0.6) * 0.25);

    for (const d of this.drifters) {
      d.group.position.y = d.base.y + Math.sin(elapsed * 0.4 + d.phase) * 0.4;
      d.group.rotation.y += dt * 0.05;
    }

    // Emphasize the selected organelle with a gentle scale pulse.
    for (const p of this.pickables) {
      const isSel = p.pickId === this.selectedId;
      const target = isSel ? 1.18 : 1;
      const cur = p.group.scale.x;
      p.group.scale.setScalar(cur + (target - cur) * Math.min(1, dt * 5));
    }
  }

  getPickables(): THREE.Object3D[] {
    return this.intensity > 0.2 ? this.pickables.map((p) => p.group) : [];
  }

  dispose(): void {
    this.bump.dispose();
    disposeObject(this.root);
    // Free the shared anatomy detail maps bootstrapped by the builders. Per
    // material clones are freed above by disposeObject; this releases the
    // module level source textures once.
    disposeDetailTextures();
  }
}
