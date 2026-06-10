import * as THREE from 'three';
import { Scale } from '../../types';
import { TAXON_GROUPS, TaxonGroup } from '../../data/organisms';
import { SceneLayer, fadeMaterial } from '../core/SceneLayer';
import { disposeObject } from '../core/dispose';

/**
 * The zoomed-out universe of life. Each taxon group is rendered as a
 * constellation: a dense instanced cloud of faint nodes plus a small set of
 * pickable anchor spheres for its representative species.
 *
 * Instancing keeps thousands of nodes to a single draw call. The architecture
 * is database ready: TAXON_GROUPS could be replaced by a paginated taxonomy
 * API without touching this geometry code.
 */
export class OrganismField implements SceneLayer {
  readonly root = new THREE.Group();
  readonly activeScales = [Scale.Universe, Scale.Taxonomy, Scale.Organism];

  private readonly cloud: THREE.InstancedMesh;
  private readonly cloudMat: THREE.MeshBasicMaterial;
  private readonly anchorMat: THREE.MeshBasicMaterial;
  private readonly anchors: THREE.Mesh[] = [];
  private readonly centers: THREE.Vector3[] = [];
  private intensity = 0;

  constructor() {
    this.root.name = 'OrganismField';

    const perGroup = 320;
    const total = TAXON_GROUPS.length * perGroup;
    const cloudGeo = new THREE.IcosahedronGeometry(0.5, 0);
    this.cloudMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
    this.cloud = new THREE.InstancedMesh(cloudGeo, this.cloudMat, total);
    this.cloud.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(total * 3),
      3,
    );

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    let i = 0;

    TAXON_GROUPS.forEach((group, gi) => {
      const center = constellationCenter(gi, TAXON_GROUPS.length);
      this.centers.push(center);
      color.setHSL(group.hue / 360, 0.6, 0.6);

      for (let n = 0; n < perGroup; n++) {
        const p = sampleInShell(center, 6 + Math.random() * 26);
        dummy.position.copy(p);
        const s = 0.25 + Math.random() * 0.7;
        dummy.scale.setScalar(s);
        dummy.updateMatrix();
        this.cloud.setMatrixAt(i, dummy.matrix);
        const j = 0.75 + Math.random() * 0.25;
        this.cloud.setColorAt(i, color.clone().multiplyScalar(j));
        i++;
      }

      this.addAnchors(group, center);
    });

    this.cloud.instanceMatrix.needsUpdate = true;
    this.root.add(this.cloud);

    this.anchorMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
  }

  private addAnchors(group: TaxonGroup, center: THREE.Vector3): void {
    const geo = new THREE.SphereGeometry(1.1, 16, 16);
    const color = new THREE.Color().setHSL(group.hue / 360, 0.7, 0.62);
    group.representatives.forEach((_, i) => {
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0,
      });
      const mesh = new THREE.Mesh(geo, mat);
      const angle = (i / group.representatives.length) * Math.PI * 2;
      mesh.position
        .copy(center)
        .add(new THREE.Vector3(Math.cos(angle) * 5, Math.sin(angle) * 5, i * 1.5));
      mesh.userData.pick = { id: `organism:${group.id}:${i}`, scale: Scale.Organism };
      mesh.userData.taxon = { id: `taxon:${group.id}`, scale: Scale.Taxonomy };
      this.anchors.push(mesh);
      this.root.add(mesh);
    });
  }

  onScaleChange(scale: Scale, intensity: number): void {
    this.intensity = intensity;
    // At the Organism scale the field thins out as the camera commits to a body.
    if (scale === Scale.Organism) this.intensity *= 0.5;
  }

  update(dt: number, elapsed: number): void {
    this.root.rotation.y = elapsed * 0.015;
    fadeMaterial(this.cloudMat, this.intensity * 0.85, dt);
    const anchorTarget = this.intensity > 0 ? 1 : 0;
    for (const a of this.anchors) {
      fadeMaterial(a.material as THREE.MeshBasicMaterial, anchorTarget, dt);
      const pulse = 1 + Math.sin(elapsed * 2 + a.position.x) * 0.08;
      a.scale.setScalar(pulse);
    }
  }

  getPickables(): THREE.Object3D[] {
    return this.intensity > 0.2 ? this.anchors : [];
  }

  dispose(): void {
    disposeObject(this.root);
  }
}

function constellationCenter(index: number, count: number): THREE.Vector3 {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - (index / (count - 1)) * 2;
  const radius = Math.sqrt(1 - y * y);
  const theta = golden * index;
  return new THREE.Vector3(
    Math.cos(theta) * radius,
    y,
    Math.sin(theta) * radius,
  ).multiplyScalar(60);
}

function sampleInShell(center: THREE.Vector3, radius: number): THREE.Vector3 {
  const u = Math.random();
  const v = Math.random();
  const theta = u * Math.PI * 2;
  const phi = Math.acos(2 * v - 1);
  const r = radius * Math.cbrt(Math.random());
  return new THREE.Vector3(
    center.x + r * Math.sin(phi) * Math.cos(theta),
    center.y + r * Math.sin(phi) * Math.sin(theta),
    center.z + r * Math.cos(phi),
  );
}
