import * as THREE from 'three';
import { Scale } from '../../types';
import { SceneLayer, fadeMaterial } from '../core/SceneLayer';
import { disposeObject } from '../core/dispose';
import { createGlowTexture } from '../textures/proceduralTextures';

/**
 * Molecular scales: protein complex, molecule, and atom. Renders a procedural
 * ball-and-stick assembly using instanced atoms and shared bond cylinders, plus
 * a central atom with electron shells at the deepest scale.
 *
 * This is also the seam for real structure loading. `loadStructure` is the
 * entry point: today it accepts parsed atom coordinates (which a RCSB PDB
 * fetch + parser can supply) and rebuilds the instanced cloud. Until full PDB
 * parsing is wired in, the procedural assembly stands in with the same layout.
 */
export interface AtomRecord {
  element: string;
  position: THREE.Vector3;
}

const ELEMENT_COLORS: Record<string, string> = {
  C: '#cfd8dc',
  N: '#5b8def',
  O: '#ef5b6b',
  S: '#e6c54a',
  P: '#e6964a',
  H: '#f5f5f5',
  FE: '#e0793b',
  MG: '#3bd07a',
  ZN: '#7d8aa0',
  CA: '#5fd0c5',
  NA: '#8f6fe0',
  CL: '#6fe07a',
};

// Relative CPK-style radii for ball rendering, normalized to carbon.
const ELEMENT_RADIUS: Record<string, number> = {
  H: 0.6,
  C: 1.0,
  N: 0.95,
  O: 0.9,
  S: 1.2,
  P: 1.2,
  FE: 1.4,
  MG: 1.3,
  ZN: 1.35,
  CA: 1.5,
};

function elementColor(el: string): string {
  return ELEMENT_COLORS[el.toUpperCase()] ?? '#b0bec5';
}

function elementRadius(el: string): number {
  return ELEMENT_RADIUS[el.toUpperCase()] ?? 1.0;
}

export class ProteinStructureLayer implements SceneLayer {
  readonly root = new THREE.Group();
  readonly activeScales = [Scale.ProteinComplex, Scale.Molecule, Scale.Atom];

  private readonly atomGeo = new THREE.IcosahedronGeometry(0.45, 2);
  private atoms: THREE.InstancedMesh | null = null;
  private bonds: THREE.LineSegments | null = null;
  private readonly atomMat: THREE.MeshStandardMaterial;
  private readonly bondMat: THREE.LineBasicMaterial;
  private readonly atomScale = new THREE.Group();
  private intensity = 0;
  private currentScale: Scale = Scale.ProteinComplex;

  // Atom-scale subgraph: a glowing nucleon cluster, luminous orbital shells, and
  // electrons that race along them. Tracked here so they can be faded and
  // animated independently of the ball-and-stick molecular assembly.
  private readonly nucleus = new THREE.Group();
  private readonly atomFadeables: (THREE.Material & { opacity: number })[] = [];
  private readonly atomShells: { ring: THREE.Group; spin: number }[] = [];
  private readonly atomElectrons: { pivot: THREE.Group; speed: number }[] = [];
  private readonly atomTextures: THREE.Texture[] = [];

  constructor() {
    this.root.name = 'ProteinStructureLayer';
    this.root.visible = false;

    this.atomMat = new THREE.MeshStandardMaterial({
      roughness: 0.35,
      metalness: 0.1,
      transparent: true,
      opacity: 0,
      vertexColors: true,
    });
    this.bondMat = new THREE.LineBasicMaterial({
      color: new THREE.Color('#7fb6c6'),
      transparent: true,
      opacity: 0,
    });

    this.loadStructure(generateAssembly());
    this.buildAtomScale();
    this.root.add(this.atomScale);
  }

