import * as THREE from 'three';
import { Scale } from '../../../types';

// Geometry builders for the cell environment. Each returns a Group tagged for
// raycast selection so CellScene stays focused on layout and animation. Shared
// geometries are created once and reused across instances by the caller.

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

/** Semi-transparent lipid membrane bounding the whole cell. */
export function buildMembrane(radius: number): THREE.Mesh {
  const geo = new THREE.SphereGeometry(radius, 64, 64);
  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#0e7c8c'),
    transparent: true,
    opacity: 0.12,
    roughness: 0.25,
    transmission: 0.6,
    thickness: 2,
    side: THREE.BackSide,
    emissive: new THREE.Color('#062a31'),
    emissiveIntensity: 0.4,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'membrane';
  return mesh;
}

/** Nucleus: envelope plus a tangle of chromatin filaments. */
export function buildNucleus(radius: number): Pickable {
  const group = new THREE.Group();
  group.name = 'nucleus';

  const envelope = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 48, 48),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#3a6ea5'),
      transparent: true,
      opacity: 0.4,
      roughness: 0.4,
      emissive: new THREE.Color('#15314f'),
      emissiveIntensity: 0.6,
    }),
  );
  group.add(envelope);

  // Chromatin as a single LineSegments cloud of short strands.
  const strands = 220;
  const positions = new Float32Array(strands * 2 * 3);
  for (let i = 0; i < strands; i++) {
    const a = randomInSphere(radius * 0.82);
    const b = a.clone().add(randomInSphere(radius * 0.18));
    positions.set([a.x, a.y, a.z, b.x, b.y, b.z], i * 6);
  }
  const chromGeo = new THREE.BufferGeometry();
  chromGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const chromatin = new THREE.LineSegments(
    chromGeo,
    new THREE.LineBasicMaterial({
      color: new THREE.Color('#9ad0ff'),
      transparent: true,
      opacity: 0.5,
    }),
  );
  group.add(chromatin);

  // Nucleolus.
  const nucleolus = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 0.3, 24, 24),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#1d4e6e'),
      emissive: new THREE.Color('#0c2c40'),
      emissiveIntensity: 0.5,
      roughness: 0.5,
    }),
  );
  group.add(nucleolus);

  return tag(group, 'nucleus');
}

/** Mitochondrion: outer capsule with folded inner cristae. */
export function buildMitochondrion(): Pickable {
  const group = new THREE.Group();
  const outer = new THREE.Mesh(
    new THREE.CapsuleGeometry(1.0, 2.4, 8, 20),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color('#e2a13c'),
      emissive: new THREE.Color('#5a3a0a'),
      emissiveIntensity: 0.5,
      roughness: 0.45,
      transparent: true,
      opacity: 0.85,
    }),
  );
  outer.rotation.z = Math.PI / 2;
  group.add(outer);

  // Cristae: stacked partial tori threaded through the long axis.
  const cristaeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#ffcf7a'),
    emissive: new THREE.Color('#7a4d10'),
    emissiveIntensity: 0.4,
    roughness: 0.5,
    side: THREE.DoubleSide,
  });
  const cristaGeo = new THREE.TorusGeometry(0.85, 0.12, 8, 24, Math.PI * 1.3);
  for (let i = 0; i < 6; i++) {
    const crista = new THREE.Mesh(cristaGeo, cristaeMat);
    crista.position.x = -1.6 + i * 0.64;
    crista.rotation.y = Math.PI / 2;
    crista.rotation.z = i * 0.5;
    group.add(crista);
  }
  return tag(group, 'mitochondrion');
}

/** Golgi apparatus: a stack of curved, flattened cisternae. */
export function buildGolgi(): Pickable {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#c879c2'),
    emissive: new THREE.Color('#3f1d3d'),
    emissiveIntensity: 0.5,
    roughness: 0.5,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9,
  });
  for (let i = 0; i < 5; i++) {
    const radius = 2.2 - i * 0.28;
    const geo = new THREE.TorusGeometry(radius, 0.16, 10, 40, Math.PI * 1.1);
    const cisterna = new THREE.Mesh(geo, mat);
    cisterna.position.y = i * 0.5;
    cisterna.scale.y = 0.45;
    cisterna.rotation.x = Math.PI / 2;
    group.add(cisterna);
  }
  return tag(group, 'golgi');
}

/** Endoplasmic reticulum: folded branching tubular sheets around the nucleus. */
export function buildER(innerRadius: number): Pickable {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#2f9fb3'),
    emissive: new THREE.Color('#0c3b44'),
    emissiveIntensity: 0.5,
    roughness: 0.5,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.75,
  });
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
    const tube = new THREE.TubeGeometry(curve, 120, 0.18, 8, true);
    group.add(new THREE.Mesh(tube, mat));
  }
  return tag(group, 'er');
}

/** Cytoskeleton: a network of straight filaments spanning the cytoplasm. */
export function buildCytoskeleton(radius: number): Pickable {
  const group = new THREE.Group();
  const filaments = 70;
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
      color: new THREE.Color('#1f8a99'),
      transparent: true,
      opacity: 0.25,
    }),
  );
  group.add(lines);
  return tag(group, 'cytoskeleton');
}

/** Vesicles: instanced transport bodies drifting through the cytoplasm. */
export function buildVesicles(count: number, radius: number): Pickable {
  const group = new THREE.Group();
  const geo = new THREE.SphereGeometry(0.32, 12, 12);
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#5fd0c5'),
    emissive: new THREE.Color('#11433d'),
    emissiveIntensity: 0.5,
    roughness: 0.4,
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
  const geo = new THREE.SphereGeometry(0.12, 8, 8);
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#bfe9ff'),
    emissive: new THREE.Color('#274b5a'),
    emissiveIntensity: 0.5,
    roughness: 0.6,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  const dummy = new THREE.Object3D();
  // Three loose clusters.
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
