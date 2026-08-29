import * as THREE from 'three';
import { Scale, PickTag } from '../../types';
import { SceneLayer, fadeMaterial } from '../core/SceneLayer';
import { disposeObject } from '../core/dispose';
import { fitModel, loadGlb, WILDLIFE_MODELS } from '../core/glbLoader';

type BiomeId = 'rainforest' | 'reef' | 'tundra' | 'savanna' | 'temperate' | 'desert';

interface BiomeVariant {
  id: BiomeId;
  name: string;
  ground: number;
  ground2: number;
  sky: number;
  haze: number;
  particle: number;
}

/**
 * The biome scale is intentionally six different environments rather than one
 * forest kit recoloured six ways. Coral reef has no trees. Tundra has no forest
 * floor. Desert has no mushrooms. Each scene has its own terrain, structure,
 * atmosphere and (where we have an exact permissively licensed asset) fauna.
 */
export const BIOME_VARIANTS: BiomeVariant[] = [
  { id: 'rainforest', name: 'Tropical Rainforest', ground: 0x24351f, ground2: 0x152515, sky: 0x173c35, haze: 0x5d8f78, particle: 0xc8e6d5 },
  { id: 'reef', name: 'Coral Reef', ground: 0xc7b889, ground2: 0x8f8a67, sky: 0x083c59, haze: 0x1684a0, particle: 0xbcecf3 },
  { id: 'tundra', name: 'Arctic Tundra', ground: 0xb8c2c4, ground2: 0x7e8988, sky: 0x607889, haze: 0xc7d4da, particle: 0xf5fbff },
  { id: 'savanna', name: 'Savanna', ground: 0x8d7437, ground2: 0x5f542c, sky: 0xa88355, haze: 0xc1a36c, particle: 0xe5cf8d },
  { id: 'temperate', name: 'Temperate Forest', ground: 0x36452a, ground2: 0x222d20, sky: 0x48665e, haze: 0x78948a, particle: 0xe1d9a5 },
  { id: 'desert', name: 'Desert', ground: 0xc49b5d, ground2: 0x8a653b, sky: 0xb77b55, haze: 0xd0a873, particle: 0xe3c48e },
];

const GROUND_Y = -10;
const RADIUS = 150;
const UP = new THREE.Vector3(0, 1, 0);

type Fadeable = { mat: THREE.Material & { opacity: number }; base: number; biome: BiomeId };
type FaunaMotion = {
  biome: BiomeId;
  group: THREE.Group;
  radius: number;
  angle: number;
  speed: number;
  yOffset: number;
  verticalDrift: number;
  mixer?: THREE.AnimationMixer;
};

type AmbientMotion = { biome: BiomeId; object: THREE.Object3D; speed: number };

function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function terrainHeight(id: BiomeId, x: number, z: number): number {
  const broad = Math.sin(x * 0.028) * Math.cos(z * 0.024);
  const detail = Math.sin(x * 0.087 + z * 0.061) * 0.55;
  const r2 = x * x + z * z;
  if (id === 'reef') return broad * 1.15 + detail * 0.35 - Math.exp(-r2 / 2900) * 1.4;
  if (id === 'tundra') return broad * 2.1 + detail * 0.7;
  if (id === 'desert') return Math.sin(x * 0.021 + z * 0.008) * 4.0 + Math.sin(z * 0.036) * 1.4;
  if (id === 'savanna') return broad * 2.7 + detail * 0.8;
  return broad * 4.0 + detail * 1.15 - Math.exp(-r2 / 1200) * 2.0;
}

