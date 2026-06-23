import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { PreviewModel } from '../data/searchPreview';
import type { AtomCoord } from '../data/clients/rcsbClient';

interface Props {
  model: PreviewModel | null;
}

// CPK-style element colours and relative van der Waals radii (normalized to C),
// matching the molecular scale used elsewhere in the atlas.
const ELEMENT_COLOR: Record<string, string> = {
  C: '#cfd8dc', N: '#5b8def', O: '#ef5b6b', S: '#e6c54a', P: '#e6964a',
  H: '#f0f4f8', FE: '#e0793b', MG: '#3bd07a', ZN: '#7d8aa0', CA: '#5fd0c5',
  CL: '#6fe07a', NA: '#8f6fe0', F: '#9ff0c0', BR: '#b5663b', I: '#a05fd0',
};
const ELEMENT_RADIUS: Record<string, number> = {
  H: 0.55, C: 1.0, N: 0.95, O: 0.92, S: 1.2, P: 1.2, F: 0.8, CL: 1.1, FE: 1.3,
};
const color = (el: string): string => ELEMENT_COLOR[el.toUpperCase()] ?? '#b0bec5';
const radius = (el: string): number => ELEMENT_RADIUS[el.toUpperCase()] ?? 1.0;

// Hydropathy-ish residue grouping, used to colour a typed peptide by chemistry.
const RESIDUE_COLOR: Record<string, string> = {
  A: '#cfd8dc', V: '#cfd8dc', L: '#cfd8dc', I: '#cfd8dc', M: '#cfd8dc', F: '#b9c2c8', W: '#b9c2c8', P: '#b9c2c8', G: '#dfe7ec',
  S: '#5fd0c5', T: '#5fd0c5', C: '#e6c54a', Y: '#5fd0c5', N: '#7fd0a0', Q: '#7fd0a0',
  D: '#ef5b6b', E: '#ef5b6b', K: '#5b8def', R: '#5b8def', H: '#8f9fe0',
};

const TARGET_RADIUS = 9;

/** Recenter coordinates on their centroid and return a uniform fit scale. */
function fit(points: THREE.Vector3[]): number {
  if (points.length === 0) return 1;
  const c = new THREE.Vector3();
  for (const p of points) c.add(p);
  c.multiplyScalar(1 / points.length);
  let maxR = 0;
  for (const p of points) {
    p.sub(c);
    maxR = Math.max(maxR, p.length());
  }
  return maxR > 0 ? TARGET_RADIUS / maxR : 1;
}

/**
 * A live, self-contained Three.js preview of whatever the search bar resolves to:
 * a protein backbone ribbon, a small-molecule ball-and-stick conformer, an
 * idealized peptide helix, a DNA helix, or a cosmic stand-in. The scene is built
 * once and only its content group is rebuilt as the model changes; everything is
 * disposed on unmount so repeated searches never leak GPU memory.
 */
export const SearchPreview3D: React.FC<Props> = ({ model }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const contentRef = useRef<THREE.Group | null>(null);
  const frameRef = useRef(0);
  const spinRef = useRef<((dt: number, t: number) => void) | null>(null);

  // One-time scene, camera, lighting, and render loop.
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch {
      return; // No WebGL: the surrounding panel still shows the text labels.
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
    camera.position.set(0, 0, 30);
    cameraRef.current = camera;

    scene.add(new THREE.AmbientLight(0x9fb8d8, 0.7));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(6, 10, 12);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x4fd0e6, 0.9);
    rim.position.set(-10, -4, -8);
    scene.add(rim);

    const resize = (): void => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    let last = performance.now();
    const loop = (now: number): void => {
      frameRef.current = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const content = contentRef.current;
      if (content) {
        content.rotation.y += dt * 0.5;
        spinRef.current?.(dt, now / 1000);
      }
      renderer.render(scene, camera);
    };
    frameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameRef.current);
      observer.disconnect();
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        mesh.geometry?.dispose?.();
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat?.dispose();
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      rendererRef.current = null;
    };
  }, []);

  // Rebuild the content group whenever the resolved model changes.
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (contentRef.current) {
      scene.remove(contentRef.current);
      disposeGroup(contentRef.current);
      contentRef.current = null;
    }
    spinRef.current = null;
    if (!model) return;

    const group = new THREE.Group();
    spinRef.current = buildModel(group, model);
    scene.add(group);
    contentRef.current = group;
  }, [model]);

  return <div ref={mountRef} className="h-full w-full" aria-hidden />;
};

