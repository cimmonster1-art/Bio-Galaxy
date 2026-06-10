import * as THREE from 'three';
import { Scale } from '../../../types';
import { cloneDetailTexture, getMuscleFibre, getTissueGrain } from '../../textures/detailTextures';

// Geometry builders for the cell environment. Each returns a Group tagged for
// raycast selection so CellScene stays focused on layout and animation. Shared
// geometries are created once and reused across instances by the caller.
//
// Organelles use physically based "jelly" materials: transmission, clearcoat and
// thickness give a wet, translucent surface; a real photographic detail map
// (tissue grain or muscle fibre) drives the bump and roughness for fine living
// relief, layered on top of the canvas procedural bump passed by the caller; and
// the scene PMREM environment supplies soft reflections. Each organelle carries a
// distinct, biologically plausible palette so the interior reads as a rich,
// recognizable landscape rather than a uniform soup. Counts stay modest so the
// result reads as detailed rather than cluttered.

export interface Pickable {
  group: THREE.Group;
  pickId: string;
}

function tag(group: THREE.Group, pickId: string): Pickable {
  group.traverse((o) => {
    o.userData.pick = { id: pickId, scale: Scale.Organelle };
  });
  group.userData.pick = { id: pickId, scale: Scale.Organelle };
  return { group, pickId };
}

const TEAL = new THREE.Color('#27c4d9');

/** Shared physical material factory for translucent, wet organelle surfaces. */
function jelly(opts: {
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
  transmission?: number;
  roughness?: number;
  bump?: THREE.Texture;
  bumpScale?: number;
  roughnessMap?: THREE.Texture;
  opacity?: number;
  sheen?: number;
  sheenColor?: string;
  iridescence?: number;
  attenuationColor?: string;
  attenuationDistance?: number;
  ior?: number;
  thickness?: number;
}): THREE.MeshPhysicalMaterial {
  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(opts.color),
    emissive: new THREE.Color(opts.emissive ?? '#000000'),
    emissiveIntensity: opts.emissive ? (opts.emissiveIntensity ?? 0.45) : 0,
    roughness: opts.roughness ?? 0.28,
    metalness: 0,
    transmission: opts.transmission ?? 0.45,
    thickness: opts.thickness ?? 1.6,
    ior: opts.ior ?? 1.34,
    clearcoat: 1,
    clearcoatRoughness: 0.28,
    bumpMap: opts.bump,
    bumpScale: opts.bumpScale ?? 0.12,
    roughnessMap: opts.roughnessMap,
    // A soft fabric-like sheen reads as the moist scattering halo on a wet skin.
    sheen: opts.sheen ?? 0.5,
    sheenRoughness: 0.5,
    sheenColor: new THREE.Color(opts.sheenColor ?? '#bff4ff'),
    iridescence: opts.iridescence ?? 0,
    iridescenceIOR: 1.3,
    attenuationColor: new THREE.Color(opts.attenuationColor ?? opts.color),
    attenuationDistance: opts.attenuationDistance ?? 4,
    envMapIntensity: 1.2,
    transparent: true,
    opacity: opts.opacity ?? 1,
    side: THREE.FrontSide,
  });
  return mat;
}

/** Semi-transparent lipid membrane bounding the whole cell. */
export function buildMembrane(radius: number, bump?: THREE.Texture): THREE.Mesh {
  // High subdivision so the silhouette stays perfectly round at close zoom.
  const geo = new THREE.SphereGeometry(radius, 160, 160);
  // A real grain map drives both bump and roughness so the bilayer breathes.
  const grain = cloneDetailTexture(getTissueGrain(), 5);
  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#0e7c8c'),
    transparent: true,
    opacity: 0.14,
    roughness: 0.16,
    roughnessMap: grain,
    transmission: 0.74,
    thickness: 3.2,
    ior: 1.34,
    clearcoat: 1,
    clearcoatRoughness: 0.18,
    // Stronger iridescence gives the soap-film bilayer shimmer.
    iridescence: 0.65,
    iridescenceIOR: 1.32,
    iridescenceThicknessRange: [120, 420],
    sheen: 0.7,
    sheenRoughness: 0.4,
    sheenColor: new THREE.Color('#7af2ff'),
    side: THREE.BackSide,
    emissive: new THREE.Color('#062a31'),
    emissiveIntensity: 0.4,
    bumpMap: bump,
    bumpScale: 0.05,
    attenuationColor: new THREE.Color('#0c5260'),
    attenuationDistance: 9,
    envMapIntensity: 1.4,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'membrane';
  return mesh;
}

