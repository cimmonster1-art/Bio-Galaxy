import * as THREE from 'three';
import { RANK_SCALE, Scale, TaxonRank } from '../../types';
import { SceneLayer, fadeMaterial } from '../core/SceneLayer';
import { disposeObject } from '../core/dispose';
import { TREE_OF_LIFE, TaxonNode, lineageOf } from '../../data/taxonomy';
import { TAXONOMY_SCALES } from '../../data/scales';
import { createSpriteLabel } from '../labels/SpriteLabel';

interface PlacedNode {
  node: TaxonNode;
  pos: THREE.Vector3;
  /** Depth from the conceptual root: domain = 1 ... species = 8. */
  depth: number;
  parent: PlacedNode | null;
}

/** A billboard name tag pinned just outside its taxon node. */
interface NodeLabel {
  placed: PlacedNode;
  sprite: THREE.Sprite;
  material: THREE.SpriteMaterial;
}

const FORWARD = new THREE.Vector3(0, 0.12, 1).normalize();

/**
 * The Tree of Life rendered as a navigable phylogenetic galaxy. Clades are
 * luminous instanced nodes joined by faint branch filaments; a deep star cloud
 * gives the field volumetric vastness. Level of detail is driven by the active
 * scale, so domains read at the broadest zoom and species resolve only as the
 * camera dives toward them.
 *
 * The layout is computed once from a curated tree, but every interface here
 * (placement, picking, focus) is keyed by stable taxon id, so a paginated NCBI
 * Taxonomy feed can replace the static data without touching this geometry.
 */
export class TreeOfLifeLayer implements SceneLayer {
  readonly root = new THREE.Group();
  readonly activeScales = TAXONOMY_SCALES;

  private readonly placed: PlacedNode[] = [];
  private readonly byId = new Map<string, PlacedNode>();

  private readonly nodes: THREE.InstancedMesh;
  private readonly nodeMat: THREE.MeshBasicMaterial;
  private readonly cloud: THREE.InstancedMesh;
  private readonly cloudMat: THREE.MeshBasicMaterial;
  private readonly branches: THREE.LineSegments;
  private readonly branchMat: THREE.LineBasicMaterial;
  private readonly proxies: THREE.Mesh[] = [];
  private readonly proxyGeo = new THREE.SphereGeometry(1, 12, 12);
  private readonly proxyMat: THREE.MeshBasicMaterial;
  private readonly labels: NodeLabel[] = [];

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

    this.layout();