/** Build the geometry for a model into `group`; returns an optional per-frame tick. */
function buildModel(group: THREE.Group, model: PreviewModel): ((dt: number, t: number) => void) | null {
  switch (model.kind) {
    case 'backbone': return buildBackbone(group, model.chains);
    case 'ballstick': return buildBallStick(group, model.atoms, model.bonds);
    case 'peptide': return buildPeptide(group, model.residues);
    case 'dna': return buildDna(group);
    case 'atom': return buildAtom(group, model.protons, model.symbol);
    case 'galaxy': return buildGalaxy(group);
    case 'organelle': return buildMitochondrion(group);
    case 'rbc': return buildRedBloodCell(group);
    case 'star': return buildStar(group, model.color);
    case 'planet': return buildPlanet(group, model.color);
    case 'cell': return buildCell(group);
  }
}

/** Smooth multi-chain ribbon tube through alpha-carbon coordinates, N→C coloured. */
function buildBackbone(group: THREE.Group, chains: AtomCoord[][]): null {
  const all: THREE.Vector3[] = [];
  const perChain = chains.map((c) => c.map((a) => new THREE.Vector3(a.x, a.y, a.z)));
  perChain.forEach((c) => all.push(...c.map((v) => v.clone())));
  const scale = fit(all);
  // `fit` mutated copies; recompute the same centering on the live points.
  const centroid = new THREE.Vector3();
  let n = 0;
  perChain.forEach((c) => c.forEach((v) => { centroid.add(v); n++; }));
  centroid.multiplyScalar(1 / Math.max(1, n));

  perChain.forEach((points, ci) => {
    const local = points.map((v) => v.clone().sub(centroid).multiplyScalar(scale));
    if (local.length < 2) return;
    const curve = new THREE.CatmullRomCurve3(local, false, 'centripetal');
    const tubular = Math.min(600, Math.max(24, local.length * 6));
    const geo = new THREE.TubeGeometry(curve, tubular, 0.42, 10, false);
    // Colour the tube along its length: a spectral N→C gradient per chain.
    const colors: number[] = [];
    const pos = geo.attributes.position;
    const hueBase = (ci * 0.18) % 1;
    const tmp = new THREE.Color();
    const radial = 10 + 1;
    for (let i = 0; i < pos.count; i++) {
      const t = Math.floor(i / radial) / Math.max(1, tubular);
      tmp.setHSL((hueBase + 0.62 - t * 0.62 + 1) % 1, 0.62, 0.6);
      colors.push(tmp.r, tmp.g, tmp.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, metalness: 0.1 });
    group.add(new THREE.Mesh(geo, mat));
  });
  return null;
}