/** Nucleus: envelope plus a tangle of chromatin filaments and a nucleolus. */
export function buildNucleus(radius: number, bump?: THREE.Texture): Pickable {
  const group = new THREE.Group();
  group.name = 'nucleus';

  const grain = cloneDetailTexture(getTissueGrain(), 2.5);
  const envelope = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 128, 128),
    jelly({
      color: '#3a6ea5',
      emissive: '#15314f',
      transmission: 0.6,
      roughness: 0.3,
      bump,
      bumpScale: 0.1,
      roughnessMap: grain,
      opacity: 0.6,
      iridescence: 0.25,
      sheenColor: '#cfe6ff',
      attenuationColor: '#1b4870',
      attenuationDistance: 5,
    }),
  );
  group.add(envelope);

  // Nuclear pores: small toroidal studs embedded around the envelope.
  const poreMat = jelly({ color: '#bcd9ff', emissive: '#2a567f', transmission: 0.1, roughness: 0.5, bump, bumpScale: 0.06 });
  const poreGeo = new THREE.TorusGeometry(0.16, 0.07, 8, 16);
  const pores = new THREE.InstancedMesh(poreGeo, poreMat, 70);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 70; i++) {
    const dir = randomInSphere(1).normalize();
    dummy.position.copy(dir).multiplyScalar(radius);
    dummy.lookAt(dummy.position.clone().add(dir));
    dummy.scale.setScalar(0.7 + Math.random() * 0.7);
    dummy.updateMatrix();
    pores.setMatrixAt(i, dummy.matrix);
  }
  pores.instanceMatrix.needsUpdate = true;
  group.add(pores);

  // Chromatin as a dense tangle of short tube strands for real 3D relief.
  const strandMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#9ad0ff'),
    emissive: new THREE.Color('#22557a'),
    emissiveIntensity: 0.4,
    roughness: 0.6,
    bumpMap: bump,
    bumpScale: 0.05,
  });
  const strands = 120;
  for (let i = 0; i < strands; i++) {
    const a = randomInSphere(radius * 0.78);
    const pts: THREE.Vector3[] = [a.clone()];
    for (let s = 0; s < 4; s++) {
      pts.push(pts[pts.length - 1].clone().add(randomInSphere(radius * 0.2)));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.TubeGeometry(curve, 12, 0.05 + Math.random() * 0.04, 7, false);
    group.add(new THREE.Mesh(tube, strandMat));
  }

  const nucleolus = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 0.3, 64, 64),
    jelly({ color: '#1d4e6e', emissive: '#0c2c40', transmission: 0.3, roughness: 0.42, bump, bumpScale: 0.14, roughnessMap: grain }),
  );
  nucleolus.position.set(radius * 0.2, -radius * 0.1, radius * 0.15);
  group.add(nucleolus);

  return tag(group, 'nucleus');
}

/** Mitochondrion: outer capsule with folded inner cristae. */
export function buildMitochondrion(bump?: THREE.Texture): Pickable {
  const group = new THREE.Group();
  // The directional fibre map suits the ribbed mitochondrial surface.
  const fibre = cloneDetailTexture(getMuscleFibre(), 2);
  const outer = new THREE.Mesh(
    new THREE.CapsuleGeometry(1.0, 2.4, 24, 56),
    jelly({
      color: '#e2a13c',
      emissive: '#5a3a0a',
      transmission: 0.28,
      roughness: 0.32,
      bump,
      bumpScale: 0.16,
      roughnessMap: fibre,
      opacity: 0.92,
      sheenColor: '#ffe2a8',
      attenuationColor: '#a86a16',
      attenuationDistance: 3,
    }),
  );
  outer.rotation.z = Math.PI / 2;
  group.add(outer);

  // Cristae: stacked partial tori threaded through the long axis.
  const cristaeMat = jelly({ color: '#ffcf7a', emissive: '#7a4d10', transmission: 0.15, roughness: 0.36, bump, bumpScale: 0.14, roughnessMap: cloneDetailTexture(getMuscleFibre(), 1.5) });
  cristaeMat.side = THREE.DoubleSide;
  const cristaGeo = new THREE.TorusGeometry(0.85, 0.13, 20, 48, Math.PI * 1.3);
  for (let i = 0; i < 9; i++) {
    const crista = new THREE.Mesh(cristaGeo, cristaeMat);
    crista.position.x = -1.85 + i * 0.46;
    crista.rotation.y = Math.PI / 2;
    crista.rotation.z = i * 0.5;
    group.add(crista);
  }
  return tag(group, 'mitochondrion');
}

