import * as THREE from 'three';
import { Scale } from '../../../types';

// Geometry builders for the cell environment. Each returns a Group tagged for
// raycast selection so CellScene stays focused on layout and animation. Shared
// geometries are created once and reused across instances by the caller.
//
// Organelles use physically based "jelly" materials: transmission and clearcoat
// give a wet, translucent surface, a procedural bump map adds fine relief, and
// the scene environment supplies soft reflections. Counts are kept modest so the
// interior reads as detailed rather than cluttered.

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
  transmission?: number;
  roughness?: number;
  bump?: THREE.Texture;
  bumpScale?: number;
  opacity?: number;
}): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(opts.color),
    emissive: new THREE.Color(opts.emissive ?? '#000000'),
    emissiveIntensity: opts.emissive ? 0.45 : 0,
    roughness: opts.roughness ?? 0.28,
    metalness: 0,
    transmission: opts.transmission ?? 0.45,
    thickness: 1.6,
    ior: 1.34,
    clearcoat: 1,
    clearcoatRoughness: 0.3,
    bumpMap: opts.bump,
    bumpScale: opts.bumpScale ?? 0.05,
    envMapIntensity: 1.1,
    transparent: true,
    opacity: opts.opacity ?? 1,
    side: THREE.FrontSide,
  });
}

/** Semi-transparent lipid membrane bounding the whole cell. */
export function buildMembrane(radius: number, bump?: THREE.Texture): THREE.Mesh {
  const geo = new THREE.SphereGeometry(radius, 96, 96);
  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#0e7c8c'),
    transparent: true,
    opacity: 0.14,
    roughness: 0.18,
    transmission: 0.7,
    thickness: 3,
    ior: 1.33,
    clearcoat: 1,
    clearcoatRoughness: 0.2,
    iridescence: 0.4,
    iridescenceIOR: 1.3,
    side: THREE.BackSide,
    emissive: new THREE.Color('#062a31'),
    emissiveIntensity: 0.35,
    bumpMap: bump,
    bumpScale: 0.04,
    envMapIntensity: 1.2,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'membrane';
  return mesh;
}

/** Nucleus: envelope plus a tangle of chromatin filaments. */
export function buildNucleus(radius: number, bump?: THREE.Texture): Pickable {
  const group = new THREE.Group();
  group.name = 'nucleus';

  const envelope = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 64, 64),
    jelly({ color: '#3a6ea5', emissive: '#15314f', transmission: 0.55, roughness: 0.3, bump, opacity: 0.6 }),
  );
  group.add(envelope);

  // Chromatin as a dense tangle of short tube strands for real 3D relief.
  const strandMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#9ad0ff'),
    emissive: new THREE.Color('#22557a'),
    emissiveIntensity: 0.4,
    roughness: 0.6,
  });
  const strands = 90;
  for (let i = 0; i < strands; i++) {
    const a = randomInSphere(radius * 0.78);
    const pts: THREE.Vector3[] = [a.clone()];
    for (let s = 0; s < 3; s++) {
      pts.push(pts[pts.length - 1].clone().add(randomInSphere(radius * 0.22)));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.TubeGeometry(curve, 8, 0.05 + Math.random() * 0.04, 5, false);
    group.add(new THREE.Mesh(tube, strandMat));
  }

  const nucleolus = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 0.3, 32, 32),
    jelly({ color: '#1d4e6e', emissive: '#0c2c40', transmission: 0.3, roughness: 0.4, bump }),
  );
  nucleolus.position.set(radius * 0.2, -radius * 0.1, radius * 0.15);
  group.add(nucleolus);

  return tag(group, 'nucleus');
}

/** Mitochondrion: outer capsule with folded inner cristae. */
export function buildMitochondrion(bump?: THREE.Texture): Pickable {
  const group = new THREE.Group();
  const outer = new THREE.Mesh(
    new THREE.CapsuleGeometry(1.0, 2.4, 12, 28),
    jelly({ color: '#e2a13c', emissive: '#5a3a0a', transmission: 0.25, roughness: 0.3, bump, bumpScale: 0.08, opacity: 0.92 }),
  );
  outer.rotation.z = Math.PI / 2;
  group.add(outer);

  // Cristae: stacked partial tori threaded through the long axis.
  const cristaeMat = jelly({ color: '#ffcf7a', emissive: '#7a4d10', transmission: 0.15, roughness: 0.35, bump });
  cristaeMat.side = THREE.DoubleSide;
  const cristaGeo = new THREE.TorusGeometry(0.85, 0.13, 12, 28, Math.PI * 1.3);
  for (let i = 0; i < 7; i++) {
    const crista = new THREE.Mesh(cristaGeo, cristaeMat);
    crista.position.x = -1.7 + i * 0.56;
    crista.rotation.y = Math.PI / 2;
    crista.rotation.z = i * 0.5;
    group.add(crista);
  }
  return tag(group, 'mitochondrion');
}

/** Golgi apparatus: a stack of curved, flattened cisternae. */
export function buildGolgi(bump?: THREE.Texture): Pickable {
  const group = new THREE.Group();
  const mat = jelly({ color: '#c879c2', emissive: '#3f1d3d', transmission: 0.3, roughness: 0.3, bump, opacity: 0.92 });
  mat.side = THREE.DoubleSide;
  for (let i = 0; i < 5; i++) {
    const radius = 2.2 - i * 0.28;
    const geo = new THREE.TorusGeometry(radius, 0.18, 16, 48, Math.PI * 1.1);
    const cisterna = new THREE.Mesh(geo, mat);
    cisterna.position.y = i * 0.5;
    cisterna.scale.y = 0.45;
    cisterna.rotation.x = Math.PI / 2;
    group.add(cisterna);
  }
  return tag(group, 'golgi');
}

/** Endoplasmic reticulum: folded branching tubular sheets around the nucleus. */
export function buildER(innerRadius: number, bump?: THREE.Texture): Pickable {
  const group = new THREE.Group();
  const mat = jelly({ color: '#2f9fb3', emissive: '#0c3b44', transmission: 0.35, roughness: 0.32, bump, opacity: 0.85 });
  mat.side = THREE.DoubleSide;
  for (let i = 0; i < 4; i++) {
    const points: THREE.Vector3[] = [];
    const baseR = innerRadius + 1.2 + i * 1.1;
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
    const tube = new THREE.TubeGeometry(curve, 140, 0.2, 10, true);
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
  const geo = new THREE.SphereGeometry(0.34, 18, 18);
  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#5fd0c5'),
    emissive: new THREE.Color('#11433d'),
    emissiveIntensity: 0.4,
    roughness: 0.2,
    clearcoat: 1,
    clearcoatRoughness: 0.2,
    transmission: 0.3,
    thickness: 0.6,
    envMapIntensity: 1.1,
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
  const geo = new THREE.IcosahedronGeometry(0.14, 1);
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