/** Instanced atom spheres plus oriented cylinder bonds for a small molecule. */
function buildBallStick(group: THREE.Group, atoms: AtomCoord[], bonds: [number, number][]): null {
  const pts = atoms.map((a) => new THREE.Vector3(a.x, a.y, a.z));
  const scale = fit(pts); // recenters pts in place
  const small = atoms.length > 40;
  const atomGeo = new THREE.IcosahedronGeometry(small ? 0.34 : 0.5, small ? 2 : 3);
  const mat = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.18, metalness: 0, clearcoat: 0.85, clearcoatRoughness: 0.25 });
  const mesh = new THREE.InstancedMesh(atomGeo, mat, atoms.length);
  mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(atoms.length * 3), 3);
  const dummy = new THREE.Object3D();
  const col = new THREE.Color();
  atoms.forEach((a, i) => {
    dummy.position.copy(pts[i]);
    dummy.scale.setScalar(radius(a.element) * (small ? 0.7 : 0.9));
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    mesh.setColorAt(i, col.set(color(a.element)));
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  group.add(mesh);

  // Bonds: use the SDF table when present, otherwise infer by distance.
  const pairs = bonds.length ? bonds : inferBonds(pts, 1.85 * scale);
  if (pairs.length) {
    const bondGeo = new THREE.CylinderGeometry(0.11, 0.11, 1, 12);
    const bondMat = new THREE.MeshStandardMaterial({ color: '#e3ebf2', emissive: '#30414d', emissiveIntensity: 0.3, roughness: 0.4 });
    const bondMesh = new THREE.InstancedMesh(bondGeo, bondMat, pairs.length);
    const up = new THREE.Vector3(0, 1, 0);
    const dir = new THREE.Vector3();
    const mid = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const m = new THREE.Matrix4();
    pairs.forEach(([i, j], b) => {
      const pi = pts[i];
      const pj = pts[j];
      dir.subVectors(pj, pi);
      const len = dir.length();
      mid.addVectors(pi, pj).multiplyScalar(0.5);
      q.setFromUnitVectors(up, dir.clone().normalize());
      m.compose(mid, q, new THREE.Vector3(1, len, 1));
      bondMesh.setMatrixAt(b, m);
    });
    bondMesh.instanceMatrix.needsUpdate = true;
    group.add(bondMesh);
  }
  return null;
}

/** Idealized alpha helix for a typed residue sequence: tube + per-residue beads. */
function buildPeptide(group: THREE.Group, residues: string): null {
  const RISE = 1.5; // Å per residue
  const TURN = (100 * Math.PI) / 180; // ~3.6 residues per turn
  const R = 2.3;
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < residues.length; i++) {
    const a = i * TURN;
    pts.push(new THREE.Vector3(Math.cos(a) * R, i * RISE - (residues.length * RISE) / 2, Math.sin(a) * R));
  }
  const scale = fit(pts);
  pts.forEach((p) => p.multiplyScalar(scale));

  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const tubeGeo = new THREE.TubeGeometry(curve, Math.min(600, residues.length * 8), 0.5 * scale * 1, 10, false);
  group.add(new THREE.Mesh(tubeGeo, new THREE.MeshStandardMaterial({ color: '#8fb8d8', roughness: 0.5, metalness: 0.1, transparent: true, opacity: 0.55 })));

  const beadGeo = new THREE.IcosahedronGeometry(0.55 * scale, 2);
  const beadMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, metalness: 0.05 });
  const mesh = new THREE.InstancedMesh(beadGeo, beadMat, residues.length);
  mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(residues.length * 3), 3);
  const dummy = new THREE.Object3D();
  const col = new THREE.Color();
  for (let i = 0; i < residues.length; i++) {
    dummy.position.copy(pts[i]);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    mesh.setColorAt(i, col.set(RESIDUE_COLOR[residues[i]] ?? '#cfd8dc'));
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  group.add(mesh);
  return null;
}

/** A short B-form DNA double helix with colour-coded base-pair rungs. */
function buildDna(group: THREE.Group): null {
  const N = 26;
  const R = 3.2;
  const pitch = 0.62;
  const twist = 0.62;
  const a: THREE.Vector3[] = [];
  const b: THREE.Vector3[] = [];
  for (let i = 0; i < N; i++) {
    const ang = i * twist;
    const y = i * pitch - (N * pitch) / 2;
    a.push(new THREE.Vector3(Math.cos(ang) * R, y, Math.sin(ang) * R));
    b.push(new THREE.Vector3(Math.cos(ang + Math.PI) * R, y, Math.sin(ang + Math.PI) * R));
  }
  const backMat = new THREE.MeshStandardMaterial({ color: '#e6964a', emissive: '#4a2e10', emissiveIntensity: 0.35, roughness: 0.4 });
  group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(a), 120, 0.34, 10, false), backMat));
  group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(b), 120, 0.34, 10, false), backMat));
  const rungGeo = new THREE.CylinderGeometry(0.16, 0.16, 1, 8);
  const pairColors = ['#5b8def', '#ef5b6b', '#5fd0c5', '#e6c54a'];
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < N; i++) {
    const dir = b[i].clone().sub(a[i]);
    const len = dir.length();
    const mid = a[i].clone().add(b[i]).multiplyScalar(0.5);
    const q = new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize());
    const m = new THREE.Mesh(rungGeo, new THREE.MeshStandardMaterial({ color: pairColors[i % 4], emissive: '#101820', emissiveIntensity: 0.3, roughness: 0.5 }));
    m.position.copy(mid);
    m.quaternion.copy(q);
    m.scale.set(1, len, 1);
    group.add(m);
  }
  return null;
}

// Simplified Bohr shell capacities (K, L, M, ... ) used to lay electrons out
// into concentric orbits. This is the schematic model taught in chemistry, not
// the true quantum orbital, and the preview labels it as such.
const SHELL_CAPACITY = [2, 8, 8, 18, 18, 32];

/** Distribute `z` electrons across schematic Bohr shells. */
function shellCounts(z: number): number[] {
  const shells: number[] = [];
  let left = z;
  for (const cap of SHELL_CAPACITY) {
    if (left <= 0) break;
    const n = Math.min(cap, left);
    shells.push(n);
    left -= n;
  }
  if (left > 0) shells.push(left); // very heavy elements: spill into one more ring
  return shells;
}

