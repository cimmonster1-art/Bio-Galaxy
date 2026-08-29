import * as THREE from 'three';
import { Scale } from '../../types';
import { SceneLayer, fadeMaterial } from '../core/SceneLayer';
import { disposeObject } from '../core/dispose';

type Fadeable = {
  mat: THREE.Material & { opacity: number };
  baseOpacity: number;
};

type FascicleState = {
  group: THREE.Group;
  phase: number;
  baseScale: number;
};

type RbcState = {
  curveIndex: number;
  offset: number;
  speed: number;
  spin: number;
};

const UP = new THREE.Vector3(0, 1, 0);

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A muted sarcomere map. It carries A/I band rhythm and narrow Z-lines without
 * baking candy-pink colour into the material.
 */
function createStriationTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 64, 0);
  grad.addColorStop(0, '#c0b7b0');
  grad.addColorStop(0.5, '#f2ece6');
  grad.addColorStop(1, '#b6aaa4');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 256);

  for (let y = 0; y < 256; y++) {
    const phase = (y % 32) / 32;
    const broadBand = phase < 0.55 ? 0.88 : 1.04;
    const zLine = y % 32 < 2 ? 0.48 : 1;
    const fine = 0.96 + Math.sin(y * 0.65) * 0.035;
    const value = Math.max(0.35, Math.min(1, broadBand * zLine * fine));
    ctx.fillStyle = `rgba(104,74,72,${(1 - value) * 0.72})`;
    ctx.fillRect(0, y, 64, 1);
  }

  for (let x = 2; x < 64; x += 5) {
    ctx.fillStyle = 'rgba(92,69,67,0.045)';
    ctx.fillRect(x, 0, 1, 256);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.2, 8.5);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/**
 * Organic longitudinal geometry with non-uniform radius, mild centre-line drift,
 * irregular perimeter and capped ends. It reads like deformable living tissue
 * instead of a mathematically perfect cylinder.
 */
