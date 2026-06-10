import * as THREE from 'three';
import { Scale } from '../../types';
import { SceneLayer, fadeMaterial } from '../core/SceneLayer';
import { disposeObject } from '../core/dispose';

/**
 * The cosmic backdrop: a luminous core standing in for the Big Bang and
 * galactic center, a deep field of distant galaxies, and a spiral galaxy that
 * resolves as the camera approaches the galaxy scale. Instanced throughout so
 * thousands of points cost only a couple of draw calls. Not pickable; it sets
 * the stage above the solar system.
 */
export class CosmosLayer implements SceneLayer {
  readonly root = new THREE.Group();
  readonly activeScales = [Scale.Cosmos, Scale.Galaxy];

  private readonly field: THREE.InstancedMesh;
  private readonly fieldMat: THREE.MeshBasicMaterial;
  private readonly spiral: THREE.InstancedMesh;
  private readonly spiralMat: THREE.MeshBasicMaterial;
  private readonly core: THREE.Mesh;
  private readonly coreMat: THREE.MeshBasicMaterial;

  private intensity = 0;
  private currentScale: Scale = Scale.Cosmos;

  constructor() {
    this.root.name = 'CosmosLayer';
    this.root.visible = false;

    // Bright core: the Big Bang origin and, later, the galactic center.
    this.coreMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#fff1d6'),
      transparent: true,
      opacity: 0,
    });
    this.core = new THREE.Mesh(new THREE.SphereGeometry(6, 32, 32), this.coreMat);
    this.root.add(this.core);

    // Deep field of distant galaxies.
    const fieldCount = 1800;
    this.fieldMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0 });
    this.field = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.7, 0), this.fieldMat, fieldCount);
    this.field.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(fieldCount * 3), 3);
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    for (let i = 0; i < fieldCount; i++) {
      const dir = randomDir();
      const r = 90 + Math.random() * 460;
      dummy.position.copy(dir.multiplyScalar(r));
      dummy.scale.setScalar(0.5 + Math.random() * 2.4);
      dummy.updateMatrix();
      this.field.setMatrixAt(i, dummy.matrix);
      color.setHSL((200 + Math.random() * 120) / 360, 0.5, 0.55 + Math.random() * 0.3);
      this.field.setColorAt(i, color);
    }
    this.field.instanceMatrix.needsUpdate = true;
    this.root.add(this.field);

    // Spiral galaxy that resolves near the galaxy scale.
    const spiralCount = 4200;
    this.spiralMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0 });
    this.spiral = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.4, 0), this.spiralMat, spiralCount);
    this.spiral.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(spiralCount * 3), 3);
    const warm = new THREE.Color('#ffe7b3');
    const cool = new THREE.Color('#8fbfff');
    for (let i = 0; i < spiralCount; i++) {
      const t = i / spiralCount;
      const arm = i % 2 === 0 ? 0 : Math.PI;
      const radius = 8 + t * 130;
      const angle = arm + t * 9 + (Math.random() - 0.5) * 0.5;
      const spread = (1 - t) * 4 + 1.5;
      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * spread;
      const z = Math.sin(angle) * radius + (Math.random() - 0.5) * spread;
      const y = (Math.random() - 0.5) * (3 + (1 - t) * 8);
      dummy.position.set(x, y, z);
      dummy.scale.setScalar(0.75 + Math.random() * 1.65);
      dummy.updateMatrix();
      this.spiral.setMatrixAt(i, dummy.matrix);
      color.copy(cool).lerp(warm, Math.max(0, 1 - t * 1.6));
      this.spiral.setColorAt(i, color);
    }
    this.spiral.instanceMatrix.needsUpdate = true;
    this.root.add(this.spiral);
  }

  onScaleChange(scale: Scale, intensity: number): void {
    this.currentScale = scale;
    this.intensity = intensity;
    this.root.visible = intensity > 0.01;
  }

  update(dt: number, elapsed: number): void {
    const galaxyWeight = this.currentScale >= Scale.Galaxy ? 1 : 0.32;
    // Pull the deep field back at galaxy scale so the Milky Way remains legible.
    const fieldWeight = this.currentScale === Scale.Cosmos ? 0.72 : 0.12;
    fadeMaterial(this.coreMat, this.intensity, dt);
    fadeMaterial(this.fieldMat, this.intensity * fieldWeight, dt);
    fadeMaterial(this.spiralMat, this.intensity * galaxyWeight, dt);

    this.spiral.rotation.y = elapsed * 0.02;
    this.field.rotation.y = elapsed * 0.004;
    const pulse = 1 + Math.sin(elapsed * 1.5) * 0.05;
    this.core.scale.setScalar(pulse);
  }

  getPickables(): THREE.Object3D[] {
    return [];
  }

  dispose(): void {
    disposeObject(this.root);
  }
}

function randomDir(): THREE.Vector3 {
  const u = Math.random();
  const v = Math.random();
  const theta = u * Math.PI * 2;
  const phi = Math.acos(2 * v - 1);
  return new THREE.Vector3(
    Math.sin(phi) * Math.cos(theta),
    Math.sin(phi) * Math.sin(theta),
    Math.cos(phi),
  );
}
