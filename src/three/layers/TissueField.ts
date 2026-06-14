import * as THREE from 'three';
import { Scale } from '../../types';
import { SceneLayer, fadeMaterial } from '../core/SceneLayer';
import { disposeObject } from '../core/dispose';
import { createMuscleTexture } from '../textures/proceduralTextures';

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
  private readonly muscle: THREE.Texture;
  private readonly fadeables: (THREE.Material & { opacity: number })[] = [];
  private readonly flowMats: THREE.ShaderMaterial[] = [];
  private readonly fibres: { mesh: THREE.Mesh; phase: number }[] = [];
  private readonly blood: THREE.Points;
  private readonly bloodMat: THREE.PointsMaterial;
  private readonly dust: THREE.Points;
  private readonly dustMat: THREE.PointsMaterial;
  private readonly fill: THREE.PointLight;
  private readonly rim: THREE.PointLight;
  private readonly pickables: THREE.Object3D[] = [];
  private intensity = 0;

  constructor() {
    this.root.name = 'TissueField';
    this.root.visible = false;
    this.stripes = striationTexture();
    this.muscle = createMuscleTexture(512);
    this.muscle.repeat.set(1, 6);

    // ── Extracellular matrix: a huge, deep enveloping volume that becomes the
    // environment itself — not a contained "ball". Radius is far larger than the
    // fibre run so the camera is always inside it, reading as endless deep tissue
    // rather than a sphere you can see the edge of. Kept dim so the lit fibres
    // dominate. A fainter inner collagen haze adds atmospheric depth.
    const ecmMat = this.track(new THREE.MeshStandardMaterial({
      color: 0x3a1016, emissive: 0x10040a, emissiveIntensity: 0.35,
      roughness: 1, metalness: 0, side: THREE.BackSide, fog: false,
    }));
    const ecm = new THREE.Mesh(new THREE.SphereGeometry(320, 32, 24), ecmMat);
    ecm.frustumCulled = false;
    ecm.userData.pick = { id: 'tissue:ecm', scale: Scale.Tissue };
    this.root.add(ecm);
    this.pickables.push(ecm);

    const hazeMat = this.track(new THREE.MeshBasicMaterial({
      color: 0x5a1822, transparent: true, opacity: 0, side: THREE.BackSide,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    const haze = new THREE.Mesh(new THREE.SphereGeometry(150, 24, 18), hazeMat);
    haze.frustumCulled = false;
    this.root.add(haze);

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

    // ── The muscle fibres: a dense fascicle of giant striated cylinders that run
    // the length of the view and past the camera in every direction, so you are
    // submerged among them rather than looking at a few rods in a jar. ─────────
    const fibreGeo = new THREE.CylinderGeometry(5, 5, 320, 32, 1);
    fibreGeo.rotateX(Math.PI / 2); // lie along Z; UV.y runs along the length
    // Hex-packed grid of fibres filling the X/Y plane around the camera.
    const packing: [number, number, number][] = [];
    const STEP = 13;
    for (let gx = -3; gx <= 3; gx++) {
      for (let gy = -3; gy <= 3; gy++) {
        const x = gx * STEP + (gy % 2) * STEP * 0.5 + (Math.random() - 0.5) * 3;
        const y = gy * STEP * 0.9 + (Math.random() - 0.5) * 3;
        if (Math.hypot(x, y) < 4) continue; // leave a small channel at the centre
        packing.push([x, y, 0.7 + Math.random() * 0.6]);
      }
    }
    // Peripheral nuclei: skeletal-muscle fibres are multinucleate, with flattened
    // nuclei pressed just under the sarcolemma. Scattering a few on each fibre is
    // the detail that reads as "living cell" rather than a smooth rod.
    const nucleusGeo = new THREE.SphereGeometry(0.7, 14, 10);
    let fibreIndex = 0;
    for (const [x, y, s] of packing) {
      const mat = this.track(new THREE.MeshStandardMaterial({
        color: 0xa83a47, emissive: 0x300d14, emissiveIntensity: 0.45,
        map: this.muscle, bumpMap: this.muscle, bumpScale: 0.6,
        emissiveMap: this.stripes,
        roughness: 0.62, metalness: 0.0,
      }));
      const fibre = new THREE.Mesh(fibreGeo, mat);
      fibre.position.set(x, y, (Math.random() - 0.5) * 30);
      fibre.scale.set(s, s, 1);
      fibre.castShadow = true; fibre.receiveShadow = true;
      fibre.userData.s = s;
      fibre.userData.pick = { id: 'tissue:muscle', scale: Scale.Tissue };
      this.root.add(fibre);
      this.fibres.push({ mesh: fibre, phase: Math.random() * Math.PI * 2 });
      this.pickables.push(fibre);

      if (fibreIndex++ % 2 === 0) {
        const nucMat = this.track(new THREE.MeshStandardMaterial({
          color: 0x3a1a40, emissive: 0x180a22, emissiveIntensity: 0.6, roughness: 0.7,
        }));
        for (let n = 0; n < 3; n++) {
          const nuc = new THREE.Mesh(nucleusGeo, nucMat);
          const theta = Math.random() * Math.PI * 2;
          // Local fibre space runs along Z; seat the nucleus just under the surface.
          nuc.position.set(Math.cos(theta) * 4.5, Math.sin(theta) * 4.5, (Math.random() - 0.5) * 280);
          nuc.scale.set(1.5, 1.5, 2.6); // flattened, elongated along the fibre
          nuc.userData.pick = fibre.userData.pick;
          fibre.add(nuc);
        }
      }
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

    // Neuromuscular junction: the axon terminal arborizes into synaptic boutons
    // pressed onto a motor end-plate on the central fibre — the point where the
    // nerve actually drives contraction.
    const nmj = new THREE.Vector3(2, 2, 6);
    const boutonMat = this.track(new THREE.MeshStandardMaterial({
      color: 0xfff0a8, emissive: 0xffd24a, emissiveIntensity: 1.1, roughness: 0.3,
    }));
    const boutonGeo = new THREE.SphereGeometry(0.5, 12, 10);
    for (let b = 0; b < 7; b++) {
      const bouton = new THREE.Mesh(boutonGeo, boutonMat);
      bouton.position.set(
        nmj.x + (Math.random() - 0.5) * 3,
        nmj.y + (Math.random() - 0.5) * 3,
        nmj.z + (Math.random() - 0.5) * 4,
      );
      neuron.add(bouton);
    }
    const endPlateMat = this.track(new THREE.MeshBasicMaterial({
      color: 0xffe07a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    const endPlate = new THREE.Mesh(new THREE.CircleGeometry(3.4, 24), endPlateMat);
    endPlate.position.copy(nmj);
    endPlate.lookAt(nmj.clone().add(new THREE.Vector3(0.3, 0.3, 1)));
    neuron.add(endPlate);

    this.root.add(neuron);
    this.pickables.push(neuron);

    // ── Atmosphere: fine cytoplasmic dust suspended in the interstitial fluid,
    // catching the light to give the depth and volume of a real microscopic space.
    const DUST = 520;
    const dustPos = new Float32Array(DUST * 3);
    for (let i = 0; i < DUST; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 110;
      dustPos[i * 3 + 1] = (Math.random() - 0.5) * 80;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 200;
    }
    const dgeo2 = new THREE.BufferGeometry();
    dgeo2.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    this.dustMat = this.track(new THREE.PointsMaterial({
      color: 0xffd9c4, size: 0.6, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    }));
    this.dust = new THREE.Points(dgeo2, this.dustMat);
    this.dust.frustumCulled = false;
    this.root.add(this.dust);

    // Soft biological lighting: a warm key fill from the front and a cool rim
    // from behind so the fibres read with rounded, translucent volume.
    this.fill = new THREE.PointLight(0xff9a8a, 0, 160, 1.6);
    this.fill.position.set(0, 6, 20);
    this.root.add(this.fill);
    this.rim = new THREE.PointLight(0x6ad0ff, 0, 200, 1.8);
    this.rim.position.set(-30, 24, -60);
    this.root.add(this.rim);
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
    this.rim.intensity = this.intensity * 1.4;
    if (this.intensity < 0.02) return;

    // Drift the suspended dust slowly so the fluid feels alive, recycling it
    // through the volume.
    const dpos = this.dust.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < dpos.count; i++) {
      let z = dpos.getZ(i) + dt * (1.5 + (i % 4));
      if (z > 100) z = -100;
      dpos.setZ(i, z);
      dpos.setY(i, dpos.getY(i) + Math.sin(elapsed * 0.5 + i) * dt * 0.4);
    }
    dpos.needsUpdate = true;

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
    this.muscle.dispose();
    disposeObject(this.root);
  }
}