function createOrganicFibreGeometry(
  seed: number,
  radius = 2.1,
  length = 174,
  radialSegments = 18,
  lengthSegments = 36,
): THREE.BufferGeometry {
  const rand = mulberry32(seed);
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const phaseA = rand() * Math.PI * 2;
  const phaseB = rand() * Math.PI * 2;
  const phaseC = rand() * Math.PI * 2;
  const squash = 0.9 + rand() * 0.16;

  for (let zStep = 0; zStep <= lengthSegments; zStep++) {
    const t = zStep / lengthSegments;
    const z = (t - 0.5) * length;
    const centreX =
      Math.sin(t * Math.PI * 2 + phaseA) * 0.23 +
      Math.sin(t * Math.PI * 5 + phaseB) * 0.09;
    const centreY =
      Math.cos(t * Math.PI * 1.7 + phaseB) * 0.19 +
      Math.sin(t * Math.PI * 4.4 + phaseC) * 0.08;
    const longitudinal =
      0.965 +
      Math.sin(t * Math.PI * 2.3 + phaseA) * 0.028 +
      Math.sin(t * Math.PI * 7.2 + phaseB) * 0.014;

    for (let side = 0; side < radialSegments; side++) {
      const u = side / radialSegments;
      const theta = u * Math.PI * 2;
      const perimeter =
        1 +
        Math.sin(theta * 3 + phaseA + t * 2.2) * 0.045 +
        Math.sin(theta * 5 + phaseB - t * 1.7) * 0.025;
      const r = radius * longitudinal * perimeter;
      positions.push(
        centreX + Math.cos(theta) * r,
        centreY + Math.sin(theta) * r * squash,
        z,
      );
      uvs.push(u, t);
    }
  }

  for (let zStep = 0; zStep < lengthSegments; zStep++) {
    for (let side = 0; side < radialSegments; side++) {
      const next = (side + 1) % radialSegments;
      const a = zStep * radialSegments + side;
      const b = zStep * radialSegments + next;
      const c = (zStep + 1) * radialSegments + side;
      const d = (zStep + 1) * radialSegments + next;
      indices.push(a, c, b, b, c, d);
    }
  }

  const startCenter = positions.length / 3;
  positions.push(0, 0, -length * 0.5);
  uvs.push(0.5, 0.5);
  const endCenter = positions.length / 3;
  positions.push(0, 0, length * 0.5);
  uvs.push(0.5, 0.5);

  const endOffset = lengthSegments * radialSegments;
  for (let side = 0; side < radialSegments; side++) {
    const next = (side + 1) % radialSegments;
    indices.push(startCenter, next, side);
    indices.push(endCenter, endOffset + side, endOffset + next);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function packedCrossSection(
  count: number,
  radius: number,
  minDistance: number,
  seed: number,
): THREE.Vector2[] {
  const rand = mulberry32(seed);
  const points: THREE.Vector2[] = [];
  let attempts = 0;

  while (points.length < count && attempts < 4000) {
    attempts++;
    const angle = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * radius;
    const p = new THREE.Vector2(Math.cos(angle) * r, Math.sin(angle) * r);
    if (points.every((other) => other.distanceTo(p) >= minDistance)) points.push(p);
  }

  return points;
}

function createRbcGeometry(): THREE.BufferGeometry {
  const profile = [
    new THREE.Vector2(0.0, 0.12),
    new THREE.Vector2(0.28, 0.08),
    new THREE.Vector2(0.62, 0.13),
    new THREE.Vector2(0.94, 0.22),
    new THREE.Vector2(1.12, 0.0),
    new THREE.Vector2(0.94, -0.22),
    new THREE.Vector2(0.62, -0.13),
    new THREE.Vector2(0.28, -0.08),
    new THREE.Vector2(0.0, -0.12),
  ];
  const geometry = new THREE.LatheGeometry(profile, 24);
  geometry.computeVertexNormals();
  return geometry;
}

export class TissueField implements SceneLayer {
  readonly root = new THREE.Group();
  readonly activeScales = [Scale.Tissue];

  private readonly stripes: THREE.Texture;
  private readonly grain: THREE.Texture;
  private readonly fadeables: Fadeable[] = [];
  private readonly fascicles: FascicleState[] = [];
  private readonly capillaryCurves: THREE.CatmullRomCurve3[] = [];
  private readonly rbc: THREE.InstancedMesh;
  private readonly rbcMat: THREE.MeshPhysicalMaterial;
  private readonly rbcStates: RbcState[] = [];
  private readonly dust: THREE.Points;
  private readonly fill: THREE.PointLight;
  private readonly rim: THREE.PointLight;
  private readonly hemi: THREE.HemisphereLight;
  private readonly pickables: THREE.Object3D[] = [];
  private intensity = 0;

  constructor() {
    this.root.name = 'TissueField';
    this.root.visible = false;
    this.root.rotation.set(-0.06, 0.09, -0.025);

    this.stripes = createStriationTexture();
    this.grain = new THREE.TextureLoader().load('/textures/anatomy/tissue_grain.jpg');
    this.grain.wrapS = this.grain.wrapT = THREE.RepeatWrapping;
    this.grain.repeat.set(2.5, 18);
    this.grain.colorSpace = THREE.NoColorSpace;
    this.grain.anisotropy = 4;

    // A dark, matte interstitial environment. No emissive red shell or neon haze.
    const environmentMat = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x1c1113,
        roughness: 1,
        metalness: 0,
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.96,
      }),
    );
    const environment = new THREE.Mesh(new THREE.SphereGeometry(280, 28, 20), environmentMat);
    environment.frustumCulled = false;
    environment.userData.pick = { id: 'tissue:ecm', scale: Scale.Tissue };
    this.root.add(environment);

    // Four irregular fascicles. Each contains dozens of smaller fibres and a
    // translucent perimysial sheath, so the eye sees nested tissue architecture.
    const fascicleSpecs = [
      { x: -22, y: 15, z: -8, rx: -0.04, ry: 0.12, rz: 0.03, scale: 1.02, seed: 11 },
      { x: 18, y: 13, z: -17, rx: 0.05, ry: -0.1, rz: -0.04, scale: 0.92, seed: 29 },
      { x: -16, y: -18, z: 6, rx: 0.08, ry: 0.08, rz: -0.02, scale: 0.86, seed: 47 },
      { x: 21, y: -17, z: 12, rx: -0.07, ry: -0.06, rz: 0.05, scale: 0.78, seed: 71 },
    ] as const;

    fascicleSpecs.forEach((spec, fascicleIndex) => {
      const group = new THREE.Group();
      group.position.set(spec.x, spec.y, spec.z);
      group.rotation.set(spec.rx, spec.ry, spec.rz);
      group.scale.setScalar(spec.scale);
      group.userData.pick = { id: 'tissue:muscle', scale: Scale.Tissue };

      const fibreGeometry = createOrganicFibreGeometry(spec.seed, 2.05, 176, 18, 38);
      const fibreMaterial = this.track(
        new THREE.MeshStandardMaterial({
          color: 0xa05d5b,
          map: this.stripes,
          bumpMap: this.grain,
          bumpScale: 0.17,
          roughness: 0.76,
          metalness: 0,
          vertexColors: true,
        }),
      );

      const points = packedCrossSection(26, 10.7, 3.4, spec.seed * 13);
      const fibres = new THREE.InstancedMesh(fibreGeometry, fibreMaterial, points.length);
      fibres.castShadow = true;
      fibres.receiveShadow = true;
      fibres.userData.pick = group.userData.pick;

      const rng = mulberry32(spec.seed * 97);
      const dummy = new THREE.Object3D();
      const color = new THREE.Color();
      const palette = ['#8f4d50', '#9a5656', '#a6615e', '#7f464a', '#ad6762'];

      points.forEach((point, i) => {
        dummy.position.set(point.x, point.y, (rng() - 0.5) * 20);
        dummy.rotation.set(
          (rng() - 0.5) * 0.018,
          (rng() - 0.5) * 0.018,
          (rng() - 0.5) * 0.08,
        );
        const radial = 0.78 + rng() * 0.36;
        dummy.scale.set(
          radial * (0.94 + rng() * 0.1),
          radial * (0.9 + rng() * 0.13),
          0.84 + rng() * 0.23,
        );
        dummy.updateMatrix();
        fibres.setMatrixAt(i, dummy.matrix);

        color.set(palette[Math.floor(rng() * palette.length)]);
        color.offsetHSL((rng() - 0.5) * 0.015, (rng() - 0.5) * 0.05, (rng() - 0.5) * 0.045);
        fibres.setColorAt(i, color);
      });
      fibres.instanceMatrix.needsUpdate = true;
      if (fibres.instanceColor) fibres.instanceColor.needsUpdate = true;
      group.add(fibres);

      // Perimysium is a thin, irregular connective-tissue sleeve, not a solid tube.
      const sheathGeometry = createOrganicFibreGeometry(spec.seed + 700, 13.35, 191, 24, 30);
      const sheathMaterial = this.track(
        new THREE.MeshPhysicalMaterial({
          color: 0xc5a29a,
          roughness: 0.86,
          metalness: 0,
          transmission: 0.03,
          thickness: 0.35,
          transparent: true,
          opacity: 0.14,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
      );
      const sheath = new THREE.Mesh(sheathGeometry, sheathMaterial);
      sheath.userData.pick = { id: 'tissue:perimysium', scale: Scale.Tissue };
      group.add(sheath);
      this.pickables.push(sheath);

      // Fine endomysial collagen lines between fibres. Kept subtle and non-additive.
      const collagenSegments: number[] = [];
      const collagenRng = mulberry32(spec.seed * 131);
      for (let i = 0; i < 42; i++) {
        const angle = collagenRng() * Math.PI * 2;
        const radius = 4 + collagenRng() * 8;
        const z = (collagenRng() - 0.5) * 160;
        const length = 8 + collagenRng() * 20;
        collagenSegments.push(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          z - length * 0.5,
          Math.cos(angle + 0.05) * (radius + (collagenRng() - 0.5) * 1.4),
          Math.sin(angle + 0.05) * (radius + (collagenRng() - 0.5) * 1.4),
          z + length * 0.5,
        );
      }
      const collagenGeometry = new THREE.BufferGeometry();
      collagenGeometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(collagenSegments, 3),
      );
      const collagenMaterial = this.track(
        new THREE.LineBasicMaterial({
          color: 0xd8c3b2,
          transparent: true,
          opacity: 0.18,
          depthWrite: false,
        }),
      );
      group.add(new THREE.LineSegments(collagenGeometry, collagenMaterial));

      this.root.add(group);
      this.pickables.push(fibres);
      this.fascicles.push({
        group,
        phase: fascicleIndex * 1.3 + spec.seed * 0.03,
        baseScale: spec.scale,
      });
    });

    // Capillaries weave between fascicles with a translucent vessel wall.
    const vesselMaterial = this.track(
      new THREE.MeshPhysicalMaterial({
        color: 0x772f36,
        roughness: 0.48,
        metalness: 0,
        transparent: true,
        opacity: 0.66,
        transmission: 0.08,
        thickness: 0.18,
        depthWrite: false,
      }),
    );

    for (let k = 0; k < 5; k++) {
      const rng = mulberry32(300 + k * 19);
      const points: THREE.Vector3[] = [];
      const baseX = (k - 2) * 12;
      for (let step = 0; step <= 9; step++) {
        const t = step / 9;
        points.push(
          new THREE.Vector3(
            baseX + Math.sin(t * Math.PI * 2 + k) * (5 + rng() * 3),
            -8 + Math.cos(t * Math.PI * 1.6 + k * 0.7) * (10 + rng() * 4),
            -86 + t * 172,
          ),
        );
      }
      const curve = new THREE.CatmullRomCurve3(points);
      this.capillaryCurves.push(curve);
      const vessel = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 96, 0.78, 10, false),
        vesselMaterial,
      );
      vessel.userData.pick = { id: 'tissue:capillary', scale: Scale.Tissue };
      vessel.frustumCulled = false;
      this.root.add(vessel);
      this.pickables.push(vessel);
    }

    // Actual biconcave erythrocytes, rather than glowing red point sprites.
    const rbcGeometry = createRbcGeometry();
    this.rbcMat = this.track(
      new THREE.MeshPhysicalMaterial({
        color: 0x9e3137,
        roughness: 0.38,
        metalness: 0,
        clearcoat: 0.12,
        transparent: true,
        opacity: 0.92,
      }),
    );
    const rbcCount = 62;
    this.rbc = new THREE.InstancedMesh(rbcGeometry, this.rbcMat, rbcCount);
    this.rbc.frustumCulled = false;
    this.rbc.userData.pick = { id: 'tissue:red_blood_cell', scale: Scale.Tissue };
    this.root.add(this.rbc);
    this.pickables.push(this.rbc);

    for (let i = 0; i < rbcCount; i++) {
      const rng = mulberry32(900 + i * 17);
      this.rbcStates.push({
        curveIndex: i % this.capillaryCurves.length,
        offset: rng(),
        speed: 0.025 + rng() * 0.025,
        spin: rng() * Math.PI * 2,
      });
    }
    this.updateRedBloodCells(0);

    // A restrained motor axon and terminal arbor. It is anatomical context, not a
    // glowing yellow game-object competing with the tissue.
    const axonMaterial = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xc8b79f,
        roughness: 0.82,
        metalness: 0,
        transparent: true,
        opacity: 0.72,
      }),
    );
    const axonCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(34, 28, -62),
      new THREE.Vector3(26, 18, -38),
      new THREE.Vector3(15, 8, -14),
      new THREE.Vector3(7, 4, 12),
    ]);
    const axon = new THREE.Mesh(new THREE.TubeGeometry(axonCurve, 72, 0.42, 8, false), axonMaterial);
    axon.userData.pick = { id: 'tissue:motor_neuron', scale: Scale.Tissue };
    this.root.add(axon);
    this.pickables.push(axon);

    const terminalMaterial = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xbda987,
        roughness: 0.78,
        metalness: 0,
        transparent: true,
        opacity: 0.82,
      }),
    );
    for (let branch = 0; branch < 5; branch++) {
      const angle = (branch / 5) * Math.PI * 2;
      const end = new THREE.Vector3(
        7 + Math.cos(angle) * (3.8 + (branch % 2)),
        4 + Math.sin(angle) * 3.2,
        18 + branch * 1.7,
      );
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(7, 4, 12),
        new THREE.Vector3(7 + Math.cos(angle) * 2.0, 4 + Math.sin(angle) * 1.6, 14),
        end,
      ]);
      const branchMesh = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 24, 0.22, 7, false),
        terminalMaterial,
      );
      branchMesh.userData.pick = axon.userData.pick;
      this.root.add(branchMesh);

      const bouton = new THREE.Mesh(new THREE.SphereGeometry(0.48, 12, 9), terminalMaterial);
      bouton.position.copy(end);
      bouton.scale.set(1.15, 0.8, 0.8);
      bouton.userData.pick = axon.userData.pick;
      this.root.add(bouton);
    }

    // Quiet suspended extracellular particles for depth. No additive sparkle.
    const particleCount = 360;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleRng = mulberry32(4242);
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (particleRng() - 0.5) * 112;
      particlePositions[i * 3 + 1] = (particleRng() - 0.5) * 86;
      particlePositions[i * 3 + 2] = (particleRng() - 0.5) * 210;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = this.track(
      new THREE.PointsMaterial({
        color: 0xcbb8aa,
        size: 0.34,
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    );
    this.dust = new THREE.Points(particleGeometry, particleMaterial);
    this.dust.frustumCulled = false;
    this.root.add(this.dust);

    // Neutral biological lighting. Warm tissue key + restrained blue-grey fill,
    // with a hemisphere light to reveal form without emissive materials.
    this.fill = new THREE.PointLight(0xffd7c8, 0, 175, 1.8);
    this.fill.position.set(14, 20, 32);
    this.root.add(this.fill);

    this.rim = new THREE.PointLight(0x9bb7c7, 0, 190, 1.9);
    this.rim.position.set(-34, 18, -54);
    this.root.add(this.rim);

    this.hemi = new THREE.HemisphereLight(0xffe8db, 0x251418, 0);
    this.root.add(this.hemi);
  }

  private track<T extends THREE.Material & { opacity: number }>(mat: T): T {
    const baseOpacity = mat.opacity;
    mat.transparent = true;
    mat.opacity = 0;
    this.fadeables.push({ mat, baseOpacity });
    return mat;
  }

  private updateRedBloodCells(elapsed: number): void {
    const dummy = new THREE.Object3D();
    const tangent = new THREE.Vector3();

    this.rbcStates.forEach((state, index) => {
      const curve = this.capillaryCurves[state.curveIndex];
      const t = (state.offset + elapsed * state.speed) % 1;
      const position = curve.getPointAt(t);
      curve.getTangentAt(t, tangent).normalize();

      dummy.position.copy(position);
      dummy.quaternion.setFromUnitVectors(UP, tangent);
      dummy.rotateY(state.spin + elapsed * 1.8);
      dummy.scale.setScalar(0.72);
      dummy.updateMatrix();
      this.rbc.setMatrixAt(index, dummy.matrix);
    });

    this.rbc.instanceMatrix.needsUpdate = true;
  }

  onScaleChange(_scale: Scale, intensity: number): void {
    this.intensity = intensity;
    this.root.visible = intensity > 0.01;
  }

  update(dt: number, elapsed: number): void {
    for (const { mat, baseOpacity } of this.fadeables) {
      fadeMaterial(mat, this.intensity * baseOpacity, dt);
    }

    this.fill.intensity = this.intensity * 1.55;
    this.rim.intensity = this.intensity * 0.72;
    this.hemi.intensity = this.intensity * 0.86;

    if (this.intensity < 0.02) return;

    // Skeletal muscle is alive, but the motion should be nearly imperceptible.
    for (const fascicle of this.fascicles) {
      const contraction = 1 + Math.sin(elapsed * 0.78 + fascicle.phase) * 0.006;
      fascicle.group.scale.set(
        fascicle.baseScale * contraction,
        fascicle.baseScale * contraction,
        fascicle.baseScale / contraction,
      );
    }

    this.updateRedBloodCells(elapsed);

    const positions = this.dust.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < positions.count; i++) {
      let z = positions.getZ(i) + dt * (0.55 + (i % 5) * 0.12);
      if (z > 105) z = -105;
      positions.setZ(i, z);
      positions.setY(i, positions.getY(i) + Math.sin(elapsed * 0.22 + i * 0.37) * dt * 0.06);
    }
    positions.needsUpdate = true;
  }

  getPickables(): THREE.Object3D[] {
    return this.root.visible ? this.pickables : [];
  }

  dispose(): void {
    this.stripes.dispose();
    this.grain.dispose();
    disposeObject(this.root);
  }
}
