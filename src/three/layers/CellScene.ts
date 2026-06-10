import * as THREE from 'three';
import { Scale } from '../../types';
import { SceneLayer, fadeMaterial } from '../core/SceneLayer';
import { disposeObject } from '../core/dispose';
import {
  Pickable,
  buildCytoskeleton,
  buildER,
  buildGolgi,
  buildMembrane,
  buildMitochondrion,
  buildNucleus,
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
  private intensity = 0;
  private selectedId: string | null = null;

  constructor() {
    this.root.name = 'CellScene';
    this.root.visible = false;

    this.membrane = buildMembrane(this.radius);
    this.root.add(this.membrane);

    const nucleus = buildNucleus(5.5);
    this.place(nucleus, new THREE.Vector3(0, 0, 0));

    const er = buildER(5.5);
    this.place(er, new THREE.Vector3(0, 0, 0));

    // Scatter the discrete organelles around the cytoplasm.
    this.placeMany(buildMitochondrion, 4, 10);
    this.place(buildGolgi(), new THREE.Vector3(-9, -4, 3));
    this.place(buildCytoskeleton(this.radius), new THREE.Vector3(0, 0, 0));

    this.vesicles = buildVesicles(60, this.radius);
    this.place(this.vesicles, new THREE.Vector3(0, 0, 0));

    this.place(buildRibosomes(90, this.radius), new THREE.Vector3(0, 0, 0));
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
    fadeMaterial(this.membrane.material as THREE.MeshPhysicalMaterial, this.intensity * 0.12, dt);

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
    disposeObject(this.root);
  }
}