  /** Rebuild from the procedural stand-in assembly (scene-unit coordinates). */
  loadStructure(atoms: AtomRecord[]): void {
    const positions = atoms.map((a) => a.position);
    const elements = atoms.map((a) => a.element);
    const scales = elements.map((e) => elementRadius(e));
    this.buildFromAtoms(positions, elements, scales, 1.7, 'atp_synthase');
  }

  /**
   * Render a real structure from open PDB coordinates (centered, in angstroms).
   * Coordinates and atom radii are scaled together so the ball-and-stick model
   * stays physically proportioned regardless of the molecule's true size.
   */
  loadAtoms(coords: { element: string; x: number; y: number; z: number }[], pickId: string): void {
    if (coords.length === 0) return;
    let maxR = 0;
    for (const c of coords) maxR = Math.max(maxR, Math.hypot(c.x, c.y, c.z));
    const TARGET_EXTENT = 16;
    const u = maxR > 0 ? Math.min(0.5, TARGET_EXTENT / maxR) : 0.5;

    const positions = coords.map((c) => new THREE.Vector3(c.x * u, c.y * u, c.z * u));
    const elements = coords.map((c) => c.element);
    // atomGeo has radius 0.45; scale each instance to a fraction of its VdW size.
    const scales = elements.map((e) => (elementRadius(e) * 1.7 * u * 0.62) / 0.45);
    this.buildFromAtoms(positions, elements, scales, 1.95 * u, pickId);
  }