/** Golgi apparatus: a stack of curved, flattened cisternae. */
export function buildGolgi(bump?: THREE.Texture): Pickable {
  const group = new THREE.Group();
  const mat = jelly({
    color: '#c879c2',
    emissive: '#3f1d3d',
    transmission: 0.32,
    roughness: 0.3,
    bump,
    bumpScale: 0.13,
    roughnessMap: cloneDetailTexture(getMuscleFibre(), 3),
    opacity: 0.92,
    sheenColor: '#f4cdef',
    attenuationColor: '#8a4685',
    attenuationDistance: 3,
  });
  mat.side = THREE.DoubleSide;
  for (let i = 0; i < 6; i++) {
    const radius = 2.2 - i * 0.26;
    const geo = new THREE.TorusGeometry(radius, 0.18, 24, 96, Math.PI * 1.1);
    const cisterna = new THREE.Mesh(geo, mat);
    cisterna.position.y = i * 0.5;
    cisterna.scale.y = 0.45;
    cisterna.rotation.x = Math.PI / 2;
    group.add(cisterna);
  }
  // Budding transport vesicles pinching off the rim of the stack.
  const budMat = jelly({ color: '#e6a6df', emissive: '#5a2a55', transmission: 0.3, roughness: 0.3, bump });
  const budGeo = new THREE.SphereGeometry(0.22, 20, 20);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const bud = new THREE.Mesh(budGeo, budMat);
    bud.position.set(Math.cos(a) * 2.5, 1.4 + Math.random() * 1.0, Math.sin(a) * 2.5);
    group.add(bud);
  }
  return tag(group, 'golgi');
}

/** Endoplasmic reticulum: folded branching tubular sheets around the nucleus. */
export function buildER(innerRadius: number, bump?: THREE.Texture): Pickable {
  const group = new THREE.Group();
  const mat = jelly({
    color: '#2f9fb3',
    emissive: '#0c3b44',
    transmission: 0.38,
    roughness: 0.32,
    bump,
    bumpScale: 0.13,
    roughnessMap: cloneDetailTexture(getMuscleFibre(), 4),
    opacity: 0.85,
    sheenColor: '#a6ecf6',
    attenuationColor: '#13606e',
    attenuationDistance: 4,
  });
  mat.side = THREE.DoubleSide;
  for (let i = 0; i < 5; i++) {
    const points: THREE.Vector3[] = [];
    const baseR = innerRadius + 1.2 + i * 1.0;
    const turns = 18;
    for (let t = 0; t <= turns; t++) {
      const a = (t / turns) * Math.PI * 2;
      const wobble = Math.sin(a * 5 + i) * 0.6;
      points.push(
        new THREE.Vector3(
          Math.cos(a) * (baseR + wobble),
          Math.sin(a * 2 + i) * 1.2,
          Math.sin(a) * (baseR + wobble),
        ),
      );
    }
    const curve = new THREE.CatmullRomCurve3(points, true);
    const tube = new THREE.TubeGeometry(curve, 200, 0.2, 16, true);
    group.add(new THREE.Mesh(tube, mat));
  }
  return tag(group, 'er');
}