/**
 * A schematic atom: a packed nucleus of proton/neutron nucleons surrounded by
 * glowing electron shells. Electrons are beads that orbit their ring each frame,
 * and the rings themselves are faint additive tori, so the whole thing reads as a
 * luminous Bohr model. Scaled so even hydrogen and uranium fit the same frame.
 */
function buildAtom(group: THREE.Group, protons: number, _symbol: string): (dt: number, t: number) => void {
  const shells = shellCounts(protons);
  // Nucleus: a rough sphere-packing of red protons and blue-grey neutrons.
  const nucleons = Math.min(60, protons * 2);
  const nucGeo = new THREE.IcosahedronGeometry(0.62, 2);
  const nucMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0.1, emissive: '#220a0a', emissiveIntensity: 0.25 });
  const nucMesh = new THREE.InstancedMesh(nucGeo, nucMat, nucleons);
  nucMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(nucleons * 3), 3);
  const dummy = new THREE.Object3D();
  const col = new THREE.Color();
  const nucRadius = 0.55 + Math.cbrt(protons) * 0.42;
  for (let i = 0; i < nucleons; i++) {
    // Fibonacci-sphere shell placement, jittered inward for a packed-cluster look.
    const y = 1 - (i / Math.max(1, nucleons - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const phi = i * 2.39996;
    const rr = nucRadius * (0.35 + 0.65 * Math.cbrt((i + 1) / nucleons));
    dummy.position.set(Math.cos(phi) * r * rr, y * rr, Math.sin(phi) * r * rr);
    dummy.scale.setScalar(0.9);
    dummy.updateMatrix();
    nucMesh.setMatrixAt(i, dummy.matrix);
    nucMesh.setColorAt(i, col.set(i % 2 === 0 ? '#ef5b6b' : '#9fb0c4'));
  }
  nucMesh.instanceMatrix.needsUpdate = true;
  if (nucMesh.instanceColor) nucMesh.instanceColor.needsUpdate = true;
  group.add(nucMesh);

  // Electron shells: faint rings plus orbiting electron beads.
  const innerR = nucRadius + 1.6;
  const gap = (9 - innerR) / Math.max(1, shells.length);
  const electronGeo = new THREE.SphereGeometry(0.28, 16, 16);
  const tickers: ((t: number) => void)[] = [];
  shells.forEach((count, s) => {
    const ringR = innerR + gap * s;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(ringR, 0.025, 8, 96),
      new THREE.MeshBasicMaterial({ color: '#4fd0e6', transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    ring.rotation.x = Math.PI / 2 + (s - shells.length / 2) * 0.18;
    ring.rotation.z = s * 0.4;
    group.add(ring);

    const eMat = new THREE.MeshStandardMaterial({ color: '#9fe8ff', emissive: '#2fb0e0', emissiveIntensity: 1.4, roughness: 0.3 });
    const eMesh = new THREE.InstancedMesh(electronGeo, eMat, count);
    group.add(eMesh);
    const phase = s * 0.7;
    const dir = s % 2 === 0 ? 1 : -1; // alternate orbital direction per shell
    const tilt = ring.rotation.clone();
    tickers.push((t: number) => {
      const m = new THREE.Matrix4();
      const e = new THREE.Euler(tilt.x, tilt.y, tilt.z);
      const q = new THREE.Quaternion().setFromEuler(e);
      const p = new THREE.Vector3();
      for (let i = 0; i < count; i++) {
        const a = phase + (i / count) * Math.PI * 2 + dir * t * (1.4 - s * 0.12);
        p.set(Math.cos(a) * ringR, 0, Math.sin(a) * ringR).applyQuaternion(q);
        m.makeTranslation(p.x, p.y, p.z);
        eMesh.setMatrixAt(i, m);
      }
      eMesh.instanceMatrix.needsUpdate = true;
    });
  });

  return (_dt, t) => { for (const tick of tickers) tick(t); };
}

/**
 * A procedural spiral galaxy: hundreds of thousands of additive points wound into
 * logarithmic arms, warm and dense in the core, cool and sparse at the rim, with
 * a luminous central bulge. Differential rotation makes the arms shear like a real
 * disk. Sized to the same frame as every other preview.
 */
function buildGalaxy(group: THREE.Group): (dt: number, t: number) => void {
  const COUNT = 14000;
  const ARMS = 4;
  const RADIUS = 9;
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const radii = new Float32Array(COUNT);
  const inner = new THREE.Color('#fff2cc');
  const outer = new THREE.Color('#5b8def');
  const tmp = new THREE.Color();
  for (let i = 0; i < COUNT; i++) {
    const t = Math.pow(Math.random(), 0.6); // bias toward the centre
    const r = t * RADIUS;
    const arm = (i % ARMS) / ARMS;
    // Logarithmic spiral angle plus a radius-dependent scatter for arm thickness.
    const spin = r * 0.55;
    const spread = (1 - t) * 0.6 + 0.08;
    const angle = arm * Math.PI * 2 + spin + (Math.random() - 0.5) * spread;
    const thickness = (Math.random() - 0.5) * (0.6 - t * 0.5);
    positions[i * 3] = Math.cos(angle) * r + (Math.random() - 0.5) * spread;
    positions[i * 3 + 1] = thickness;
    positions[i * 3 + 2] = Math.sin(angle) * r + (Math.random() - 0.5) * spread;
    radii[i] = r;
    tmp.copy(inner).lerp(outer, t);
    colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({ size: 0.12, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
  const points = new THREE.Points(geo, mat);
  group.add(points);

  // Bright central bulge.
  const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite(), color: '#fff0c0', transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending }));
  core.scale.setScalar(7);
  group.add(core);

  const pos = geo.attributes.position as THREE.BufferAttribute;
  const base = positions.slice();
  return (_dt, t) => {
    // Differential rotation: inner radii sweep faster than the rim.
    for (let i = 0; i < COUNT; i++) {
      const r = radii[i];
      const a = t * (0.5 / (0.5 + r * 0.25));
      const x = base[i * 3], z = base[i * 3 + 2];
      pos.array[i * 3] = x * Math.cos(a) - z * Math.sin(a);
      pos.array[i * 3 + 2] = x * Math.sin(a) + z * Math.cos(a);
    }
    pos.needsUpdate = true;
  };
}

/**
 * A mitochondrion: an outer membrane capsule wrapping a folded inner membrane
 * whose cristae are the deep infoldings where ATP is made. The cristae are a row
 * of half-tori threaded along the long axis, and the whole organelle breathes
 * gently to read as living tissue rather than a static prop.
 */
function buildMitochondrion(group: THREE.Group): (dt: number, t: number) => void {
  const LEN = 11, RAD = 4.4;
  // Outer membrane: a translucent stadium-shaped capsule (stretched sphere).
  const outer = new THREE.Mesh(
    new THREE.SphereGeometry(RAD, 48, 32),
    new THREE.MeshPhysicalMaterial({ color: '#c4623f', transparent: true, opacity: 0.22, roughness: 0.4, transmission: 0.5, thickness: 2, side: THREE.DoubleSide }),
  );
  outer.scale.set(LEN / (2 * RAD), 1, 1);
  group.add(outer);
  // Inner matrix: a warmer, denser core.
  const inner = new THREE.Mesh(
    new THREE.SphereGeometry(RAD * 0.82, 40, 28),
    new THREE.MeshStandardMaterial({ color: '#e0884c', emissive: '#3a1606', emissiveIntensity: 0.4, roughness: 0.6, transparent: true, opacity: 0.5 }),
  );
  inner.scale.set(LEN / (2 * RAD) * 0.92, 0.92, 0.92);
  group.add(inner);

  // Cristae: shelf-like infoldings of the inner membrane along the long axis.
  const cristaMat = new THREE.MeshStandardMaterial({ color: '#f0a35c', emissive: '#5a2408', emissiveIntensity: 0.5, roughness: 0.5, side: THREE.DoubleSide, transparent: true, opacity: 0.92 });
  const cristae: THREE.Mesh[] = [];
  const n = 9;
  for (let i = 0; i < n; i++) {
    const f = (i / (n - 1)) * 2 - 1; // -1..1 along the axis
    const x = f * (LEN / 2 - 1.6);
    const r = RAD * 0.74 * Math.sqrt(Math.max(0.05, 1 - f * f * 0.85));
    const crista = new THREE.Mesh(new THREE.TorusGeometry(r, 0.32, 10, 40, Math.PI * 1.3), cristaMat);
    crista.position.x = x;
    crista.rotation.y = Math.PI / 2;
    crista.rotation.z = (i % 2 ? 1 : -1) * 0.5;
    group.add(crista);
    cristae.push(crista);
  }
  return (_dt, t) => {
    const s = 1 + Math.sin(t * 1.1) * 0.025;
    outer.scale.y = s; outer.scale.z = s;
  };
}

/**
 * A red blood cell: the signature biconcave disk, built as a lathe of the
 * erythrocyte cross-section so the dimpled centre and rounded rim are real
 * geometry, with a faint haemoglobin-tinted sheen.
 */
function buildRedBloodCell(group: THREE.Group): null {
  // Cross-section profile (radius r) from centre to rim; dimpled in the middle.
  const profile: THREE.Vector2[] = [];
  const R = 7.5;
  const steps = 24;
  for (let i = 0; i <= steps; i++) {
    const r = (i / steps) * R;
    const u = r / R;
    // Biconcave thickness: thin at centre, bulge near rim, taper to edge.
    const thick = (0.9 + 2.6 * Math.pow(u, 2.2) - 1.7 * Math.pow(u, 6)) * (1 - Math.pow(u, 10));
    profile.push(new THREE.Vector2(r, thick));
  }
  // Mirror to the lower half so the lathe closes top and bottom.
  const full = [
    ...profile.map((p) => new THREE.Vector2(p.x, p.y)),
    ...profile.slice().reverse().map((p) => new THREE.Vector2(p.x, -p.y)),
  ];
  const geo = new THREE.LatheGeometry(full, 64);
  geo.computeVertexNormals();
  const mat = new THREE.MeshPhysicalMaterial({ color: '#c0303a', emissive: '#3a0608', emissiveIntensity: 0.35, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.4, sheen: 1, sheenColor: new THREE.Color('#ff8a8a') });
  const cell = new THREE.Mesh(geo, mat);
  cell.rotation.x = Math.PI / 2.6;
  group.add(cell);
  return null;
}

/** A luminous star: emissive core plus an additive corona sprite. */
function buildStar(group: THREE.Group, hex: string): (dt: number, t: number) => void {
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(6, 4),
    new THREE.MeshStandardMaterial({ color: hex, emissive: hex, emissiveIntensity: 1.4, roughness: 0.6 }),
  );
  group.add(core);
  const tex = glowSprite();
  const corona = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: hex, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }));
  corona.scale.setScalar(22);
  group.add(corona);
  return (_dt, t) => { corona.scale.setScalar(22 + Math.sin(t * 1.5) * 1.2); };
}

