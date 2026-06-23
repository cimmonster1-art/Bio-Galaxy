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