/** Cytoskeleton: a network of straight filaments spanning the cytoplasm. */
export function buildCytoskeleton(radius: number): Pickable {
  const group = new THREE.Group();
  const filaments = 60;
  const positions = new Float32Array(filaments * 2 * 3);
  for (let i = 0; i < filaments; i++) {
    const a = randomInSphere(radius * 0.95);
    const b = randomInSphere(radius * 0.95);
    positions.set([a.x, a.y, a.z, b.x, b.y, b.z], i * 6);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const lines = new THREE.LineSegments(
    geo,
    new THREE.LineBasicMaterial({
      color: new THREE.Color('#3fb5c6'),
      transparent: true,
      opacity: 0.22,
    }),
  );
  group.add(lines);
  return tag(group, 'cytoskeleton');
}

/** Vesicles: instanced transport bodies drifting through the cytoplasm. */
export function buildVesicles(count: number, radius: number): Pickable {
  const group = new THREE.Group();
  const geo = new THREE.SphereGeometry(0.34, 28, 28);
  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#5fd0c5'),
    emissive: new THREE.Color('#11433d'),
    emissiveIntensity: 0.4,
    roughness: 0.2,
    roughnessMap: cloneDetailTexture(getTissueGrain(), 1),
    clearcoat: 1,
    clearcoatRoughness: 0.2,
    transmission: 0.34,
    thickness: 0.7,
    ior: 1.36,
    sheen: 0.5,
    sheenColor: new THREE.Color('#bff4ee'),
    attenuationColor: new THREE.Color('#1d8377'),
    attenuationDistance: 1.5,
    envMapIntensity: 1.2,
    transparent: true,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const p = randomInSphere(radius * 0.9);
    dummy.position.copy(p);
    dummy.scale.setScalar(0.6 + Math.random() * 0.8);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  group.add(mesh);
  return tag(group, 'vesicles');
}

/** Ribosomes: dense clusters of tiny instanced particles. */
export function buildRibosomes(count: number, radius: number): Pickable {
  const group = new THREE.Group();
  const geo = new THREE.IcosahedronGeometry(0.14, 2);
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#bfe9ff'),
    emissive: new THREE.Color('#274b5a'),
    emissiveIntensity: 0.5,
    roughness: 0.5,
    envMapIntensity: 1,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  const dummy = new THREE.Object3D();
  const centers = [
    randomInSphere(radius * 0.6),
    randomInSphere(radius * 0.6),
    randomInSphere(radius * 0.6),
  ];
  for (let i = 0; i < count; i++) {
    const c = centers[i % centers.length];
    dummy.position.copy(c).add(randomInSphere(2.4));
    dummy.scale.setScalar(0.7 + Math.random() * 0.6);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  group.add(mesh);
  return tag(group, 'ribosomes');
}

/**
 * Lysosome: an acidic digestive vesicle. A translucent reddish skin wraps a
 * granular interior of instanced enzyme bodies, suggesting the dense lumen.
 */
export function buildLysosome(bump?: THREE.Texture): Pickable {
  const group = new THREE.Group();
  group.name = 'lysosome';

  const grain = cloneDetailTexture(getTissueGrain(), 2);
  const skin = new THREE.Mesh(
    new THREE.SphereGeometry(1.1, 96, 96),
    jelly({
      color: '#d8543e',
      emissive: '#48140c',
      emissiveIntensity: 0.5,
      transmission: 0.42,
      roughness: 0.34,
      bump,
      bumpScale: 0.16,
      roughnessMap: grain,
      opacity: 0.9,
      sheenColor: '#ffb9a3',
      attenuationColor: '#8a2c1c',
      attenuationDistance: 2,
    }),
  );
  group.add(skin);

  // Granular interior: a tight cloud of small enzyme granules.
  const granuleMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#ffb38f'),
    emissive: new THREE.Color('#7a2c12'),
    emissiveIntensity: 0.5,
    roughness: 0.6,
    envMapIntensity: 0.9,
  });
  const granuleGeo = new THREE.IcosahedronGeometry(0.08, 1);
  const grains = new THREE.InstancedMesh(granuleGeo, granuleMat, 90);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 90; i++) {
    dummy.position.copy(randomInSphere(0.85));
    dummy.scale.setScalar(0.6 + Math.random() * 0.9);
    dummy.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    dummy.updateMatrix();
    grains.setMatrixAt(i, dummy.matrix);
  }
  grains.instanceMatrix.needsUpdate = true;
  group.add(grains);

  return tag(group, 'lysosome');
}

/**
 * Peroxisome: a small vesicle distinguished by a dense, faceted crystalline
 * core (the urate oxidase crystalloid) floating in a pale matrix.
 */
