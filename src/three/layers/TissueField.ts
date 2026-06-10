import * as THREE from 'three';
import { Scale } from '../../types';
import { SceneLayer, fadeMaterial } from '../core/SceneLayer';
import { disposeObject } from '../core/dispose';
import { createBumpTexture } from '../textures/proceduralTextures';
import { cloneDetailTexture, getMuscleFibre, getTissueGrain } from '../textures/detailTextures';

/**
 * A slab of living tissue: cells packed in three jittered layers, each a
 * translucent, wet-looking jelly membrane wrapped around a darker nucleus. The
 * membranes use a physical clearcoat material with a procedural bump map and the
 * scene environment for reflections, so the tissue reads as a moist 3D sheet
 * rather than a grid of plain spheres. Instanced for performance.
 */
export class TissueField implements SceneLayer {
  readonly root = new THREE.Group();
  readonly activeScales = [Scale.Tissue];

  private readonly cells: THREE.InstancedMesh;
  private readonly cellMat: THREE.MeshPhysicalMaterial;
  private readonly nuclei: THREE.InstancedMesh;
  private readonly nucleusMat: THREE.MeshStandardMaterial;
  private readonly fill: THREE.PointLight;
  private readonly bump: THREE.Texture;
  private readonly basePositions: THREE.Vector3[] = [];
  private readonly baseScales: number[] = [];
  private readonly phases: number[] = [];
  private intensity = 0;

  constructor() {
    this.root.name = 'TissueField';
    this.root.visible = false;

    this.bump = createBumpTexture(256, 0.08);

    // Build a jittered, slightly domed lattice of cell centers.
    const cols = 7;
    const rows = 5;
    const depth = 3;
    const spacing = 4.2;
    const dummy = new THREE.Object3D();

    // Real anatomy maps: tissue grain drives the cell skin roughness and bump,
    // muscle fibre lends the nucleus a chromatin-like striation. They tile over
    // the instanced spheres so each cell reads as moist, pored living tissue.
    const cellGrain = cloneDetailTexture(getTissueGrain(), 2);
    const cellRough = cloneDetailTexture(getTissueGrain(), 2);
    const nucleusFibre = cloneDetailTexture(getMuscleFibre(), 1.5);

    this.cellMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#2f93b0'),
      roughness: 0.22,
      roughnessMap: cellRough,
      metalness: 0,
      transmission: 0.58,
      thickness: 2.4,
      ior: 1.35,
      clearcoat: 1,
      clearcoatRoughness: 0.22,
      iridescence: 0.3,
      iridescenceIOR: 1.3,
      sheen: 0.6,
      sheenRoughness: 0.45,
      sheenColor: new THREE.Color('#a6ecf6'),
      attenuationColor: new THREE.Color('#0f5a6e'),
      attenuationDistance: 6,
      bumpMap: cellGrain,
      bumpScale: 0.14,
      transparent: true,
      opacity: 0,
      envMapIntensity: 1.3,
    });

    this.nucleusMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#1f3f63'),
      roughness: 0.5,
      metalness: 0,
      emissive: new THREE.Color('#10243c'),
      emissiveIntensity: 0.5,
      bumpMap: nucleusFibre,
      bumpScale: 0.12,
      transparent: true,
      opacity: 0,
      envMapIntensity: 1.1,
    });

    const count = cols * rows * depth;
    this.cells = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 64, 48), this.cellMat, count);
    this.nuclei = new THREE.InstancedMesh(new THREE.SphereGeometry(0.42, 40, 32), this.nucleusMat, count);
    this.cells.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);

    const tint = new THREE.Color();
    let i = 0;
    for (let z = 0; z < depth; z++) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const jitter = () => (Math.random() - 0.5) * spacing * 0.35;
          const x = (c - (cols - 1) / 2) * spacing + jitter() + (r % 2) * spacing * 0.5;
          const y = (r - (rows - 1) / 2) * spacing + jitter();
          // Gentle dome plus per-layer depth so the slab has real thickness.
          const dome = -(x * x + y * y) * 0.012;
          const zz = (z - (depth - 1) / 2) * spacing * 0.9 + dome + jitter() * 0.4;
          const pos = new THREE.Vector3(x, y, zz);
          const s = 1.5 + Math.random() * 0.7;
          this.basePositions.push(pos);
          this.baseScales.push(s);
          this.phases.push(Math.random() * Math.PI * 2);

          dummy.position.copy(pos);
          dummy.scale.setScalar(s);
          dummy.rotation.set(Math.random(), Math.random(), Math.random());
          dummy.updateMatrix();
          this.cells.setMatrixAt(i, dummy.matrix);

          dummy.scale.setScalar(s);
          dummy.updateMatrix();
          this.nuclei.setMatrixAt(i, dummy.matrix);

          tint.setHSL(0.52 + Math.random() * 0.06, 0.5, 0.5 + Math.random() * 0.12);
          this.cells.setColorAt(i, tint);
          i++;
        }
      }
    }
    this.cells.instanceMatrix.needsUpdate = true;
    this.nuclei.instanceMatrix.needsUpdate = true;
    if (this.cells.instanceColor) this.cells.instanceColor.needsUpdate = true;

    this.root.add(this.cells);
    this.root.add(this.nuclei);

    // A soft warm fill from within gives the slab translucent depth.
    this.fill = new THREE.PointLight(0x6fd6e6, 0, 60, 1.6);
    this.fill.position.set(0, 0, -6);
    this.root.add(this.fill);
  }

  onScaleChange(_scale: Scale, intensity: number): void {
    this.intensity = intensity;
    this.root.visible = intensity > 0.01;
  }

  update(dt: number, elapsed: number): void {
    fadeMaterial(this.cellMat, this.intensity * 0.92, dt);
    fadeMaterial(this.nucleusMat, this.intensity * 0.95, dt);
    this.fill.intensity = this.intensity * 1.6;
    if (this.intensity < 0.02) return;

    // A slow breathing pulse keeps the tissue feeling alive without churn.
    const dummy = new THREE.Object3D();
    for (let i = 0; i < this.basePositions.length; i++) {
      const base = this.basePositions[i];
      const s = this.baseScales[i] * (1 + Math.sin(elapsed * 0.9 + this.phases[i]) * 0.04);
      dummy.position.copy(base);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      this.cells.setMatrixAt(i, dummy.matrix);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      this.nuclei.setMatrixAt(i, dummy.matrix);
    }
    this.cells.instanceMatrix.needsUpdate = true;
    this.nuclei.instanceMatrix.needsUpdate = true;
  }

  getPickables(): THREE.Object3D[] {
    return [];
  }

  dispose(): void {
    this.bump.dispose();
    disposeObject(this.root);
  }
}
