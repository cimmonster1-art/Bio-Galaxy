import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RANK_SCALE, Scale } from '../../types';
import { SceneLayer, fadeMaterial } from '../core/SceneLayer';
import { disposeObject } from '../core/dispose';
import { createStarTexture } from '../textures/proceduralTextures';
import { TREE_OF_LIFE, TaxonNode } from '../../data/taxonomy';
import { TAXONOMY_SCALES } from '../../data/scales';

interface PlacedNode {
  node: TaxonNode;
  pos: THREE.Vector3;
  /** Depth from the conceptual root: domain = 1 ... species = 8. */
  depth: number;
  parent: PlacedNode | null;
}

const FORWARD = new THREE.Vector3(0, 0.12, 1).normalize();

/**
 * The Tree of Life rendered as a navigable phylogenetic galaxy. Clades are smooth
 * luminous cores wrapped in additive glow halos, joined by curved, tapered branch
 * filaments that arc between parent and child like a real cladogram; a deep star
 * cloud gives the field volumetric vastness. Level of detail is driven by the
 * active scale, so domains read at the broadest zoom and species resolve only as
 * the camera dives toward them.
 *
 * The earlier build looked blocky because nodes were low-poly icosahedra and
 * branches were single-pixel straight lines. Cores now use a high-subdivision
 * sphere, glow comes from camera-facing sprites, and branches are swept tubes, so
 * nothing reads as faceted geometry. The layout is computed once from a curated
 * tree but keyed by stable taxon id, so a paginated NCBI feed can replace the
 * data without touching this geometry.
 */
export class TreeOfLifeLayer implements SceneLayer {
  readonly root = new THREE.Group();
  readonly activeScales = TAXONOMY_SCALES;

  private readonly placed: PlacedNode[] = [];
  private readonly byId = new Map<string, PlacedNode>();

  private readonly nodes: THREE.InstancedMesh;
  private readonly nodeMat: THREE.MeshBasicMaterial;
  private readonly halos: THREE.Sprite[] = [];
  private readonly haloBase: number[] = [];
  private readonly haloTex: THREE.Texture;
  private readonly cloud: THREE.Points;
  private readonly cloudMat: THREE.PointsMaterial;
  private readonly branches: THREE.Mesh;
  private readonly branchMat: THREE.MeshBasicMaterial;
  private readonly proxies: THREE.Mesh[] = [];
  private readonly proxyGeo = new THREE.SphereGeometry(1, 12, 12);
  private readonly proxyMat: THREE.MeshBasicMaterial;

  private readonly nodeScale: number[] = [];
  private readonly nodeCurrent: number[] = [];
  private readonly dummy = new THREE.Object3D();

  private intensity = 0;
  private currentScale: Scale = Scale.TreeOfLife;
  private selectedId: string | null = null;
  private focusTarget: THREE.Quaternion | null = null;
  private dirty = true;

