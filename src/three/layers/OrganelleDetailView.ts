import * as THREE from 'three';
import { Scale } from '../../types';
import { SceneLayer, fadeMaterial } from '../core/SceneLayer';
import { disposeObject } from '../core/dispose';
import { createBumpTexture } from '../textures/proceduralTextures';
import { objectsAtScale } from '../../data/registry';
import { Pickable, buildMitochondrion, buildNucleus, jellyRibosome } from './cell/builders';

/**
 * The organelle scale, shown as a detailed trio of the cell's signature
 * compartments — a cristae-folded mitochondrion, a pore-studded nucleus, and a
 * two-subunit ribosome — each large, wet-shaded, and individually selectable.
 * Protein-complex markers orbit the cluster as the bridge down to the molecular
 * scale, so the descent stays continuous.
 */
export class OrganelleDetailView implements SceneLayer {
  readonly root = new THREE.Group();
  readonly activeScales = [Scale.Organelle];

  private readonly bump: THREE.Texture;
  private readonly markerMat: THREE.MeshStandardMaterial;
  private readonly markers: THREE.Mesh[] = [];
  private readonly organelles: { group: THREE.Group; spin: number; bob: number; baseY: number }[] = [];
  private readonly fadeMats: { mat: THREE.Material & { opacity: number }; base: number }[] = [];
  private intensity = 0;

  constructor() {
    this.root.name = 'OrganelleDetailView';
    this.root.visible = false;
    this.bump = createBumpTexture(256, 0.08);

    const mito = buildMitochondrion(this.bump);
    mito.group.position.set(-9.5, 1, 0);
    mito.group.scale.setScalar(2.0);
    this.addOrganelle(mito, 0.18);

    const nucleus = buildNucleus(4.2, this.bump);
    nucleus.group.position.set(8.5, 0.5, -2);
    this.addOrganelle(nucleus, 0.12);

    const ribo = jellyRibosome(this.bump);
    ribo.group.position.set(-0.5, -7, 4);
    ribo.group.scale.setScalar(2.6);
    this.addOrganelle(ribo, 0.22);

    // Protein-complex markers: the descent bridge to the molecular scale.
    this.markerMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#39d4e6'),
      emissive: new THREE.Color('#0c4d57'),
      emissiveIntensity: 0.6,
      roughness: 0.4,
      transparent: true,
      opacity: 0,
    });
    this.trackMat(this.markerMat, 1);
    const complexes = objectsAtScale(Scale.ProteinComplex);
    const geo = new THREE.IcosahedronGeometry(0.6, 1);
    complexes.forEach((obj, i) => {
      const marker = new THREE.Mesh(geo, this.markerMat);
      const a = (i / Math.max(1, complexes.length)) * Math.PI * 2;
      marker.position.set(Math.cos(a) * 12, 6 + Math.sin(i) * 1.5, Math.sin(a) * 12);
      marker.userData.pick = { id: obj.id, scale: Scale.ProteinComplex };
      this.markers.push(marker);
      this.root.add(marker);
    });
  }

  /** Add a built organelle, collecting its materials so they fade with the scale. */
  private addOrganelle(p: Pickable, spin: number): void {
    p.group.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.material) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) this.trackMat(m as THREE.Material & { opacity: number });
    });
    this.root.add(p.group);
    this.organelles.push({ group: p.group, spin, bob: Math.random() * Math.PI * 2, baseY: p.group.position.y });
  }

  private trackMat(m: THREE.Material & { opacity: number }, base = m.opacity): void {
    m.transparent = true;
    m.opacity = 0;
    this.fadeMats.push({ mat: m, base });
  }

  onScaleChange(_scale: Scale, intensity: number): void {
    this.intensity = intensity;
    this.root.visible = intensity > 0.01;
  }

  update(dt: number, elapsed: number): void {
    for (const { mat, base } of this.fadeMats) fadeMaterial(mat, this.intensity * base, dt);
    for (const o of this.organelles) {
      o.group.rotation.y += dt * o.spin;
      o.group.position.y = o.baseY + Math.sin(elapsed * 0.5 + o.bob) * 0.4;
    }
    this.markers.forEach((m, i) => {
      m.position.y = 6 + Math.sin(elapsed * 2 + i) * 0.4;
    });
    this.root.rotation.y = elapsed * 0.04;
  }

  getPickables(): THREE.Object3D[] {
    if (this.intensity < 0.3) return [];
    return [...this.organelles.map((o) => o.group), ...this.markers];
  }

  dispose(): void {
    this.bump.dispose();
    disposeObject(this.root);
  }
}