function makeTerrainTexture(a: number, b: number, seed: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const random = seeded(seed);
  if (ctx) {
    const c1 = new THREE.Color(a);
    const c2 = new THREE.Color(b);
    const image = ctx.createImageData(size, size);
    const mixed = new THREE.Color();
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const macro = 0.5 + Math.sin(x * 0.075) * 0.10 + Math.cos(y * 0.064) * 0.08;
        const grain = (random() - 0.5) * 0.22;
        mixed.copy(c1).lerp(c2, THREE.MathUtils.clamp(macro + grain, 0, 1));
        const i = (y * size + x) * 4;
        image.data[i] = Math.round(mixed.r * 255);
        image.data[i + 1] = Math.round(mixed.g * 255);
        image.data[i + 2] = Math.round(mixed.b * 255);
        image.data[i + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 12);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function composeAlong(from: THREE.Vector3, to: THREE.Vector3, radius: number, target: THREE.Matrix4): void {
  const delta = to.clone().sub(from);
  const length = delta.length();
  const midpoint = from.clone().add(to).multiplyScalar(0.5);
  const q = new THREE.Quaternion().setFromUnitVectors(UP, delta.normalize());
  target.compose(midpoint, q, new THREE.Vector3(radius, length, radius));
}

/** Scientific, scene-specific ecology at the Biome scale. */
export class BiomeLayer implements SceneLayer {
  readonly root = new THREE.Group();
  readonly activeScales = [Scale.Biome];

  private intensity = 0;
  private activeId: BiomeId = 'rainforest';
  private readonly groups = new Map<BiomeId, THREE.Group>();
  private readonly fadeables: Fadeable[] = [];
  private readonly textures: THREE.Texture[] = [];
  private readonly pickables = new Map<BiomeId, THREE.Object3D[]>();
  private readonly fauna: FaunaMotion[] = [];
  private readonly ambient: AmbientMotion[] = [];

  constructor() {
    this.root.name = 'BiomeLayer';
    this.root.visible = false;

    for (const variant of BIOME_VARIANTS) {
      const group = new THREE.Group();
      group.name = `Biome:${variant.id}`;
      group.visible = variant.id === this.activeId;
      this.groups.set(variant.id, group);
      this.pickables.set(variant.id, []);
      this.root.add(group);
      this.buildBase(variant, group);
      if (variant.id === 'rainforest') this.buildRainforest(group);
      if (variant.id === 'reef') this.buildReef(group);
      if (variant.id === 'tundra') this.buildTundra(group);
      if (variant.id === 'savanna') this.buildSavanna(group);
      if (variant.id === 'temperate') this.buildTemperate(group);
      if (variant.id === 'desert') this.buildDesert(group);
      this.addAir(variant, group);
    }

    // Only use assets that are exactly what their source says they are. If an
    // exact model is not available, the biome is left without a token animal
    // rather than substituting another species.
    this.spawnFauna('temperate', 'fox', 'organism:predator', 3.1, 58, 0, 0.07, 0.08);
    this.spawnFauna('rainforest', 'parrot', 'organism:bird', 2.1, 52, 18, 0.11, 2.5);
    this.spawnFauna('reef', 'barramundi', 'organism:fish', 2.4, 45, 4.5, 0.14, 1.4);
  }

  private tracked<T extends THREE.Material & { opacity: number }>(biome: BiomeId, mat: T, base = 1): T {
    mat.transparent = true;
    mat.opacity = 0;
    this.fadeables.push({ mat, base, biome });
    return mat;
  }

  private registerPick(biome: BiomeId, object: THREE.Object3D, id = `biome:${biome}`): void {
    object.userData.pick = { id, scale: id.startsWith('organism:') ? Scale.Organism : Scale.Biome };
    this.pickables.get(biome)?.push(object);
  }

  private buildBase(v: BiomeVariant, group: THREE.Group): void {
    const texture = makeTerrainTexture(v.ground, v.ground2, 101 + BIOME_VARIANTS.indexOf(v) * 97);
    this.textures.push(texture);

    const groundGeo = new THREE.CircleGeometry(RADIUS, 144);
    groundGeo.rotateX(-Math.PI / 2);
    const pos = groundGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, terrainHeight(v.id, x, z));
    }
    pos.needsUpdate = true;
    groundGeo.computeVertexNormals();
    const groundMat = this.tracked(v.id, new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: texture,
      roughness: v.id === 'reef' ? 0.88 : 0.96,
      metalness: 0,
      envMapIntensity: 0.35,
    }));
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = GROUND_Y;
    ground.receiveShadow = true;
    group.add(ground);
    this.registerPick(v.id, ground);

    const skyMat = this.tracked(v.id, new THREE.MeshBasicMaterial({
      color: v.sky,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    }), 0.92);
    const sky = new THREE.Mesh(new THREE.SphereGeometry(720, 32, 22), skyMat);
    sky.frustumCulled = false;
    group.add(sky);

    const hazeMat = this.tracked(v.id, new THREE.MeshBasicMaterial({
      color: v.haze,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    }), v.id === 'reef' ? 0.17 : v.id === 'rainforest' ? 0.10 : 0.065);
    const haze = new THREE.Mesh(new THREE.SphereGeometry(310, 24, 18), hazeMat);
    haze.frustumCulled = false;
    group.add(haze);
  }

  private scatterTrees(
    biome: BiomeId,
    group: THREE.Group,
    count: number,
    style: 'rainforest' | 'temperate' | 'acacia',
    seed: number,
  ): void {
    const random = seeded(seed);
    const trunkGeo = new THREE.CylinderGeometry(0.30, 0.58, 12, 9);
    trunkGeo.translate(0, 6, 0);
    const trunkMat = this.tracked(biome, new THREE.MeshStandardMaterial({ color: 0x5b422d, roughness: 0.96 }));
    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
    trunks.castShadow = true;
    trunks.receiveShadow = true;

    const crownGeo = new THREE.SphereGeometry(1, 18, 12);
    const crownMat = this.tracked(biome, new THREE.MeshStandardMaterial({
      color: style === 'acacia' ? 0x6b7137 : style === 'rainforest' ? 0x2f7241 : 0x487046,
      roughness: 0.92,
      vertexColors: true,
    }));
    const crownParts = style === 'rainforest' ? 3 : 2;
    const crowns = new THREE.InstancedMesh(crownGeo, crownMat, count * crownParts);
    crowns.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * crownParts * 3), 3);
    crowns.castShadow = true;

    const trunkMatrix = new THREE.Matrix4();
    const crownMatrix = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const p = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const c = new THREE.Color();
    let crownIndex = 0;

    for (let i = 0; i < count; i++) {
      const a = random() * Math.PI * 2;
      const r = 18 + Math.sqrt(random()) * (RADIUS * 0.90 - 18);
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const y = GROUND_Y + terrainHeight(biome, x, z);
      const size = style === 'rainforest' ? 0.9 + random() * 1.35 : style === 'acacia' ? 0.75 + random() * 0.65 : 0.75 + random() * 0.95;
      const tiltX = (random() - 0.5) * 0.08;
      const tiltZ = (random() - 0.5) * 0.08;
      q.setFromEuler(new THREE.Euler(tiltX, random() * Math.PI * 2, tiltZ));
      p.set(x, y, z);
      scale.set(size, size * (style === 'rainforest' ? 1.20 : 1), size);
      trunkMatrix.compose(p, q, scale);
      trunks.setMatrixAt(i, trunkMatrix);

      for (let j = 0; j < crownParts; j++) {
        const offset = new THREE.Vector3(
          (random() - 0.5) * 4.4 * size,
          (10.2 + j * 2.0 + random() * 2.0) * size,
          (random() - 0.5) * 4.4 * size,
        ).applyQuaternion(q);
        const cp = p.clone().add(offset);
        const sx = style === 'acacia' ? (4.3 + random() * 1.5) * size : (3.1 + random() * 2.4) * size;
        const sy = style === 'acacia' ? (0.75 + random() * 0.45) * size : (2.0 + random() * 1.7) * size;
        const sz = style === 'acacia' ? (3.7 + random() * 1.5) * size : (3.0 + random() * 2.3) * size;
        crownMatrix.compose(cp, q, new THREE.Vector3(sx, sy, sz));
        crowns.setMatrixAt(crownIndex, crownMatrix);
        c.set(style === 'acacia' ? 0x70783d : style === 'rainforest' ? 0x2d7541 : 0x4a7147);
        c.offsetHSL((random() - 0.5) * 0.035, (random() - 0.5) * 0.10, (random() - 0.5) * 0.15);
        crowns.setColorAt(crownIndex, c);
        crownIndex++;
      }
    }

    trunks.instanceMatrix.needsUpdate = true;
    crowns.instanceMatrix.needsUpdate = true;
    if (crowns.instanceColor) crowns.instanceColor.needsUpdate = true;
    group.add(trunks, crowns);
    this.registerPick(biome, trunks);
    this.registerPick(biome, crowns);
  }

  private scatterGroundCover(biome: BiomeId, group: THREE.Group, count: number, color: number, seed: number, height = 1.2): void {
    const random = seeded(seed);
    const geo = new THREE.ConeGeometry(0.055, height, 3);
    geo.translate(0, height / 2, 0);
    const mat = this.tracked(biome, new THREE.MeshStandardMaterial({ color, roughness: 0.96, vertexColors: true }));
    const mesh = new THREE.InstancedMesh(geo, mat, count);
    mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const a = random() * Math.PI * 2;
      const r = 7 + Math.sqrt(random()) * RADIUS * 0.92;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const y = GROUND_Y + terrainHeight(biome, x, z);
      q.setFromEuler(new THREE.Euler((random() - 0.5) * 0.16, random() * Math.PI * 2, (random() - 0.5) * 0.16));
      const s = 0.55 + random() * 1.15;
      m.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(s, s * (0.7 + random() * 0.8), s));
      mesh.setMatrixAt(i, m);
      c.set(color).offsetHSL((random() - 0.5) * 0.03, (random() - 0.5) * 0.08, (random() - 0.5) * 0.12);
      mesh.setColorAt(i, c);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    group.add(mesh);
  }

  private scatterRocks(biome: BiomeId, group: THREE.Group, count: number, color: number, seed: number, maxSize = 2.2): void {
    const random = seeded(seed);
    const geo = new THREE.IcosahedronGeometry(1, 1);
    const mat = this.tracked(biome, new THREE.MeshStandardMaterial({ color, roughness: 0.98, vertexColors: true }));
    const mesh = new THREE.InstancedMesh(geo, mat, count);
    mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const a = random() * Math.PI * 2;
      const r = 12 + Math.sqrt(random()) * RADIUS * 0.88;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const y = GROUND_Y + terrainHeight(biome, x, z) + 0.25;
      q.setFromEuler(new THREE.Euler(random() * 0.45, random() * Math.PI * 2, random() * 0.45));
      const s = 0.35 + random() * maxSize;
      m.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(s, s * (0.55 + random() * 0.55), s * (0.7 + random() * 0.6)));
      mesh.setMatrixAt(i, m);
      c.set(color).offsetHSL(0, 0, (random() - 0.5) * 0.12);
      mesh.setColorAt(i, c);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  private buildRainforest(group: THREE.Group): void {
    this.scatterTrees('rainforest', group, 118, 'rainforest', 1101);
    this.scatterGroundCover('rainforest', group, 6500, 0x3f8d43, 1102, 1.45);
    this.scatterRocks('rainforest', group, 75, 0x4e594b, 1103, 1.5);

    // Buttress roots / fallen timber, kept sparse enough to read as structure.
    const random = seeded(1104);
    const geo = new THREE.CylinderGeometry(0.32, 0.46, 5.5, 8);
    const mat = this.tracked('rainforest', new THREE.MeshStandardMaterial({ color: 0x493421, roughness: 0.97 }));
    for (let i = 0; i < 24; i++) {
      const mesh = new THREE.Mesh(geo, mat);
      const a = random() * Math.PI * 2;
      const r = 18 + random() * 120;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      mesh.position.set(x, GROUND_Y + terrainHeight('rainforest', x, z) + 0.45, z);
      mesh.rotation.set(Math.PI / 2 + (random() - 0.5) * 0.18, random() * Math.PI * 2, (random() - 0.5) * 0.2);
      mesh.scale.setScalar(0.65 + random() * 0.8);
      mesh.castShadow = true;
      group.add(mesh);
    }
  }

  private buildTemperate(group: THREE.Group): void {
    this.scatterTrees('temperate', group, 86, 'temperate', 2101);
    this.scatterGroundCover('temperate', group, 4700, 0x65834a, 2102, 1.0);
    this.scatterRocks('temperate', group, 95, 0x626861, 2103, 1.6);
  }

  private buildSavanna(group: THREE.Group): void {
    this.scatterTrees('savanna', group, 28, 'acacia', 3101);
    this.scatterGroundCover('savanna', group, 7600, 0xb79747, 3102, 1.25);
    this.scatterRocks('savanna', group, 65, 0x79684e, 3103, 1.35);
  }

  private buildTundra(group: THREE.Group): void {
    this.scatterRocks('tundra', group, 210, 0x778283, 4101, 2.3);
    const random = seeded(4102);
    const cushionGeo = new THREE.SphereGeometry(1, 14, 9);
    const cushionMat = this.tracked('tundra', new THREE.MeshStandardMaterial({ color: 0x6e795d, roughness: 0.98, vertexColors: true }));
    const cushions = new THREE.InstancedMesh(cushionGeo, cushionMat, 760);
    cushions.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(760 * 3), 3);
    const m = new THREE.Matrix4();
    const c = new THREE.Color();
    for (let i = 0; i < 760; i++) {
      const a = random() * Math.PI * 2;
      const r = 10 + Math.sqrt(random()) * 135;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const y = GROUND_Y + terrainHeight('tundra', x, z) + 0.12;
      const s = 0.18 + random() * 0.65;
      m.compose(new THREE.Vector3(x, y, z), new THREE.Quaternion(), new THREE.Vector3(s * 1.7, s * 0.22, s * 1.4));
      cushions.setMatrixAt(i, m);
      c.set(random() > 0.45 ? 0x7d8568 : 0x8b7965).offsetHSL(0, 0, (random() - 0.5) * 0.1);
      cushions.setColorAt(i, c);
    }
    cushions.instanceMatrix.needsUpdate = true;
    if (cushions.instanceColor) cushions.instanceColor.needsUpdate = true;
    group.add(cushions);
  }

  private buildDesert(group: THREE.Group): void {
    this.scatterRocks('desert', group, 170, 0x8c6845, 5101, 2.5);
    const random = seeded(5102);
    const stemGeo = new THREE.CylinderGeometry(0.42, 0.58, 8, 10);
    stemGeo.translate(0, 4, 0);
    const cactusMat = this.tracked('desert', new THREE.MeshStandardMaterial({ color: 0x557549, roughness: 0.88 }));
    const stems = new THREE.InstancedMesh(stemGeo, cactusMat, 42);
    const arms = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.25, 0.32, 3.3, 9), cactusMat, 84);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    let armIndex = 0;
    const cactusPositions: THREE.Vector3[] = [];
    for (let i = 0; i < 42; i++) {
      const a = random() * Math.PI * 2;
      const r = 18 + Math.sqrt(random()) * 120;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const y = GROUND_Y + terrainHeight('desert', x, z);
      const scale = 0.55 + random() * 0.9;
      const p = new THREE.Vector3(x, y, z);
      cactusPositions.push(p.clone());
      m.compose(p, new THREE.Quaternion(), new THREE.Vector3(scale, scale, scale));
      stems.setMatrixAt(i, m);

      for (let side = -1; side <= 1; side += 2) {
        const start = p.clone().add(new THREE.Vector3(side * 0.7 * scale, (3.0 + random() * 2.2) * scale, 0));
        const end = start.clone().add(new THREE.Vector3(side * (1.4 + random()) * scale, (0.4 + random() * 1.2) * scale, (random() - 0.5) * 0.5));
        composeAlong(start, end, 0.24 * scale, m);
        arms.setMatrixAt(armIndex++, m);
      }
    }
    stems.instanceMatrix.needsUpdate = true;
    arms.instanceMatrix.needsUpdate = true;
    stems.castShadow = arms.castShadow = true;
    group.add(stems, arms);
    this.registerPick('desert', stems);
  }

  private buildReef(group: THREE.Group): void {
    this.scatterRocks('reef', group, 125, 0x6d6b62, 6101, 1.8);
    const random = seeded(6102);
    const branchGeo = new THREE.CylinderGeometry(0.17, 0.27, 1, 8);
    const coralMat = this.tracked('reef', new THREE.MeshStandardMaterial({ color: 0xd16d70, roughness: 0.76, vertexColors: true }));
    const clusterCount = 64;
    const perCluster = 7;
    const branches = new THREE.InstancedMesh(branchGeo, coralMat, clusterCount * perCluster);
    branches.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(clusterCount * perCluster * 3), 3);
    const m = new THREE.Matrix4();
    const c = new THREE.Color();
    let index = 0;
    for (let cluster = 0; cluster < clusterCount; cluster++) {
      const a = random() * Math.PI * 2;
      const r = 12 + Math.sqrt(random()) * 126;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const y = GROUND_Y + terrainHeight('reef', x, z) + 0.15;
      const base = new THREE.Vector3(x, y, z);
      for (let j = 0; j < perCluster; j++) {
        const theta = random() * Math.PI * 2;
        const length = 1.8 + random() * 4.8;
        const start = base.clone().add(new THREE.Vector3((random() - 0.5) * 1.2, random() * 0.7, (random() - 0.5) * 1.2));
        const end = start.clone().add(new THREE.Vector3(Math.cos(theta) * length * 0.38, length, Math.sin(theta) * length * 0.38));
        composeAlong(start, end, 0.20 + random() * 0.12, m);
        branches.setMatrixAt(index, m);
        const palette = [0xd16d70, 0xde8f5f, 0xb273a9, 0xd8b268, 0x8d6da8];
        c.set(palette[Math.floor(random() * palette.length)]).offsetHSL((random() - 0.5) * 0.025, 0, (random() - 0.5) * 0.08);
        branches.setColorAt(index, c);
        index++;
      }
    }
    branches.instanceMatrix.needsUpdate = true;
    if (branches.instanceColor) branches.instanceColor.needsUpdate = true;
    branches.castShadow = true;
    group.add(branches);
    this.registerPick('reef', branches);

    // Seagrass / macroalgae lives here instead of the terrestrial grass mesh.
    this.scatterGroundCover('reef', group, 3600, 0x397f67, 6103, 1.7);
  }

  private addAir(v: BiomeVariant, group: THREE.Group): void {
    const random = seeded(7000 + BIOME_VARIANTS.indexOf(v) * 131);
    const count = v.id === 'reef' ? 1100 : v.id === 'tundra' ? 1400 : 850;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = random() * Math.PI * 2;
      const r = Math.sqrt(random()) * RADIUS;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = GROUND_Y + 1 + random() * (v.id === 'reef' ? 48 : 68);
      positions[i * 3 + 2] = Math.sin(a) * r;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = this.tracked(v.id, new THREE.PointsMaterial({
      color: v.particle,
      size: v.id === 'tundra' ? 0.30 : v.id === 'reef' ? 0.16 : 0.11,
      sizeAttenuation: true,
      depthWrite: false,
      blending: v.id === 'reef' ? THREE.NormalBlending : THREE.AdditiveBlending,
    }), v.id === 'tundra' ? 0.30 : 0.18);
    const points = new THREE.Points(geo, mat);
    group.add(points);
    this.ambient.push({ biome: v.id, object: points, speed: v.id === 'desert' ? 0.012 : 0.004 });
  }

  private spawnFauna(
    biome: BiomeId,
    model: keyof typeof WILDLIFE_MODELS,
    pickId: string,
    height: number,
    radius: number,
    yOffset: number,
    speed: number,
    verticalDrift: number,
  ): void {
    loadGlb(WILDLIFE_MODELS[model]).then((scene) => {
      if (!scene) return;
      fitModel(scene, height);
      const wrapper = new THREE.Group();
      wrapper.add(scene);
      wrapper.userData.pick = { id: pickId, scale: Scale.Organism };
      wrapper.userData.modelSource = model;
      scene.traverse((child) => { if (!child.userData.pick) child.userData.pick = wrapper.userData.pick; });
      const angle = model === 'parrot' ? 0.9 : model === 'barramundi' ? 2.2 : 4.1;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      wrapper.position.set(x, GROUND_Y + terrainHeight(biome, x, z) + yOffset, z);
      this.groups.get(biome)?.add(wrapper);
      this.pickables.get(biome)?.push(wrapper);
      const mixer = scene.userData.animationMixer instanceof THREE.AnimationMixer ? scene.userData.animationMixer : undefined;
      this.fauna.push({ biome, group: wrapper, radius, angle, speed, yOffset, verticalDrift, mixer });
    });
  }

  setVariant(id: string): void {
    const next = BIOME_VARIANTS.find((v) => v.id === id)?.id;
    if (!next || next === this.activeId) return;
    this.activeId = next;
    for (const [biome, group] of this.groups) group.visible = biome === next;
  }

  onScaleChange(_scale: Scale, intensity: number): void {
    this.intensity = intensity;
    this.root.visible = intensity > 0.01;
  }

  update(dt: number, elapsed: number): void {
    for (const { mat, base, biome } of this.fadeables) {
      fadeMaterial(mat, biome === this.activeId ? this.intensity * base : 0, dt, 4.5);
    }

    for (const item of this.ambient) {
      if (item.biome !== this.activeId) continue;
      item.object.rotation.y += dt * item.speed;
      if (item.biome === 'tundra') item.object.position.y = Math.sin(elapsed * 0.12) * 1.2;
      if (item.biome === 'reef') item.object.position.y = (elapsed * 0.18) % 3;
      if (item.biome === 'desert') item.object.position.x = Math.sin(elapsed * 0.08) * 2.5;
    }

    for (const animal of this.fauna) {
      animal.mixer?.update(dt);
      animal.angle += dt * animal.speed;
      const x = Math.cos(animal.angle) * animal.radius;
      const z = Math.sin(animal.angle) * animal.radius;
      const base = GROUND_Y + terrainHeight(animal.biome, x, z) + animal.yOffset;
      animal.group.position.set(x, base + Math.sin(elapsed * 0.8 + animal.angle) * animal.verticalDrift, z);
      animal.group.rotation.y = -animal.angle + Math.PI / 2;
    }
  }

  getPickables(): THREE.Object3D[] {
    return this.intensity > 0.25 ? (this.pickables.get(this.activeId) ?? []) : [];
  }

  static tagFor(id: string): PickTag | null {
    const biome = BIOME_VARIANTS.find((v) => `biome:${v.id}` === id);
    return biome ? { id, scale: Scale.Biome } : null;
  }

  dispose(): void {
    for (const texture of this.textures) texture.dispose();
    disposeObject(this.root);
  }
}
