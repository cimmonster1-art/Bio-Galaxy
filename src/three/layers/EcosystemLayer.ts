import * as THREE from 'three';
import { Scale, PickTag } from '../../types';
import { SceneLayer, fadeMaterial } from '../core/SceneLayer';
import { disposeObject } from '../core/dispose';
import { loadGlb, fitModel, WILDLIFE_MODELS } from '../core/glbLoader';

/**
 * Ecosystem — a functioning food web, not a systems diagram. Species sit in
 * vertical trophic strata (producers low, herbivores mid, predators high,
 * decomposers below ground), each with real identity: open-source animal models
 * for the fauna and procedural plants, fungi, and microbes for the rest. Node
 * size encodes biomass, and every relationship is a colour-coded flowing tube —
 * gold pollination, red predation/grazing, blue nutrient cycling, green
 * mutualism — so the web reads as ecology you can actually learn from.
 */

type NodeKind = 'producer' | 'animal' | 'fungi' | 'bacteria' | 'environment';
type Relationship = 'pollination' | 'predation' | 'nutrient' | 'mutualism';

interface EcoNode {
  id: string;        // resolves to a registered ecosystem:/organism: record
  kind: NodeKind;
  pos: [number, number, number];
  biomass: number;   // node size / dominance
  model?: keyof typeof WILDLIFE_MODELS; // real GLB for fauna
  color: number;
}

interface EcoEdge { from: string; to: string; rel: Relationship; }

const REL_COLOR: Record<Relationship, number> = {
  pollination: 0xffd35a,
  predation: 0xff6a5a,
  nutrient: 0x5ab8ff,
  mutualism: 0x6affb0,
};

// Trophic strata are encoded directly in the Y positions: sun and predators high,
// consumers in the middle, producers low, and decomposers/soil below ground.
const NODES: EcoNode[] = [
  { id: 'sun', kind: 'environment', pos: [0, 26, -6], biomass: 2.4, color: 0xffe39a },
  { id: 'predator', kind: 'animal', pos: [2, 12, 0], biomass: 2.2, model: 'wolf', color: 0x8ff0ff },
  { id: 'pollinator', kind: 'animal', pos: [16, 7, 4], biomass: 1.0, model: 'bird', color: 0x9ff0c0 },
  { id: 'herbivore', kind: 'animal', pos: [-12, 3, 5], biomass: 2.0, model: 'deer', color: 0x39d6e6 },
  { id: 'canopy', kind: 'producer', pos: [-16, -6, -2], biomass: 2.6, color: 0x3f9d54 },
  { id: 'flowering', kind: 'producer', pos: [12, -5, 8], biomass: 1.4, color: 0x6fc34a },
  { id: 'grass', kind: 'producer', pos: [0, -8, 14], biomass: 1.1, color: 0x7fcf5a },
  { id: 'fungus', kind: 'fungi', pos: [-10, -13, -6], biomass: 1.2, color: 0xc07bff },
  { id: 'bacteria', kind: 'bacteria', pos: [8, -14, -4], biomass: 0.8, color: 0xb6ff7b },
  { id: 'soil', kind: 'environment', pos: [0, -17, 4], biomass: 2.0, color: 0x6a5440 },
];

const EDGES: EcoEdge[] = [
  // Energy / nutrient input.
  { from: 'sun', to: 'canopy', rel: 'nutrient' },
  { from: 'sun', to: 'flowering', rel: 'nutrient' },
  { from: 'sun', to: 'grass', rel: 'nutrient' },
  // Grazing (herbivory) — a form of predation up the chain.
  { from: 'canopy', to: 'herbivore', rel: 'predation' },
  { from: 'grass', to: 'herbivore', rel: 'predation' },
  // Predation.
  { from: 'herbivore', to: 'predator', rel: 'predation' },
  // Pollination + the mutualism that returns the favour.
  { from: 'flowering', to: 'pollinator', rel: 'pollination' },
  { from: 'pollinator', to: 'flowering', rel: 'mutualism' },
  // Death and decomposition returning nutrients to the soil.
  { from: 'predator', to: 'fungus', rel: 'nutrient' },
  { from: 'herbivore', to: 'fungus', rel: 'nutrient' },
  { from: 'fungus', to: 'soil', rel: 'nutrient' },
  { from: 'bacteria', to: 'soil', rel: 'nutrient' },
  { from: 'soil', to: 'canopy', rel: 'nutrient' },
  { from: 'soil', to: 'grass', rel: 'nutrient' },
];

const flowVertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const flowFragment = /* glsl */ `
  precision highp float;
  uniform float uTime; uniform float uOpacity; uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    float base = 0.16;
    float pulse = pow(max(0.0, 1.0 - abs(fract(vUv.x - uTime * 0.35) - 0.5) * 6.0), 3.0);
    float pulse2 = pow(max(0.0, 1.0 - abs(fract(vUv.x - uTime * 0.35 - 0.5) - 0.5) * 6.0), 3.0);
    float a = (base + pulse + pulse2 * 0.7) * uOpacity;
    gl_FragColor = vec4(uColor * (0.55 + pulse + pulse2), a);
  }
`;

export class EcosystemLayer implements SceneLayer {
  readonly root = new THREE.Group();
  readonly activeScales = [Scale.Ecosystem];

  private intensity = 0;
  private readonly nodeGroups: { group: THREE.Group; node: EcoNode; baseY: number }[] = [];
  private readonly edgeMats: THREE.ShaderMaterial[] = [];
  private readonly fadeables: (THREE.Material & { opacity: number })[] = [];
  private readonly loadedRoots: THREE.Object3D[] = [];
  private readonly index = new Map<string, THREE.Vector3>();

  constructor() {
    this.root.name = 'EcosystemLayer';
    this.root.visible = false;

    for (const n of NODES) this.index.set(n.id, new THREE.Vector3(...n.pos));

    // Faint trophic-level guide planes so the vertical strata read clearly.
    for (const [y, c] of [[12, 0xff6a5a], [3, 0x39d6e6], [-6, 0x3f9d54], [-15, 0x6a5440]] as const) {
      const mat = this.track(new THREE.MeshBasicMaterial({
        color: c, transparent: true, opacity: 0, side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }), 0.05);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(26, 48), mat);
      disc.rotation.x = -Math.PI / 2;
      disc.position.y = y;
      this.root.add(disc);
    }

