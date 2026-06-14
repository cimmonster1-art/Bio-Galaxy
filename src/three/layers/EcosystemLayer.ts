import * as THREE from 'three';
import { Scale, PickTag } from '../../types';
import { SceneLayer, fadeMaterial } from '../core/SceneLayer';
import { disposeObject } from '../core/dispose';

/**
 * Ecosystem — zoom into a functioning living network. Producers, animals, fungi,
 * and environmental structures hang in space as glowing nodes, wired together by
 * the ecological relationships that actually connect them: pollination paths,
 * food chains, nutrient flow, and migration routes. Each relationship is a
 * curved tube with light visibly travelling along it, so the message reads
 * instantly — this is where life interacts.
 *
 * Picking an organism node locks the journey onto that organism and descends to
 * the Organism scale; the structural nodes simply inform the detail panel.
 */

type NodeKind = 'producer' | 'animal' | 'fungi' | 'environment' | 'organism';
type Relationship = 'pollination' | 'food' | 'nutrient' | 'migration';

interface EcoNode {
  id: string;
  kind: NodeKind;
  position: [number, number, number];
  radius: number;
}

interface EcoEdge {
  from: string;
  to: string;
  rel: Relationship;
}

const KIND_COLOR: Record<NodeKind, number> = {
  producer: 0x4fc36a,
  animal: 0x39d6e6,
  fungi: 0xc07bff,
  environment: 0x6a8499,
  organism: 0x8ff0ff,
};

const REL_COLOR: Record<Relationship, number> = {
  pollination: 0xffd35a,
  food: 0xff6a5a,
  nutrient: 0x6affb0,
  migration: 0x5ab8ff,
};

const NODES: EcoNode[] = [
  { id: 'sun', kind: 'environment', position: [0, 26, -10], radius: 2.6 },
  { id: 'canopy', kind: 'producer', position: [-18, 10, 6], radius: 2.2 },
  { id: 'flowering', kind: 'producer', position: [10, 4, 14], radius: 1.8 },
  { id: 'pollinator', kind: 'animal', position: [18, 12, 0], radius: 1.4 },
  { id: 'herbivore', kind: 'animal', position: [-6, -4, 18], radius: 1.9 },
  { id: 'predator', kind: 'organism', position: [4, 2, -2], radius: 2.4 },
  { id: 'decomposer', kind: 'fungi', position: [-14, -10, -8], radius: 1.6 },
  { id: 'soil', kind: 'environment', position: [0, -16, 6], radius: 2.0 },
  { id: 'migratory', kind: 'animal', position: [22, -2, -16], radius: 1.7 },
];

const EDGES: EcoEdge[] = [
  { from: 'sun', to: 'canopy', rel: 'nutrient' },
  { from: 'sun', to: 'flowering', rel: 'nutrient' },
  { from: 'flowering', to: 'pollinator', rel: 'pollination' },
  { from: 'pollinator', to: 'canopy', rel: 'pollination' },
  { from: 'canopy', to: 'herbivore', rel: 'food' },
  { from: 'flowering', to: 'herbivore', rel: 'food' },
  { from: 'herbivore', to: 'predator', rel: 'food' },
  { from: 'predator', to: 'decomposer', rel: 'food' },
  { from: 'decomposer', to: 'soil', rel: 'nutrient' },
  { from: 'soil', to: 'canopy', rel: 'nutrient' },
  { from: 'predator', to: 'migratory', rel: 'migration' },
  { from: 'migratory', to: 'herbivore', rel: 'migration' },
];

const flowVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const flowFragment = /* glsl */ `
  precision highp float;
  uniform float uTime; uniform float uOpacity; uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    // A steady core line with two bright pulses travelling along the tube.
    float base = 0.18;
    float p1 = smoothstep(0.06, 0.0, abs(fract(vUv.x - uTime * 0.35) - 0.5) - 0.0);
    float pulse = pow(max(0.0, 1.0 - abs(fract(vUv.x * 1.0 - uTime * 0.4) - 0.5) * 6.0), 3.0);
    float pulse2 = pow(max(0.0, 1.0 - abs(fract(vUv.x * 1.0 - uTime * 0.4 - 0.5) - 0.5) * 6.0), 3.0);
    float a = (base + pulse + pulse2 * 0.7) * uOpacity;
    gl_FragColor = vec4(uColor * (0.6 + pulse + pulse2), a);
  }
`;

export class EcosystemLayer implements SceneLayer {
  readonly root = new THREE.Group();
  readonly activeScales = [Scale.Ecosystem];