/** A simply shaded planet sphere with a soft atmospheric rim. */
function buildPlanet(group: THREE.Group, hex: string): null {
  group.add(new THREE.Mesh(
    new THREE.SphereGeometry(7, 48, 48),
    new THREE.MeshStandardMaterial({ color: hex, roughness: 0.85, metalness: 0.05 }),
  ));
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(7.5, 48, 48),
    new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.12, side: THREE.BackSide, blending: THREE.AdditiveBlending }),
  );
  group.add(halo);
  return null;
}

/** A translucent generic cell with a nucleus, for results without a structure. */
function buildCell(group: THREE.Group): null {
  group.add(new THREE.Mesh(
    new THREE.SphereGeometry(8, 48, 48),
    new THREE.MeshPhysicalMaterial({ color: '#39d4e6', transparent: true, opacity: 0.16, roughness: 0.3, transmission: 0.6, thickness: 2 }),
  ));
  group.add(new THREE.Mesh(
    new THREE.SphereGeometry(3.2, 36, 36),
    new THREE.MeshStandardMaterial({ color: '#5b8def', emissive: '#1a2c5a', emissiveIntensity: 0.4, roughness: 0.4 }),
  ));
  return null;
}

function inferBonds(points: THREE.Vector3[], threshold: number): [number, number][] {
  const out: [number, number][] = [];
  const t2 = threshold * threshold;
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      if (points[i].distanceToSquared(points[j]) < t2) out.push([i, j]);
    }
  }
  return out;
}

let glowTexture: THREE.Texture | null = null;
function glowSprite(): THREE.Texture {
  if (glowTexture) return glowTexture;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.5)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  glowTexture = new THREE.CanvasTexture(canvas);
  return glowTexture;
}

function disposeGroup(group: THREE.Group): void {
  group.traverse((o) => {
    const mesh = o as THREE.Mesh;
    mesh.geometry?.dispose?.();
    const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
    else mat?.dispose();
  });
}