    this.buildEdges();
    this.buildNodes();
  }

  private track<T extends THREE.Material & { opacity: number }>(mat: T, _w?: number): T {
    mat.transparent = true; mat.opacity = 0;
    this.fadeables.push(mat);
    return mat;
  }

  private buildEdges(): void {
    for (const edge of EDGES) {
      const a = this.index.get(edge.from);
      const b = this.index.get(edge.to);
      if (!a || !b) continue;
      const mid = a.clone().add(b).multiplyScalar(0.5);
      mid.add(new THREE.Vector3((Math.random() - 0.5) * 4, 0, (Math.random() - 0.5) * 4));
      const curve = new THREE.CatmullRomCurve3([a, mid, b]);
      const geo = new THREE.TubeGeometry(curve, 44, 0.14, 8, false);
      const mat = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: Math.random() * 10 },
          uOpacity: { value: 0 },
          uColor: { value: new THREE.Color(REL_COLOR[edge.rel]) },
        },
        vertexShader: flowVertex, fragmentShader: flowFragment,
      });
      const tube = new THREE.Mesh(geo, mat);
      tube.frustumCulled = false;
      this.edgeMats.push(mat);
      this.root.add(tube);
    }
  }

  private buildNodes(): void {
    for (const node of NODES) {
      const group = new THREE.Group();
      group.position.set(...node.pos);
      const isAnimal = node.kind === 'animal';
      group.userData.pick = isAnimal
        ? { id: `organism:${node.id}`, scale: Scale.Organism }
        : { id: `ecosystem:${node.id}`, scale: Scale.Ecosystem };

      // Procedural silhouette stands in immediately; real models swap in on load.
      const proc = this.buildSilhouette(node);
      group.add(proc);

      // Soft biomass halo — bigger species glow larger, grounding the network.
      const haloMat = this.track(new THREE.MeshBasicMaterial({
        color: node.color, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide,
      }), 0.35);
      const halo = new THREE.Mesh(new THREE.SphereGeometry(node.biomass * 1.7, 16, 16), haloMat);
      group.add(halo);

      this.root.add(group);
      this.nodeGroups.push({ group, node, baseY: node.pos[1] });

      if (node.model) this.loadAnimal(node, group, proc);
    }
  }

  /** Swap in a real open-source animal model when it arrives; keep the
   *  procedural form until then and as a fallback if the load fails. */
  private loadAnimal(node: EcoNode, group: THREE.Group, fallback: THREE.Object3D): void {
    loadGlb(WILDLIFE_MODELS[node.model!]).then((scene) => {
      if (!scene) return; // keep the procedural fallback
      const h = node.biomass * 2.4;
      fitModel(scene, h);
      scene.position.y -= h / 2; // centre on the node
      group.add(scene);
      group.remove(fallback);
      disposeObject(fallback);
      this.loadedRoots.push(scene);
      // Tint/track the model's materials so they fade with the scale.
      scene.traverse((o) => {
        const m = (o as THREE.Mesh).material;
        const mats = Array.isArray(m) ? m : m ? [m] : [];
        for (const mat of mats) {
          const mm = mat as THREE.MeshStandardMaterial;
          if ('opacity' in mm) { this.track(mm as THREE.Material & { opacity: number }, 1); mm.opacity = this.intensity; }
        }
      });
    });
  }

  // ── Procedural species silhouettes ─────────────────────────────────────────
  private buildSilhouette(node: EcoNode): THREE.Object3D {
    switch (node.kind) {
      case 'producer': return node.id === 'grass' ? this.buildGrass(node) : this.buildTree(node);
      case 'animal': return this.buildQuadruped(node);
      case 'fungi': return this.buildMushroom(node);
      case 'bacteria': return this.buildBacteria(node);
      default: return node.id === 'sun' ? this.buildSun(node) : this.buildSoil(node);
    }
  }

  private buildTree(node: EcoNode): THREE.Object3D {
    const g = new THREE.Group();
    const s = node.biomass;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18 * s, 0.3 * s, 2.2 * s, 8),
      this.track(new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 0.9 })),
    );
    trunk.position.y = -node.biomass * 0.6;
    g.add(trunk);
    for (let i = 0; i < 3; i++) {
      const leaf = new THREE.Mesh(
        new THREE.IcosahedronGeometry((1.4 - i * 0.3) * s, 1),
        this.track(new THREE.MeshStandardMaterial({ color: node.color, roughness: 0.8, flatShading: true })),
      );
      leaf.position.y = (0.4 + i * 0.9) * s;
      g.add(leaf);
    }
    return g;
  }

  private buildGrass(node: EcoNode): THREE.Object3D {
    const g = new THREE.Group();
    const mat = this.track(new THREE.MeshStandardMaterial({ color: node.color, roughness: 0.9, flatShading: true }));
    const blade = new THREE.ConeGeometry(0.12, 1.4, 4);
    for (let i = 0; i < 9; i++) {
      const b = new THREE.Mesh(blade, mat);
      b.position.set((Math.random() - 0.5) * 1.6, 0, (Math.random() - 0.5) * 1.6);
      b.rotation.z = (Math.random() - 0.5) * 0.4;
      g.add(b);
    }
    return g;
  }

  private buildQuadruped(node: EcoNode): THREE.Object3D {
    // A blocky fallback animal; the real GLB replaces it when it loads.
    const g = new THREE.Group();
    const mat = this.track(new THREE.MeshStandardMaterial({ color: node.color, roughness: 0.6, metalness: 0.05, emissive: new THREE.Color(node.color).multiplyScalar(0.15) }));
    const s = node.biomass;
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.5 * s, 1.4 * s, 6, 12), mat);
    body.rotation.z = Math.PI / 2;
    g.add(body);
    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5 * s, 1), mat);
    head.position.set(1.1 * s, 0.4 * s, 0);
    g.add(head);
    const legGeo = new THREE.CylinderGeometry(0.12 * s, 0.12 * s, 1.1 * s, 6);
    for (const [x, z] of [[0.7, 0.4], [0.7, -0.4], [-0.7, 0.4], [-0.7, -0.4]]) {
      const leg = new THREE.Mesh(legGeo, mat);
      leg.position.set(x * s, -0.9 * s, z * s);
      g.add(leg);
    }
    return g;
  }

  private buildMushroom(node: EcoNode): THREE.Object3D {
    const g = new THREE.Group();
    const stemMat = this.track(new THREE.MeshStandardMaterial({ color: 0xf0e6d0, roughness: 0.8 }));
    const capMat = this.track(new THREE.MeshStandardMaterial({ color: node.color, roughness: 0.6, emissive: new THREE.Color(node.color).multiplyScalar(0.2) }));
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * 1.1;
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 1.1, 8), stemMat);
      stem.position.set(x, 0, 0);
      g.add(stem);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), capMat);
      cap.position.set(x, 0.55, 0);
      cap.scale.y = 0.7;
      g.add(cap);
    }
    return g;
  }

  private buildBacteria(node: EcoNode): THREE.Object3D {
    const g = new THREE.Group();
    const mat = this.track(new THREE.MeshStandardMaterial({ color: node.color, roughness: 0.4, emissive: new THREE.Color(node.color).multiplyScalar(0.3) }));
    const rod = new THREE.CapsuleGeometry(0.18, 0.7, 6, 10);
    for (let i = 0; i < 7; i++) {
      const b = new THREE.Mesh(rod, mat);
      b.position.set((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 1.4, (Math.random() - 0.5) * 2);
      b.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      g.add(b);
    }
    return g;
  }

  private buildSun(node: EcoNode): THREE.Object3D {
    const g = new THREE.Group();
    const mat = this.track(new THREE.MeshBasicMaterial({ color: node.color }));
    g.add(new THREE.Mesh(new THREE.SphereGeometry(node.biomass, 24, 24), mat));
    return g;
  }

  private buildSoil(node: EcoNode): THREE.Object3D {
    const g = new THREE.Group();
    const mat = this.track(new THREE.MeshStandardMaterial({ color: node.color, roughness: 1 }));
    const mound = new THREE.Mesh(new THREE.SphereGeometry(node.biomass * 1.4, 20, 16), mat);
    mound.scale.y = 0.4;
    g.add(mound);
    return g;
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
    for (const mat of this.fadeables) fadeMaterial(mat, this.intensity, dt);
    this.nodeGroups.forEach((n, i) => {
      n.group.rotation.y += dt * 0.25;
      n.group.position.y = n.baseY + Math.sin(elapsed * 0.7 + i) * 0.35;
    });
  }

  getPickables(): THREE.Object3D[] {
    return this.intensity > 0.3 ? this.nodeGroups.map((n) => n.group) : [];
  }

  static tagFor(id: string): PickTag | null {
    const key = id.replace(/^ecosystem:|^organism:/, '');
    const node = NODES.find((n) => n.id === key);
    if (!node) return null;
    return { id, scale: id.startsWith('organism:') ? Scale.Organism : Scale.Ecosystem };
  }

  dispose(): void {
    for (const r of this.loadedRoots) disposeObject(r);
    disposeObject(this.root);
  }
}

export const ECOSYSTEM_NODE_IDS = NODES.map((n) => n.id);