    // Node cores: a single instanced icosahedron, unlit and bright so the bloom
    // pass turns each clade into a soft luminous point.
    const nodeGeo = new THREE.IcosahedronGeometry(1, 1);
    this.nodeMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0 });
    this.nodes = new THREE.InstancedMesh(nodeGeo, this.nodeMat, this.placed.length);
    this.nodes.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(this.placed.length * 3),
      3,
    );
    this.placed.forEach((p, i) => {
      const baseSize = nodeSizeForRank(p.node.rank);
      this.nodeScale[i] = baseSize;
      this.nodeCurrent[i] = depthVisibleAt(p.depth, this.currentScale) ? baseSize : 0;
      // Brighten and saturate broad clades so a domain reads as a beacon and a
      // species as a faint spark, giving the field obvious visual hierarchy.
      this.nodes.setColorAt(i, colorForRank(p.node.hue, p.node.rank));
    });
    if (this.nodes.instanceColor) this.nodes.instanceColor.needsUpdate = true;
    this.root.add(this.nodes);

    // Branch filaments between parent and child nodes.
    const segs: number[] = [];
    const cols: number[] = [];
    for (const p of this.placed) {
      if (!p.parent) continue;
      // Filaments brighten toward the parent so light appears to flow outward
      // from each clade; brighter overall than before so branches read clearly.
      const parentCol = new THREE.Color().setHSL(p.node.hue / 360, 0.7, 0.68);
      const childCol = new THREE.Color().setHSL(p.node.hue / 360, 0.7, 0.5);
      segs.push(p.parent.pos.x, p.parent.pos.y, p.parent.pos.z, p.pos.x, p.pos.y, p.pos.z);
      cols.push(parentCol.r, parentCol.g, parentCol.b, childCol.r, childCol.g, childCol.b);
    }
    const branchGeo = new THREE.BufferGeometry();
    branchGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(segs), 3));
    branchGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(cols), 3));
    this.branchMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.branches = new THREE.LineSegments(branchGeo, this.branchMat);
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

    // Deep backdrop cloud for galactic depth. Non-pickable, faint, instanced.
    const cloudCount = 1400;
    const cloudGeo = new THREE.IcosahedronGeometry(0.4, 0);
    this.cloudMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0 });
    this.cloud = new THREE.InstancedMesh(cloudGeo, this.cloudMat, cloudCount);
    this.cloud.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(cloudCount * 3), 3);
    const cc = new THREE.Color();
    for (let i = 0; i < cloudCount; i++) {
      const dir = randomDirection();
      const r = 42 + Math.random() * 120;
      this.dummy.position.copy(dir.multiplyScalar(r));
      this.dummy.scale.setScalar(0.4 + Math.random() * 1.2);
      this.dummy.updateMatrix();
      this.cloud.setMatrixAt(i, this.dummy.matrix);
      cc.setHSL((200 + Math.random() * 140) / 360, 0.5, 0.5 + Math.random() * 0.25);
      this.cloud.setColorAt(i, cc);
    }
    this.cloud.instanceMatrix.needsUpdate = true;
    if (this.cloud.instanceColor) this.cloud.instanceColor.needsUpdate = true;
    this.root.add(this.cloud);

    this.buildLabels();
  }

  /**
   * Billboard name tags for the prominent taxa: every domain, kingdom and
   * phylum, plus the whole lineage down to Homo sapiens so the path to humans is
   * always legible. Fine ranks stay unlabelled to keep the field uncluttered.
   * Each sprite is parented under this.root so disposeObject frees it and its
   * canvas texture on teardown.
   */
  private buildLabels(): void {
    // Ids on the canonical human lineage always get a label, at any rank.
    const lineageIds = new Set(lineageOf('homo_sapiens').map((t) => t.id));
    for (const placed of this.placed) {
      const rank = placed.node.rank;
      const onLineage = lineageIds.has(placed.node.id);
      const prominent = rank === 'domain' || rank === 'kingdom' || rank === 'phylum';
      if (!prominent && !onLineage) continue;

      // Tint the label to match its clade so name and node read as one object.
      const tint = colorForRank(placed.node.hue, rank).getStyle();
      const sprite = createSpriteLabel(placed.node.name, tint);
      // Pin the tag just outside the node along its outward direction so it
      // never sits on top of the glowing core.
      const out = placed.pos.clone().normalize();
      const offset = nodeSizeForRank(rank) * 1.6 + 0.6;
      sprite.position.copy(placed.pos).addScaledVector(out, offset);
      // Larger names for broader clades, echoing the node size hierarchy.
      const labelScale = labelSizeForRank(rank);
      sprite.scale.multiplyScalar(labelScale);
      const material = sprite.material as THREE.SpriteMaterial;
      material.opacity = 0;
      this.labels.push({ placed, sprite, material });
      this.root.add(sprite);
    }
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
    fadeMaterial(this.branchMat, this.intensity * 0.85, dt);
    fadeMaterial(this.cloudMat, this.intensity * 0.5, dt);

    // Names fade in only when their node has resolved at the current level of
    // detail, and the selected taxon's label burns a little brighter.
    for (const label of this.labels) {
      const visible = depthVisibleAt(label.placed.depth, this.currentScale);
      const selected = `taxon:${label.placed.node.id}` === this.selectedId;
      const target = visible ? this.intensity * (selected ? 1 : 0.85) : 0;
      fadeMaterial(label.material, target, dt);
    }

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
    return this.proxies.filter((proxy, i) =>
      depthVisibleAt(this.placed[i].depth, this.currentScale),
    );
  }

  dispose(): void {
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

/** Ordinal position of a rank, broad (domain = 0) to fine (species = 7). */
const RANK_ORDER: Record<TaxonRank, number> = {
  domain: 0,
  kingdom: 1,
  phylum: 2,
  class: 3,
  order: 4,
  family: 5,
  genus: 6,
  species: 7,
};

/** Node radius by rank: domains are bold beacons, species faint sparks. */
function nodeSizeForRank(rank: TaxonRank): number {
  return 3.1 - RANK_ORDER[rank] * 0.34;
}

/** On-screen label scale by rank, echoing the node size hierarchy. */
function labelSizeForRank(rank: TaxonRank): number {
  return 1.7 - RANK_ORDER[rank] * 0.13;
}

/**
 * Tint a clade by hue, brightening and saturating broad ranks so the eye reads
 * a clear hierarchy: domains glow near white-bright, species sit dimmer.
 */
function colorForRank(hue: number, rank: TaxonRank): THREE.Color {
  const t = RANK_ORDER[rank] / 7;
  const sat = 0.55 + (1 - t) * 0.3;
  const light = 0.78 - t * 0.26;
  return new THREE.Color().setHSL(hue / 360, sat, light);
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
