import * as THREE from 'three';
import { Scale } from '../../types';
import { SceneLayer, fadeMaterial } from '../core/SceneLayer';
import { disposeObject } from '../core/dispose';

/**
 * The transitional anatomy scales: organ system, organ, and tissue. Rendered as
 * a packed sheet of cells so the descent from a whole body into a single cell
 * reads continuously. Cells are a single InstancedMesh for performance, with a
 * subtle outer membrane sheen.
 */
export class TissueField implements SceneLayer {
  readonly root = new THREE.Group();
  readonly activeScales = [Scale.OrganSystem, Scale.Organ, Scale.Tissue];

  private readonly cells: THREE.InstancedMesh;
  private readonly cellMat: THREE.MeshStandardMaterial;
  private readonly phases: Float32Array;
  private readonly basePositions: THREE.Vector3[] = [];
  private intensity = 0;

  constructor() {
    this.root.name = 'TissueField';

    const cols = 11;
    const rows = 8;
    const count = cols * rows;
    this.phases = new Float32Array(count);

    const geo = new THREE.SphereGeometry(1, 18, 18);
    this.cellMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#1f6f8b'),
      emissive: new THREE.Color('#0a3a4a'),
      roughness: 0.35,
      metalness: 0.1,
      transparent: true,
      opacity: 0,
    });
    this.cells = new THREE.InstancedMesh(geo, this.cellMat, count);

    const dummy = new THREE.Object3D();
    const spacing = 2.4;
    let i = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = (c - (cols - 1) / 2) * spacing + (r % 2) * spacing * 0.5;
        const y = (r - (rows - 1) / 2) * spacing;
        const z = (Math.random() - 0.5) * 1.5;
        const pos = new THREE.Vector3(x, y, z);
        this.basePositions.push(pos);
        this.phases[i] = Math.random() * Math.PI * 2;
        dummy.position.copy(pos);
        dummy.scale.setScalar(0.9 + Math.random() * 0.25);
        dummy.updateMatrix();
        this.cells.setMatrixAt(i, dummy.matrix);
        i++;
      }
    }
    this.cells.instanceMatrix.needsUpdate = true;
    this.root.add(this.cells);
  }

  onScaleChange(_scale: Scale, intensity: number): void {
    this.intensity = intensity;
  }

  update(dt: number, elapsed: number): void {
    fadeMaterial(this.cellMat, this.intensity * 0.95, dt);
    if (this.intensity < 0.02) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < this.basePositions.length; i++) {
      const base = this.basePositions[i];
      dummy.position.set(
        base.x,
        base.y,
        base.z + Math.sin(elapsed * 0.8 + this.phases[i]) * 0.25,
      );
      const s = 0.9 + Math.sin(elapsed + this.phases[i]) * 0.05;
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      this.cells.setMatrixAt(i, dummy.matrix);
    }
    this.cells.instanceMatrix.needsUpdate = true;
  }

  getPickables(): THREE.Object3D[] {
    return [];
  }

  dispose(): void {
    disposeObject(this.root);
  }
}