export function buildPeroxisome(bump?: THREE.Texture): Pickable {
  const group = new THREE.Group();
  group.name = 'peroxisome';

  const grain = cloneDetailTexture(getTissueGrain(), 1.5);
  const skin = new THREE.Mesh(
    new THREE.SphereGeometry(0.9, 96, 96),
    jelly({
      color: '#8fd66a',
      emissive: '#264d12',
      emissiveIntensity: 0.45,
      transmission: 0.5,
      roughness: 0.3,
      bump,
      bumpScale: 0.13,
      roughnessMap: grain,
      opacity: 0.85,
      sheenColor: '#d6f6b9',
      attenuationColor: '#3f7a26',
      attenuationDistance: 2,
    }),
  );
  group.add(skin);

  // Crystalline core: a sharp, faceted, slightly metallic crystalloid.
  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.42, 0),
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#eaffcf'),
      emissive: new THREE.Color('#4a6e2a'),
      emissiveIntensity: 0.35,
      roughness: 0.12,
      metalness: 0.25,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      flatShading: true,
      envMapIntensity: 1.4,
    }),
  );
  core.rotation.set(0.4, 0.6, 0.2);
  group.add(core);

  return tag(group, 'peroxisome');
}

/**
 * Centriole: a barrel of nine microtubule triplets. Each triplet is three fused
 * tubes; the nine are arranged radially with the characteristic pinwheel skew.
 * Tube geometry keeps the cylinders smooth and instancing keeps it cheap.
 */
export function buildCentriole(bump?: THREE.Texture): Pickable {
  const group = new THREE.Group();
  group.name = 'centriole';

  const length = 2.4;
  const barrelR = 0.9;
  const tubeR = 0.075;

  // One reusable microtubule cylinder; 27 instances (9 triplets x 3).
  const tubeGeo = new THREE.CylinderGeometry(tubeR, tubeR, length, 14, 1, true);
  const tubeMat = jelly({
    color: '#6fbfd6',
    emissive: '#143b46',
    emissiveIntensity: 0.45,
    transmission: 0.2,
    roughness: 0.34,
    bump,
    bumpScale: 0.12,
    roughnessMap: cloneDetailTexture(getMuscleFibre(), 1),
    opacity: 0.96,
    sheenColor: '#bfeefa',
  });
  tubeMat.side = THREE.DoubleSide;
  const tubes = new THREE.InstancedMesh(tubeGeo, tubeMat, 27);
  const dummy = new THREE.Object3D();
  let idx = 0;
  for (let t = 0; t < 9; t++) {
    const ang = (t / 9) * Math.PI * 2;
    const cx = Math.cos(ang) * barrelR;
    const cz = Math.sin(ang) * barrelR;
    // Tangent direction along the ring gives the pinwheel skew of the triplet.
    const tang = new THREE.Vector3(-Math.sin(ang), 0, Math.cos(ang));
    for (let k = 0; k < 3; k++) {
      const offset = (k - 1) * tubeR * 2.0;
      dummy.position.set(cx + tang.x * offset, 0, cz + tang.z * offset);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      tubes.setMatrixAt(idx++, dummy.matrix);
    }
  }
  tubes.instanceMatrix.needsUpdate = true;
  group.add(tubes);

  // Cartwheel hub: a faint inner ring tying the triplets together.
  const hub = new THREE.Mesh(
    new THREE.TorusGeometry(barrelR * 0.45, 0.05, 12, 36),
    jelly({ color: '#9fe0ef', emissive: '#1e5564', transmission: 0.15, roughness: 0.4, bump }),
  );
  hub.rotation.x = Math.PI / 2;
  group.add(hub);

  // The classic centrosome holds two centrioles at right angles; add the second.
  const daughter = group.clone(true);
  daughter.position.set(barrelR * 1.6, 0, 0);
  daughter.rotation.z = Math.PI / 2;
  // clone(true) shares geometry and material references, so no extra disposal
  // is needed; core/dispose frees each unique resource once.
  group.add(daughter);

  return tag(group, 'centriole');
}

function randomInSphere(radius: number): THREE.Vector3 {
  const u = Math.random();
  const v = Math.random();
  const theta = u * Math.PI * 2;
  const phi = Math.acos(2 * v - 1);
  const r = radius * Math.cbrt(Math.random());
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi),
  );
}

export { TEAL };