  constructor() {
    this.root.name = 'TreeOfLifeLayer';
    this.haloTex = createStarTexture(128);

    this.layout();

    // Node cores: a single instanced, high-subdivision sphere, unlit and bright
    // so the bloom pass turns each clade into a soft luminous orb without facets.
    const nodeGeo = new THREE.IcosahedronGeometry(1, 4);
    this.nodeMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0 });
    this.nodes = new THREE.InstancedMesh(nodeGeo, this.nodeMat, this.placed.length);
    this.nodes.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(this.placed.length * 3),
      3,
    );
    this.placed.forEach((p, i) => {
      const baseSize = nodeSizeForDepth(p.depth);
      this.nodeScale[i] = baseSize;
      this.nodeCurrent[i] = depthVisibleAt(p.depth, this.currentScale) ? baseSize : 0;
      const color = new THREE.Color().setHSL(p.node.hue / 360, 0.7, 0.62);
      this.nodes.setColorAt(i, color);

      // A camera-facing glow halo gives each clade volume and a star-like bloom.
      const haloMat = new THREE.SpriteMaterial({
        map: this.haloTex,
        color: new THREE.Color().setHSL(p.node.hue / 360, 0.75, 0.62),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const halo = new THREE.Sprite(haloMat);
      halo.position.copy(p.pos);
      halo.renderOrder = -1;
      this.halos.push(halo);
      this.haloBase.push(baseSize * 3.4);
      this.root.add(halo);
    });
    if (this.nodes.instanceColor) this.nodes.instanceColor.needsUpdate = true;
    this.root.add(this.nodes);

    // Branch filaments: curved, tapered tubes swept between parent and child,
    // colored as a gradient along their length and merged into one draw call.
    this.branches = new THREE.Mesh(this.buildBranchGeometry(), undefined as unknown as THREE.Material);
    this.branchMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.branches.material = this.branchMat;
    this.root.add(this.branches);

    // Invisible but raycastable proxies give each node a stable pick target.
    this.proxyMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
    for (const p of this.placed) {
      const proxy = new THREE.Mesh(this.proxyGeo, this.proxyMat);
      proxy.position.copy(p.pos);
      proxy.scale.setScalar(Math.max(1.4, nodeSizeForDepth(p.depth) * 1.6));
      proxy.userData.pick = { id: `taxon:${p.node.id}`, scale: RANK_SCALE[p.node.rank] };
      this.proxies.push(proxy);
      this.root.add(proxy);
    }

    // Deep backdrop cloud as soft additive star points for galactic depth.
    const cloudCount = 1600;
    const positions = new Float32Array(cloudCount * 3);
    const colors = new Float32Array(cloudCount * 3);
    const cc = new THREE.Color();
    for (let i = 0; i < cloudCount; i++) {
      const dir = randomDirection();
      const r = 42 + Math.random() * 130;
      dir.multiplyScalar(r);
      positions[i * 3] = dir.x;
      positions[i * 3 + 1] = dir.y;
      positions[i * 3 + 2] = dir.z;
      cc.setHSL((200 + Math.random() * 140) / 360, 0.5, 0.5 + Math.random() * 0.28);
      colors[i * 3] = cc.r;
      colors[i * 3 + 1] = cc.g;
      colors[i * 3 + 2] = cc.b;
    }
    const cloudGeo = new THREE.BufferGeometry();
    cloudGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    cloudGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.cloudMat = new THREE.PointsMaterial({
      map: this.haloTex,
      size: 2.6,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.cloud = new THREE.Points(cloudGeo, this.cloudMat);
    this.root.add(this.cloud);
  }

  // ---- geometry ------------------------------------------------------------

  /** Sweep a curved, tapered tube for every parent→child edge and merge them. */
  private buildBranchGeometry(): THREE.BufferGeometry {
    const geos: THREE.BufferGeometry[] = [];
    const parentColor = new THREE.Color();
    const childColor = new THREE.Color();
    for (const p of this.placed) {
      if (!p.parent) continue;
      const a = p.parent.pos;
      const b = p.pos;
      const mid = a.clone().add(b).multiplyScalar(0.5);
      // Bow the branch outward from the galactic center so edges arc like a tree.
      const outward = mid.clone().normalize().multiplyScalar(a.distanceTo(b) * 0.16);
      const control = mid.add(outward);
      const curve = new THREE.QuadraticBezierCurve3(a.clone(), control, b.clone());
      const radius = Math.max(0.05, 0.32 - p.parent.depth * 0.035);
      const tube = new THREE.TubeGeometry(curve, 24, radius, 6, false);

      // Gradient the tube color from the parent clade hue to the child hue.
      parentColor.setHSL(p.parent.node.hue / 360, 0.6, 0.5);
      childColor.setHSL(p.node.hue / 360, 0.65, 0.6);
      const uv = tube.attributes.uv as THREE.BufferAttribute;
      const count = tube.attributes.position.count;
      const colors = new Float32Array(count * 3);
      const c = new THREE.Color();
      for (let i = 0; i < count; i++) {
        const t = uv.getX(i);
        c.copy(parentColor).lerp(childColor, t);
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
      }
      tube.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geos.push(tube);
    }
    const merged = geos.length ? mergeGeometries(geos, false) : new THREE.BufferGeometry();
    for (const g of geos) g.dispose();
    return merged ?? new THREE.BufferGeometry();
  }

  // ---- layout --------------------------------------------------------------

  private layout(): void {
    const domains = TREE_OF_LIFE;
    domains.forEach((domain, i) => {
      const a = (i / domains.length) * Math.PI * 2;
      const dir = new THREE.Vector3(
        Math.cos(a),
        (i - (domains.length - 1) / 2) * 0.35,
        Math.sin(a),
      ).normalize();
      this.place(domain, dir, 1, null);
    });
  }

  private place(
    node: TaxonNode,
    dir: THREE.Vector3,
    depth: number,
    parent: PlacedNode | null,
  ): void {
    const pos = dir.clone().multiplyScalar(radiusAtDepth(depth));
    const placed: PlacedNode = { node, pos, depth, parent };
    this.placed.push(placed);
    this.byId.set(node.id, placed);

    const children = node.children;
    if (children.length === 0) return;

    // Build an orthonormal basis around the outward direction to fan children.
    const u = new THREE.Vector3();
    const v = new THREE.Vector3();
    basisFrom(dir, u, v);
    const cone = coneAtDepth(depth);
    children.forEach((child, i) => {
      const t = children.length === 1 ? 0 : i / (children.length - 1) - 0.5;
      const tilt = t * cone;
      const swirl = 2.399963 * (i + depth);
      const offset = u
        .clone()
        .multiplyScalar(Math.cos(swirl))
        .add(v.clone().multiplyScalar(Math.sin(swirl)))
        .multiplyScalar(Math.sin(tilt));
      const childDir = dir
        .clone()
        .multiplyScalar(Math.cos(tilt))
        .add(offset)
        .normalize();
      this.place(child, childDir, depth + 1, placed);
    });
  }

  // ---- interaction ---------------------------------------------------------

  setSelected(id: string | null): void {
    this.selectedId = id;
  }

  /** Orient the galaxy so a selected lineage faces the camera. */
  focusLineage(taxonId: string): void {
    const placed = this.byId.get(taxonId);
    if (!placed) return;
    const from = placed.pos.clone().normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(from, FORWARD);
    this.focusTarget = q;
  }

  // ---- lifecycle -----------------------------------------------------------

  onScaleChange(scale: Scale, intensity: number): void {
    if (scale !== this.currentScale) this.dirty = true;
    this.currentScale = scale;
    this.intensity = intensity;
    this.root.visible = intensity > 0.01;
  }

  update(dt: number, elapsed: number): void {
    fadeMaterial(this.nodeMat, this.intensity, dt);
    fadeMaterial(this.branchMat, this.intensity * 0.7, dt);
    fadeMaterial(this.cloudMat, this.intensity * 0.55, dt);

    // Gentle drift, unless we are settling a focus orientation.
    if (this.focusTarget) {
      this.root.quaternion.slerp(this.focusTarget, Math.min(1, dt * 2.5));
      if (this.root.quaternion.angleTo(this.focusTarget) < 0.01) this.focusTarget = null;
    } else {
      this.root.rotation.y = elapsed * 0.012;
    }

    // Ease per-node visibility toward the current level of detail.
    let changed = this.dirty;
    for (let i = 0; i < this.placed.length; i++) {
      const p = this.placed[i];
      const selected = `taxon:${p.node.id}` === this.selectedId;
      const visible = depthVisibleAt(p.depth, this.currentScale);
      const target = visible ? this.nodeScale[i] * (selected ? 1.8 : 1) : 0;
      const cur = this.nodeCurrent[i];
      if (Math.abs(target - cur) > 0.001) {
        this.nodeCurrent[i] = cur + (target - cur) * Math.min(1, dt * 5);
        changed = true;
      }
      // Halos track core size and pulse gently so the field feels alive.
      const halo = this.halos[i];
      const pulse = 1 + Math.sin(elapsed * 1.3 + i) * 0.06;
      halo.scale.setScalar(Math.max(0.0001, (this.nodeCurrent[i] / this.nodeScale[i]) * this.haloBase[i] * pulse));
      fadeMaterial(halo.material, visible ? this.intensity * 0.9 : 0, dt);
    }
    if (changed) {
      for (let i = 0; i < this.placed.length; i++) {
        this.dummy.position.copy(this.placed[i].pos);
        this.dummy.scale.setScalar(Math.max(0.0001, this.nodeCurrent[i]));
        this.dummy.updateMatrix();
        this.nodes.setMatrixAt(i, this.dummy.matrix);
      }
      this.nodes.instanceMatrix.needsUpdate = true;
      this.dirty = false;
    }

    this.cloud.rotation.y = -elapsed * 0.006;
  }

  getPickables(): THREE.Object3D[] {
    if (this.intensity < 0.2) return [];
    // Only expose nodes at or just beyond the current level of detail.
    return this.proxies.filter((_proxy, i) =>
      depthVisibleAt(this.placed[i].depth, this.currentScale),
    );
  }

  dispose(): void {
    this.haloTex.dispose();
    disposeObject(this.root);
  }
}

// ---- layout helpers ---------------------------------------------------------

const DEPTH_RADIUS = [0, 7, 11, 14.5, 17.5, 20, 22, 24, 26];

function radiusAtDepth(depth: number): number {
  return DEPTH_RADIUS[Math.min(depth, DEPTH_RADIUS.length - 1)];
}

function coneAtDepth(depth: number): number {
  return Math.max(0.4, 1.5 - depth * 0.14);
}

function nodeSizeForDepth(depth: number): number {
  return Math.max(0.5, 2.4 - depth * 0.22);
}

/** A node resolves into view at its own scale and stays visible deeper in. */
function depthVisibleAt(depth: number, scale: Scale): boolean {
  // Tree depth 1 (domain) maps to Scale.Domain; reveal one rank earlier so the
  // next level fades in as the camera dives toward it.
  const rankScale = Scale.Domain + (depth - 1);
  return scale >= rankScale - 1;
}

function basisFrom(dir: THREE.Vector3, u: THREE.Vector3, v: THREE.Vector3): void {
  const ref = Math.abs(dir.y) < 0.95 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  u.copy(ref).cross(dir).normalize();
  v.copy(dir).cross(u).normalize();
}

function randomDirection(): THREE.Vector3 {
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