  private buildFromAtoms(
    positions: THREE.Vector3[],
    elements: string[],
    scales: number[],
    bondThreshold: number,
    pickId: string,
  ): void {
    // Geometry and material are shared and owned by the layer, so on rebuild we
    // only detach the previous instanced mesh; bonds own their own geometry.
    if (this.atoms) {
      this.atoms.dispose();
      this.root.remove(this.atoms);
    }
    if (this.bonds) {
      this.bonds.geometry.dispose();
      this.root.remove(this.bonds);
    }

    const mesh = new THREE.InstancedMesh(this.atomGeo, this.atomMat, positions.length);
    mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(positions.length * 3), 3);
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    positions.forEach((p, i) => {
      dummy.position.copy(p);
      dummy.scale.setScalar(scales[i]);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      color.set(elementColor(elements[i]));
      mesh.setColorAt(i, color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.userData.pick = { id: pickId, scale: Scale.ProteinComplex };
    this.atoms = mesh;
    this.root.add(mesh);

    this.bonds = new THREE.LineSegments(buildBonds(positions, bondThreshold), this.bondMat);
    this.root.add(this.bonds);
  }

  /**
   * Build a luminous, physically shaded atom: a packed nucleus of protons and
   * neutrons wrapped in a soft glow, three inclined orbital shells drawn as
   * glowing tubes, and electrons orbiting along them with their own halos. Every
   * material starts fully transparent and is faded in with the Atom scale.
   */
  private buildAtomScale(): void {
    const glowTex = createGlowTexture(256);
    this.atomTextures.push(glowTex);

    // --- Nucleus: a tight fibonacci-packed cluster of nucleons. ----------------
    const nucleonGeo = new THREE.IcosahedronGeometry(0.62, 2);
    const protonMat = new THREE.MeshStandardMaterial({
      color: '#ff5a4d',
      emissive: '#7a1206',
      emissiveIntensity: 0.65,
      roughness: 0.32,
      metalness: 0.18,
      transparent: true,
      opacity: 0,
    });
    const neutronMat = new THREE.MeshStandardMaterial({
      color: '#aebfd0',
      emissive: '#1a2838',
      emissiveIntensity: 0.4,
      roughness: 0.42,
      metalness: 0.22,
      transparent: true,
      opacity: 0,
    });
    this.atomFadeables.push(protonMat, neutronMat);

    const NUCLEONS = 18;
    const packR = 1.35;
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < NUCLEONS; i++) {
      // Fibonacci sphere for an even shell, pulled inward for a clustered core.
      const y = 1 - (i / (NUCLEONS - 1)) * 2;
      const rad = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = golden * i;
      const shrink = 0.45 + 0.55 * Math.cbrt(i / NUCLEONS);
      const nucleon = new THREE.Mesh(nucleonGeo, i % 2 === 0 ? protonMat : neutronMat);
      nucleon.position.set(Math.cos(theta) * rad * packR * shrink, y * packR * shrink, Math.sin(theta) * rad * packR * shrink);
      nucleon.scale.setScalar(0.85 + (i % 3) * 0.12);
      this.nucleus.add(nucleon);
    }

    // Warm glow sprite hugging the nucleus so it reads as energetic, not a ball.
    const nucleusGlowMat = new THREE.SpriteMaterial({
      map: glowTex,
      color: '#ff8a5b',
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const nucleusGlow = new THREE.Sprite(nucleusGlowMat);
    nucleusGlow.scale.setScalar(7.5);
    this.nucleus.add(nucleusGlow);
    nucleusGlowMat.userData.fadeWeight = 0.85;
    this.atomFadeables.push(nucleusGlowMat);
    this.atomScale.add(this.nucleus);

    // --- Electron shells: glowing inclined orbital rings + orbiting electrons. -
    const shellGeo = (r: number): THREE.TorusGeometry => new THREE.TorusGeometry(r, 0.045, 12, 160);
    const tilts: [number, number][] = [
      [0.0, 0.0],
      [1.15, 0.5],
      [-0.7, 1.25],
    ];
    const electronCounts = [2, 3, 3];
    for (let s = 0; s < 3; s++) {
      const r = 4.2 + s * 2.6;
      const ring = new THREE.Group();
      ring.rotation.x = tilts[s][0];
      ring.rotation.y = tilts[s][1];

      const ringMat = new THREE.MeshBasicMaterial({
        color: '#7fb0ff',
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const ringMesh = new THREE.Mesh(shellGeo(r), ringMat);
      ring.add(ringMesh);
      ringMat.userData.fadeWeight = 0.55;
      this.atomFadeables.push(ringMat);

      // Electrons spaced around the ring, each a bright emissive bead + halo.
      const count = electronCounts[s];
      for (let e = 0; e < count; e++) {
        const pivot = new THREE.Group();
        pivot.rotation.z = (e / count) * Math.PI * 2;
        const electronMat = new THREE.MeshStandardMaterial({
          color: '#dceaff',
          emissive: '#4f86ff',
          emissiveIntensity: 1.6,
          roughness: 0.25,
          metalness: 0,
          transparent: true,
          opacity: 0,
        });
        const electron = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 24), electronMat);
        electron.position.x = r;
        this.atomFadeables.push(electronMat);

        const haloMat = new THREE.SpriteMaterial({
          map: glowTex,
          color: '#9cc4ff',
          transparent: true,
          opacity: 0,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        const halo = new THREE.Sprite(haloMat);
        halo.scale.setScalar(2.4);
        electron.add(halo);
        haloMat.userData.fadeWeight = 0.9;
        this.atomFadeables.push(haloMat);

        pivot.add(electron);
        ring.add(pivot);
        // Inner shells sweep faster, echoing tighter orbits.
        this.atomElectrons.push({ pivot, speed: 1.8 - s * 0.45 + e * 0.05 });
      }

      this.atomScale.add(ring);
      this.atomShells.push({ ring, spin: (s % 2 === 0 ? 1 : -1) * (0.12 + s * 0.04) });
    }

    this.atomScale.visible = false;
  }

  onScaleChange(scale: Scale, intensity: number): void {
    this.intensity = intensity;
    this.currentScale = scale;
    this.root.visible = intensity > 0.01;
    this.atomScale.visible = scale === Scale.Atom && intensity > 0.01;
  }

  update(dt: number, elapsed: number): void {
    const molTarget = this.currentScale === Scale.Atom ? 0 : this.intensity;
    this.atomMat.opacity += (molTarget - this.atomMat.opacity) * Math.min(1, dt * 6);
    this.atomMat.visible = this.atomMat.opacity > 0.01;
    fadeMaterial(this.bondMat, molTarget * 0.6, dt);

    if (this.atoms) this.atoms.rotation.y = elapsed * 0.25;
    if (this.bonds) this.bonds.rotation.y = elapsed * 0.25;

    // Atom scale: fade every nucleus/shell/electron material toward the target,
    // honoring each material's own opacity cap, then animate the living atom.
    const atomTarget = this.currentScale === Scale.Atom ? this.intensity : 0;
    for (const m of this.atomFadeables) {
      const weight = (m.userData?.fadeWeight as number | undefined) ?? 1;
      fadeMaterial(m, atomTarget * weight, dt);
    }

    // Nucleus tumbles slowly; shells precess; electrons race along their orbits.
    this.nucleus.rotation.y = elapsed * 0.35;
    this.nucleus.rotation.x = Math.sin(elapsed * 0.4) * 0.25;
    for (const shell of this.atomShells) shell.ring.rotation.z += shell.spin * dt;
    for (const el of this.atomElectrons) el.pivot.rotation.z += el.speed * dt;
  }

  getPickables(): THREE.Object3D[] {
    return this.intensity > 0.3 && this.atoms ? [this.atoms] : [];
  }

  dispose(): void {
    this.atomGeo.dispose();
    for (const tex of this.atomTextures) tex.dispose();
    disposeObject(this.root);
  }
}

/**
 * Build bond line segments between atoms closer than a threshold, using a
 * uniform spatial grid so the cost stays roughly linear even for large
 * structures (the naive all-pairs scan is quadratic and janks the frame).
 */
function buildBonds(positions: THREE.Vector3[], threshold: number): THREE.BufferGeometry {
  const segs: number[] = [];
  const cell = Math.max(threshold, 0.0001);
  const grid = new Map<string, number[]>();
  const key = (x: number, y: number, z: number): string =>
    `${Math.floor(x / cell)},${Math.floor(y / cell)},${Math.floor(z / cell)}`;

  positions.forEach((p, i) => {
    const k = key(p.x, p.y, p.z);
    const bucket = grid.get(k);
    if (bucket) bucket.push(i);
    else grid.set(k, [i]);
  });

  const t2 = threshold * threshold;
  positions.forEach((p, i) => {
    const cx = Math.floor(p.x / cell);
    const cy = Math.floor(p.y / cell);
    const cz = Math.floor(p.z / cell);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const bucket = grid.get(`${cx + dx},${cy + dy},${cz + dz}`);
          if (!bucket) continue;
          for (const j of bucket) {
            if (j <= i) continue;
            const q = positions[j];
            if (p.distanceToSquared(q) < t2) {
              segs.push(p.x, p.y, p.z, q.x, q.y, q.z);
            }
          }
        }
      }
    }
  });

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(segs), 3));
  return geo;
}

/** Procedural stand-in assembly: a compact helical cluster of atoms. */
function generateAssembly(): AtomRecord[] {
  const atoms: AtomRecord[] = [];
  const elements: Array<keyof typeof ELEMENT_COLORS> = ['C', 'C', 'N', 'O', 'C', 'S'];
  const turns = 36;
  for (let i = 0; i < turns; i++) {
    const a = i * 0.6;
    const r = 2.2 + Math.sin(i * 0.3) * 0.6;
    const base = new THREE.Vector3(Math.cos(a) * r, i * 0.35 - 6, Math.sin(a) * r);
    atoms.push({ element: elements[i % elements.length], position: base });
    // A side group every few residues.
    if (i % 3 === 0) {
      atoms.push({
        element: 'O',
        position: base.clone().add(new THREE.Vector3(Math.cos(a) * 1.1, 0.2, Math.sin(a) * 1.1)),
      });
    }
  }
  return atoms;
}
