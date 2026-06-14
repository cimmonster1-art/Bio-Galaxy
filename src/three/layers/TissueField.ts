import * as THREE from 'three';
import { Scale } from '../../types';
import { SceneLayer, fadeMaterial } from '../core/SceneLayer';
import { disposeObject } from '../core/dispose';

/**
 * The tissue scale, rebuilt as ONE place: you are inside skeletal muscle. Giant
 * striated muscle fibres run through the foreground and midground, bundled into a
 * fascicle; an enveloping extracellular-matrix shell wraps the whole view so the
 * tissue itself — not the galaxy — becomes the environment; capillaries thread
 * between the fibres carrying flowing blood, and a motor neuron reaches in to its
 * neuromuscular junction. No floating icons — a single, recognizable tissue.
 *
 * Every structure is selectable, so the detail panel, Wikipedia card, and
 * copilot all respond wherever the user clicks.
 */

const flowFragment = /* glsl */ `
  precision highp float;
  uniform float uTime; uniform float uOpacity; uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    float base = 0.35;
    float pulse = pow(max(0.0, 1.0 - abs(fract(vUv.x * 0.5 - uTime * 0.3) - 0.5) * 5.0), 2.0);
    gl_FragColor = vec4(uColor * (0.7 + pulse), (base + pulse * 0.5) * uOpacity);
  }
`;
const flowVertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