  private intensity = 0;
  private readonly nodeMeshes: THREE.Mesh[] = [];
  private readonly nodeMats: THREE.MeshStandardMaterial[] = [];
  private readonly haloMats: THREE.MeshBasicMaterial[] = [];
  private readonly edgeMats: THREE.ShaderMaterial[] = [];
  private readonly fadeables: (THREE.Material & { opacity: number })[] = [];
  private readonly nodeIndex = new Map<string, THREE.Vector3>();

  constructor() {
    this.root.name = 'EcosystemLayer';
    this.root.visible = false;

    for (const node of NODES) this.nodeIndex.set(node.id, new THREE.Vector3(...node.position));

    // ── Relationship edges (curved, with light travelling along them) ───────
    for (const edge of EDGES) {
      const a = this.nodeIndex.get(edge.from);
      const b = this.nodeIndex.get(edge.to);
      if (!a || !b) continue;
      const mid = a.clone().add(b).multiplyScalar(0.5);
      // Bow each edge outward from the centre so crossings stay legible.
      mid.add(mid.clone().normalize().multiplyScalar(4)).add(new THREE.Vector3(0, 2, 0));
      const curve = new THREE.CatmullRomCurve3([a, mid, b]);
      const geo = new THREE.TubeGeometry(curve, 40, 0.16, 8, false);
      const mat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: Math.random() * 10 },
          uOpacity: { value: 0 },
          uColor: { value: new THREE.Color(REL_COLOR[edge.rel]) },
        },
        vertexShader: flowVertex,
        fragmentShader: flowFragment,
      });
      const tube = new THREE.Mesh(geo, mat);
      tube.frustumCulled = false;
      this.edgeMats.push(mat);
      this.root.add(tube);
    }

    // ── Nodes (glowing organic cells of the network) ────────────────────────
    for (const node of NODES) {
      const color = KIND_COLOR[node.kind];
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.55,
        roughness: 0.4,
        metalness: 0.0,
        transparent: true,
        opacity: 0,
        envMapIntensity: 0.8,
      });
      const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(node.radius, 2), mat);
      mesh.position.set(...node.position);
      const isOrganism = node.kind === 'organism' || node.kind === 'animal';
      mesh.userData.pick = isOrganism
        ? { id: `organism:${node.id}`, scale: Scale.Organism }
        : { id: `ecosystem:${node.id}`, scale: Scale.Ecosystem };
      this.nodeMeshes.push(mesh);
      this.nodeMats.push(mat);
      this.fadeables.push(mat);
      this.root.add(mesh);

      // Soft additive halo so each node reads as alive under bloom.
      const haloMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.BackSide,
      });
      const halo = new THREE.Mesh(new THREE.SphereGeometry(node.radius * 1.6, 16, 16), haloMat);
      halo.position.set(...node.position);
      this.haloMats.push(haloMat);
      this.fadeables.push(haloMat);
      this.root.add(halo);
    }
  }

  onScaleChange(_scale: Scale, intensity: number): void {
    this.intensity = intensity;
    this.root.visible = intensity > 0.01;
  }

  update(dt: number, elapsed: number): void {
    for (const mat of this.edgeMats) {
      mat.uniforms.uTime.value += dt;
      mat.uniforms.uOpacity.value += (this.intensity - mat.uniforms.uOpacity.value) * Math.min(1, dt * 6);
    }
    for (const mat of this.nodeMats) fadeMaterial(mat, this.intensity, dt);
    this.haloMats.forEach((mat, i) => {
      const pulse = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(elapsed * 1.2 + i));
      fadeMaterial(mat, this.intensity * 0.4 * pulse, dt);
    });
    // Gentle node bob so the network feels alive.
    this.nodeMeshes.forEach((mesh, i) => {
      mesh.rotation.y += dt * 0.2;
      mesh.position.y = NODES[i].position[1] + Math.sin(elapsed * 0.8 + i) * 0.4;
    });
    this.root.rotation.y += dt * 0.02;
  }

  getPickables(): THREE.Object3D[] {
    return this.intensity > 0.3 ? this.nodeMeshes : [];
  }

  static tagFor(id: string): PickTag | null {
    const key = id.replace(/^ecosystem:|^organism:/, '');
    return NODES.some((n) => n.id === key)
      ? { id, scale: id.startsWith('organism:') ? Scale.Organism : Scale.Ecosystem }
      : null;
  }

  dispose(): void {
    disposeObject(this.root);
  }
}

export const ECOSYSTEM_NODE_IDS = NODES.map((n) => n.id);
