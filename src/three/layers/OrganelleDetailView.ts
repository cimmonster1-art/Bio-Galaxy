import * as THREE from 'three';
import { Scale } from '../../types';
import { SceneLayer, fadeMaterial } from '../core/SceneLayer';
import { disposeObject } from '../core/dispose';
import { objectsAtScale } from '../../data/registry';
import { cloneDetailTexture, getMuscleFibre, getTissueGrain } from '../textures/detailTextures';

/**
 * Local detail shown when the camera commits to the organelle scale. A patch of
 * inner membrane sits at the focus, ringed by pickable markers for the protein
 * complexes that live there. Selecting a marker is the bridge from organelle to
 * molecular scale, so the descent stays continuous.
 */
export class OrganelleDetailView implements SceneLayer {
  readonly root = new THREE.Group();
  readonly activeScales = [Scale.Organelle];

  private readonly markerMat: THREE.MeshPhysicalMaterial;
  private readonly markers: THREE.Mesh[] = [];
  private readonly membraneMat: THREE.MeshPhysicalMaterial;
  private intensity = 0;

  constructor() {
    this.root.name = 'OrganelleDetailView';
    this.root.position.set(14, 8, 6);
    this.root.visible = false;

    // A curved patch of inner membrane studded with embedded complexes. Real
    // anatomy detail maps drive the bump and roughness so the surface reads as
    // moist ribbed tissue at this close range; the physical material adds
    // transmission, clearcoat and sheen for the wet living look.
    const patchBump = cloneDetailTexture(getMuscleFibre(), 3);
    const patchRough = cloneDetailTexture(getTissueGrain(), 4);
    this.membraneMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#e0a64a'),
      emissive: new THREE.Color('#5a3a0a'),
      emissiveIntensity: 0.4,
      roughness: 0.5,
      roughnessMap: patchRough,
      bumpMap: patchBump,
      bumpScale: 0.18,
      transmission: 0.3,
      thickness: 1.4,
      ior: 1.34,
      clearcoat: 1,
      clearcoatRoughness: 0.3,
      sheen: 0.6,
      sheenColor: new THREE.Color('#ffe2a8'),
      attenuationColor: new THREE.Color('#a86a16'),
      attenuationDistance: 3,
      envMapIntensity: 1.2,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const patch = new THREE.Mesh(
      new THREE.SphereGeometry(3.2, 128, 128, 0, Math.PI * 1.2, 0, Math.PI * 0.7),
      this.membraneMat,
    );
    this.root.add(patch);

    this.markerMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#39d4e6'),
      emissive: new THREE.Color('#0c4d57'),
      emissiveIntensity: 0.6,
      roughness: 0.32,
      metalness: 0,
      transmission: 0.3,
      thickness: 0.8,
      ior: 1.36,
      clearcoat: 1,
      clearcoatRoughness: 0.2,
      sheen: 0.5,
      sheenColor: new THREE.Color('#bff4ff'),
      envMapIntensity: 1.2,
      transparent: true,
      opacity: 0,
    });

    const complexes = objectsAtScale(Scale.ProteinComplex);
    const geo = new THREE.IcosahedronGeometry(0.5, 3);
    complexes.forEach((obj, i) => {
      const marker = new THREE.Mesh(geo, this.markerMat);
      const a = (i / complexes.length) * Math.PI * 2;
      marker.position.set(Math.cos(a) * 2.6, 1.4, Math.sin(a) * 2.6);
      marker.userData.pick = { id: obj.id, scale: Scale.ProteinComplex };
      this.markers.push(marker);
      this.root.add(marker);
    });
  }

  onScaleChange(_scale: Scale, intensity: number): void {
    this.intensity = intensity;
    this.root.visible = intensity > 0.01;
  }

  update(dt: number, elapsed: number): void {
    fadeMaterial(this.membraneMat, this.intensity * 0.9, dt);
    fadeMaterial(this.markerMat, this.intensity, dt);
    this.root.rotation.y = elapsed * 0.1;
    this.markers.forEach((m, i) => {
      m.position.y = 1.4 + Math.sin(elapsed * 2 + i) * 0.2;
    });
  }

  getPickables(): THREE.Object3D[] {
    return this.intensity > 0.3 ? this.markers : [];
  }

  dispose(): void {
    disposeObject(this.root);
  }
}