/** Repeating sarcomere band texture (light I-bands, dark Z-lines). */
function striationTexture(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = 8; c.height = 64;
  const ctx = c.getContext('2d')!;
  for (let y = 0; y < 64; y++) {
    const v = 0.45 + 0.55 * Math.abs(Math.sin((y / 64) * Math.PI * 6));
    const dark = (y % 16 === 0) ? 0.25 : v;
    ctx.fillStyle = `rgb(${Math.round(dark * 200)},${Math.round(dark * 120)},${Math.round(dark * 130)})`;
    ctx.fillRect(0, y, 8, 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 26);
  return tex;
}

export class TissueField implements SceneLayer {
  readonly root = new THREE.Group();
  readonly activeScales = [Scale.Tissue];

  private readonly stripes: THREE.Texture;
  private readonly fadeables: (THREE.Material & { opacity: number })[] = [];
  private readonly flowMats: THREE.ShaderMaterial[] = [];
  private readonly fibres: { mesh: THREE.Mesh; phase: number }[] = [];
  private readonly blood: THREE.Points;
  private readonly bloodMat: THREE.PointsMaterial;
  private readonly fill: THREE.PointLight;
  private readonly pickables: THREE.Object3D[] = [];
  private intensity = 0;

  constructor() {
    this.root.name = 'TissueField';
    this.root.visible = false;
    this.stripes = striationTexture();

    // ── Extracellular matrix: an enveloping shell that becomes the sky ────────
    const ecmMat = this.track(new THREE.MeshStandardMaterial({
      color: 0x4a1820, emissive: 0x1a0608, emissiveIntensity: 0.5,
      roughness: 1, metalness: 0, side: THREE.BackSide,
    }));
    const ecm = new THREE.Mesh(new THREE.SphereGeometry(80, 32, 24), ecmMat);
    ecm.frustumCulled = false;
    ecm.userData.pick = { id: 'tissue:ecm', scale: Scale.Tissue };
    this.root.add(ecm);
    this.pickables.push(ecm);

    // Collagen fibres of the matrix, drifting through the deep background.
    const collagenMat = this.track(new THREE.LineBasicMaterial({
      color: 0xd8b48c, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    const cpts: number[] = [];
    for (let i = 0; i < 90; i++) {
      const a = new THREE.Vector3((Math.random() - 0.5) * 130, (Math.random() - 0.5) * 90, (Math.random() - 0.5) * 130);
      const b = a.clone().add(new THREE.Vector3((Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30));
      cpts.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
    const cgeo = new THREE.BufferGeometry();
    cgeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(cpts), 3));
    this.root.add(new THREE.LineSegments(cgeo, collagenMat));

    // ── The muscle fibres: a fascicle of giant striated cylinders along Z ─────
    const fibreGeo = new THREE.CylinderGeometry(3, 3, 150, 28, 1);
    fibreGeo.rotateX(Math.PI / 2); // lie along Z; UV.y runs along the length
    // Hex-ish packing across the X/Y plane so the camera sits among the fibres.
    const packing: [number, number, number][] = [
      [0, 0, 1.0], [8, 2, 0.85], [-8, -1, 0.9], [4, 8, 0.8], [-5, 8, 0.7],
      [9, -7, 0.75], [-10, -8, 0.8], [0, 12, 0.6], [-14, 3, 0.65], [14, 5, 0.7],
    ];
    for (const [x, y, s] of packing) {
      const mat = this.track(new THREE.MeshStandardMaterial({
        color: 0xb0414e, emissive: 0x40121a, emissiveIntensity: 0.5,
        emissiveMap: this.stripes, bumpMap: this.stripes, bumpScale: 0.22,
        roughness: 0.55, metalness: 0.0,
      }));
      const fibre = new THREE.Mesh(fibreGeo, mat);
      fibre.position.set(x, y, (Math.random() - 0.5) * 20);
      fibre.scale.set(s, s, 1);
      fibre.castShadow = true; fibre.receiveShadow = true;
      fibre.userData.s = s;
      fibre.userData.pick = { id: 'tissue:muscle', scale: Scale.Tissue };
      this.root.add(fibre);
      this.fibres.push({ mesh: fibre, phase: Math.random() * Math.PI * 2 });
      this.pickables.push(fibre);
    }

    // ── Capillaries: blood vessels winding between the fibres ──────────────────
    for (let k = 0; k < 3; k++) {
      const pts: THREE.Vector3[] = [];
      const baseX = (k - 1) * 11;
      for (let t = 0; t <= 8; t++) {
        pts.push(new THREE.Vector3(
          baseX + Math.sin(t * 0.9 + k) * 6,
          -4 + Math.cos(t * 0.7 + k) * 7,
          -70 + t * 18,
        ));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      const mat = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: k }, uOpacity: { value: 0 }, uColor: { value: new THREE.Color(0xff5566) } },
        vertexShader: flowVertex, fragmentShader: flowFragment,
      });
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 1.1, 10, false), mat);
      tube.frustumCulled = false;
      tube.userData.pick = { id: 'tissue:capillary', scale: Scale.Tissue };
      this.flowMats.push(mat);
      this.root.add(tube);
      this.pickables.push(tube);
    }

    // Red blood cells drifting through the fascicle.
    const COUNT = 240;
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 150;
    }
    const bgeo = new THREE.BufferGeometry();
    bgeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.bloodMat = this.track(new THREE.PointsMaterial({
      color: 0xff4d5e, size: 1.0, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    }));
    this.blood = new THREE.Points(bgeo, this.bloodMat);
    this.blood.frustumCulled = false;
    this.root.add(this.blood);

    // ── Motor neuron reaching to its neuromuscular junction ───────────────────
    const neuron = new THREE.Group();
    neuron.userData.pick = { id: 'tissue:motor_neuron', scale: Scale.Tissue };
    const somaMat = this.track(new THREE.MeshStandardMaterial({
      color: 0xf2e08a, emissive: 0x6a5a14, emissiveIntensity: 0.8, roughness: 0.4,
    }));
    const soma = new THREE.Mesh(new THREE.IcosahedronGeometry(2.4, 2), somaMat);
    soma.position.set(18, 16, -30);
    neuron.add(soma);
    const axonMat = this.track(new THREE.LineBasicMaterial({
      color: 0xffe9a0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    const apts = [new THREE.Vector3(18, 16, -30), new THREE.Vector3(10, 8, -10), new THREE.Vector3(2, 2, 6)];
    const ageo = new THREE.BufferGeometry().setFromPoints(apts);
    neuron.add(new THREE.Line(ageo, axonMat));
    // Dendrites around the soma.
    const dpts: number[] = [];
    for (let d = 0; d < 8; d++) {
      const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(4);
      dpts.push(18, 16, -30, 18 + dir.x, 16 + dir.y, -30 + dir.z);
    }
    const dgeo = new THREE.BufferGeometry();
    dgeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(dpts), 3));
    neuron.add(new THREE.LineSegments(dgeo, axonMat));
    this.root.add(neuron);
    this.pickables.push(neuron);

    // Warm interior fill so the fibres read with translucent depth.
    this.fill = new THREE.PointLight(0xff9a8a, 0, 160, 1.6);
    this.fill.position.set(0, 6, 20);
    this.root.add(this.fill);
  }

  private track<T extends THREE.Material & { opacity: number }>(mat: T): T {
    mat.transparent = true; mat.opacity = 0;
    this.fadeables.push(mat);
    return mat;
  }

  onScaleChange(_scale: Scale, intensity: number): void {
    this.intensity = intensity;
    this.root.visible = intensity > 0.01;
  }

  update(dt: number, elapsed: number): void {
    for (const mat of this.fadeables) fadeMaterial(mat, this.intensity, dt);
    for (const mat of this.flowMats) {
      mat.uniforms.uTime.value += dt;
      mat.uniforms.uOpacity.value += (this.intensity - mat.uniforms.uOpacity.value) * Math.min(1, dt * 6);
    }
    this.fill.intensity = this.intensity * 2.0;
    if (this.intensity < 0.02) return;

    // Subtle contraction ripple across the fibres.
    for (const f of this.fibres) {
      const c = 1 + Math.sin(elapsed * 1.2 + f.phase) * 0.025;
      f.mesh.scale.x = f.mesh.scale.y = (f.mesh.userData.s ?? 1) * c;
    }
    // Stream blood cells along the fibres and recycle them.
    const pos = this.blood.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      let z = pos.getZ(i) + dt * (12 + (i % 6) * 3);
      if (z > 80) z = -80;
      pos.setZ(i, z);
    }
    pos.needsUpdate = true;
  }

  getPickables(): THREE.Object3D[] {
    return this.root.visible ? this.pickables : [];
  }

  dispose(): void {
    this.stripes.dispose();
    disposeObject(this.root);
  }
}
