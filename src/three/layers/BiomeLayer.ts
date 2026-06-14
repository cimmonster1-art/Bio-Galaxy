import * as THREE from 'three';
import { Scale, PickTag } from '../../types';
import { SceneLayer, fadeMaterial } from '../core/SceneLayer';
import { disposeObject } from '../core/dispose';

/**
 * Biome — the user has descended from orbit and entered a living planetary
 * environment. Not a model: a place. A dynamic gradient sky, rolling terrain,
 * dense atmospheric haze, volumetric god-ray shafts, wind-animated vegetation,
 * and drifting wildlife particles compose a miniature world, all procedural so
 * nothing has to download.
 *
 * Six biome variants (rainforest, reef, tundra, savanna, temperate forest,
 * desert) hover at the horizon as glowing, selectable waypoints; picking one —
 * or the ground itself — carries the journey down toward the ecosystem scale.
 * Every accent leans on Bio Galaxy's cyan branding so the place still reads as
 * part of the same universe as the cosmos above and the cell below.
 */

interface BiomeVariant {
  id: string;
  name: string;
  /** Canopy / dominant colour. */
  canopy: number;
  /** Ground / substrate colour. */
  ground: number;
  /** Sky tint at the horizon. */
  horizon: number;
}

export const BIOME_VARIANTS: BiomeVariant[] = [
  { id: 'rainforest', name: 'Tropical Rainforest', canopy: 0x1f6b3a, ground: 0x24351f, horizon: 0x123b32 },
  { id: 'reef', name: 'Coral Reef', canopy: 0x18a3b8, ground: 0x0f3a55, horizon: 0x0a4a63 },
  { id: 'tundra', name: 'Arctic Tundra', canopy: 0xbfe6ff, ground: 0x3a4a5a, horizon: 0x214055 },
  { id: 'savanna', name: 'Savanna', canopy: 0xc7a14a, ground: 0x6b5a2a, horizon: 0x4a3a1e },
  { id: 'temperate', name: 'Temperate Forest', canopy: 0x2f7d4a, ground: 0x2c3a22, horizon: 0x1d4034 },
  { id: 'desert', name: 'Desert', canopy: 0xd9a35a, ground: 0x7a5a32, horizon: 0x5a3a22 },
];

const SUN_DIRECTION = new THREE.Vector3(0.45, 0.62, 0.35).normalize();

export class BiomeLayer implements SceneLayer {
  readonly root = new THREE.Group();
  readonly activeScales = [Scale.Biome];

  private intensity = 0;
  private active: BiomeVariant = BIOME_VARIANTS[0];

  // Wind drives every vegetation material's vertex sway through one shared clock.
  private readonly wind = { value: 0 };
  private readonly windMaterials: THREE.Material[] = [];

  private readonly sky: THREE.Mesh;
  private readonly skyMat: THREE.ShaderMaterial;
  private readonly ground: THREE.Mesh;
  private readonly groundMat: THREE.MeshStandardMaterial;
  private readonly haze: THREE.Mesh;
  private readonly hazeMat: THREE.MeshBasicMaterial;
  private readonly godRays: THREE.Mesh;
  private readonly godRayMat: THREE.MeshBasicMaterial;
  private readonly canopy: THREE.InstancedMesh;
  private readonly trunks: THREE.InstancedMesh;
  private readonly grass: THREE.InstancedMesh;
  private readonly wildlife: THREE.Points;
  private readonly wildlifeMat: THREE.PointsMaterial;
  private readonly markers: THREE.Mesh[] = [];
  private readonly markerMats: THREE.MeshBasicMaterial[] = [];
  private readonly fadeables: (THREE.Material & { opacity: number })[] = [];

  private readonly groundRadius = 150;

  constructor() {
    this.root.name = 'BiomeLayer';
    this.root.visible = false;

    // ── Dynamic gradient sky ────────────────────────────────────────────────
    this.skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
        uTop: { value: new THREE.Color(0x041018) },
        uHorizon: { value: new THREE.Color(this.active.horizon) },
        uSun: { value: SUN_DIRECTION.clone() },
        uSunColor: { value: new THREE.Color(0xbff0ff) },
      },
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        uniform float uTime; uniform float uOpacity;
        uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uSun; uniform vec3 uSunColor;
        varying vec3 vDir;
        void main() {
          vec3 d = normalize(vDir);
          float h = clamp(d.y * 0.5 + 0.5, 0.0, 1.0);
          vec3 col = mix(uHorizon, uTop, pow(h, 0.65));
          // Soft sun disc + broad atmospheric scatter halo.
          float sun = max(dot(d, normalize(uSun)), 0.0);
          col += uSunColor * pow(sun, 220.0) * 1.4;
          col += uSunColor * pow(sun, 6.0) * 0.18;
          // Drifting high cloud banding for a living sky.
          float band = sin(d.x * 6.0 + uTime * 0.05) * 0.5 + 0.5;
          col += vec3(0.02, 0.05, 0.06) * band * smoothstep(0.0, 0.4, d.y);
          gl_FragColor = vec4(col, uOpacity);
        }
      `,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(820, 32, 24), this.skyMat);
    this.sky.frustumCulled = false;
    this.root.add(this.sky);
    this.fadeables.push(this.skyMat as unknown as THREE.Material & { opacity: number });

    // ── Rolling terrain ─────────────────────────────────────────────────────
    const groundGeo = new THREE.CircleGeometry(this.groundRadius, 96);
    groundGeo.rotateX(-Math.PI / 2);
    this.displaceTerrain(groundGeo);
    this.groundMat = new THREE.MeshStandardMaterial({
      color: this.active.ground,
      roughness: 0.96,
      metalness: 0.0,
      transparent: true,
      opacity: 0,
      envMapIntensity: 0.4,
    });
    this.ground = new THREE.Mesh(groundGeo, this.groundMat);
    this.ground.position.y = -10;
    this.ground.receiveShadow = true;
    this.ground.userData.pick = { id: `biome:${this.active.id}`, scale: Scale.Biome };
    this.root.add(this.ground);
    this.fadeables.push(this.groundMat);

    // ── Atmospheric haze shell (dense fog, cyan-tinted) ─────────────────────
    this.hazeMat = new THREE.MeshBasicMaterial({
      color: 0x1d4a5a,
      transparent: true,
      opacity: 0,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.haze = new THREE.Mesh(new THREE.SphereGeometry(360, 24, 18), this.hazeMat);
    this.haze.frustumCulled = false;
    this.root.add(this.haze);
    this.fadeables.push(this.hazeMat);

    // ── Volumetric sunlight shafts ──────────────────────────────────────────
    this.godRayMat = new THREE.MeshBasicMaterial({
      color: 0xbff0ff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const shaft = new THREE.CylinderGeometry(2, 36, 220, 24, 1, true);
    this.godRays = new THREE.Mesh(shaft, this.godRayMat);
    this.godRays.position.copy(SUN_DIRECTION.clone().multiplyScalar(70)).add(new THREE.Vector3(0, 30, 0));
    this.godRays.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), SUN_DIRECTION);
    this.godRays.frustumCulled = false;
    this.root.add(this.godRays);
    this.fadeables.push(this.godRayMat);

    // ── Vegetation (instanced, wind-animated) ───────────────────────────────
    const TREES = 220;
    const trunkGeo = new THREE.CylinderGeometry(0.18, 0.4, 5, 6);
    trunkGeo.translate(0, 2.5, 0);
    const trunkMat = this.windMaterial(0x3a2a1c, 0.9, 0.6);
    this.trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, TREES);

    const canopyGeo = new THREE.IcosahedronGeometry(2.6, 1);
    canopyGeo.translate(0, 6.2, 0);
    const canopyMat = this.windMaterial(this.active.canopy, 0.85, 0.9);
    this.canopy = new THREE.InstancedMesh(canopyGeo, canopyMat, TREES);
    this.canopy.castShadow = true;

    const grassGeo = new THREE.ConeGeometry(0.16, 1.4, 4);
    grassGeo.translate(0, 0.7, 0);
    const grassMat = this.windMaterial(0x3f7d3a, 0.95, 1.0);
    this.grass = new THREE.InstancedMesh(grassGeo, grassMat, 1400);

    this.scatterVegetation();
    this.trunks.userData.pick = { id: `biome:${this.active.id}`, scale: Scale.Biome };
    this.canopy.userData.pick = { id: `biome:${this.active.id}`, scale: Scale.Biome };
    this.root.add(this.trunks, this.canopy, this.grass);

    // ── Ambient wildlife particles (drifting motes / insects / spores) ──────
    const COUNT = 600;
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 220;
      positions[i * 3 + 1] = Math.random() * 60 - 6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 220;
    }
    const wlGeo = new THREE.BufferGeometry();
    wlGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.wildlifeMat = new THREE.PointsMaterial({
      color: 0x9ff0ff,
      size: 0.5,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    this.wildlife = new THREE.Points(wlGeo, this.wildlifeMat);
    this.wildlife.frustumCulled = false;
    this.root.add(this.wildlife);
    this.fadeables.push(this.wildlifeMat);

    // ── Selectable biome variant waypoints, ringing the horizon ─────────────
    BIOME_VARIANTS.forEach((variant, i) => {
      const angle = (i / BIOME_VARIANTS.length) * Math.PI * 2;
      const mat = new THREE.MeshBasicMaterial({
        color: variant.canopy,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.22, 12, 40), mat);
      ring.position.set(Math.cos(angle) * 96, 16 + Math.sin(i) * 4, Math.sin(angle) * 96);
      ring.lookAt(0, 16, 0);
      ring.userData.pick = { id: `biome:${variant.id}`, scale: Scale.Biome };
      this.markers.push(ring);
      this.markerMats.push(mat);
      this.fadeables.push(mat);
      this.root.add(ring);
    });
  }

  // ---- construction helpers -------------------------------------------------

  /** A wind-swayed MeshStandardMaterial: vertices bend with height and time. */
  private windMaterial(color: number, roughness: number, sway: number): THREE.MeshStandardMaterial {
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness: 0.0,
      transparent: true,
      opacity: 0,
      envMapIntensity: 0.5,
    });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uWind = this.wind;
      shader.uniforms.uSway = { value: sway };
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          '#include <common>\nuniform float uWind;\nuniform float uSway;',
        )
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           float wH = max(transformed.y, 0.0);
           float wPhase = uWind + (position.x + position.z) * 0.25;
           transformed.x += sin(wPhase) * 0.06 * wH * uSway;
           transformed.z += cos(wPhase * 0.8) * 0.05 * wH * uSway;`,
        );
    };
    this.windMaterials.push(mat);
    this.fadeables.push(mat);
    return mat;
  }

  /** Push gentle rolling hills into a flat circle of ground. */
  private displaceTerrain(geo: THREE.BufferGeometry): void {
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h =
        Math.sin(x * 0.05) * Math.cos(z * 0.04) * 3.2 +
        Math.sin(x * 0.13 + z * 0.11) * 1.1;
      pos.setY(i, h);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }

  /** Scatter trees and grass across the terrain with a clearing near the eye. */
  private scatterVegetation(): void {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);

    const place = (mesh: THREE.InstancedMesh, count: number, minR: number, maxR: number, scaleBase: number, scaleVar: number) => {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = minR + Math.random() * (maxR - minR);
        p.set(Math.cos(a) * r, -10 + Math.sin(p.x * 0.05) * 0, Math.sin(a) * r);
        const h =
          Math.sin(p.x * 0.05) * Math.cos(p.z * 0.04) * 3.2 +
          Math.sin(p.x * 0.13 + p.z * 0.11) * 1.1;
        p.y = -10 + h;
        q.setFromAxisAngle(up, Math.random() * Math.PI * 2);
        const sc = scaleBase + Math.random() * scaleVar;
        s.set(sc, sc * (0.85 + Math.random() * 0.4), sc);
        m.compose(p, q, s);
        mesh.setMatrixAt(i, m);
      }
      mesh.instanceMatrix.needsUpdate = true;
    };

    place(this.trunks, this.trunks.count, 18, this.groundRadius * 0.92, 0.7, 0.8);
    // Canopy shares the trunk transforms so foliage sits atop each trunk.
    for (let i = 0; i < this.canopy.count; i++) {
      this.trunks.getMatrixAt(i, m);
      this.canopy.setMatrixAt(i, m);
    }
    this.canopy.instanceMatrix.needsUpdate = true;
    place(this.grass, this.grass.count, 8, this.groundRadius * 0.95, 0.6, 1.0);
  }

  // ---- SceneLayer -----------------------------------------------------------

  /** Recolour the whole place to a chosen biome variant. */
  setVariant(id: string): void {
    const variant = BIOME_VARIANTS.find((v) => v.id === id);
    if (!variant || variant === this.active) return;
    this.active = variant;
    this.groundMat.color.setHex(variant.ground);
    (this.canopy.material as THREE.MeshStandardMaterial).color.setHex(variant.canopy);
    this.skyMat.uniforms.uHorizon.value.setHex(variant.horizon);
    this.ground.userData.pick = { id: `biome:${variant.id}`, scale: Scale.Biome };
  }

  onScaleChange(_scale: Scale, intensity: number): void {
    this.intensity = intensity;
    this.root.visible = intensity > 0.01;
  }

  update(dt: number, elapsed: number): void {
    this.wind.value += dt * 1.6;
    this.skyMat.uniforms.uTime.value = elapsed;

    fadeMaterial(this.groundMat, this.intensity, dt);
    fadeMaterial(this.skyMat as unknown as THREE.Material & { opacity: number }, this.intensity, dt);
    this.skyMat.uniforms.uOpacity.value = this.skyMat.opacity;
    fadeMaterial(this.hazeMat, this.intensity * 0.35, dt);
    fadeMaterial(this.godRayMat, this.intensity * 0.22 * (0.8 + 0.2 * Math.sin(elapsed * 0.7)), dt);
    fadeMaterial(this.wildlifeMat, this.intensity * 0.9, dt);
    for (const mat of this.windMaterials) {
      fadeMaterial(mat as THREE.Material & { opacity: number }, this.intensity, dt);
    }
    this.markerMats.forEach((mat, i) => {
      const pulse = 0.5 + 0.5 * Math.sin(elapsed * 1.5 + i);
      fadeMaterial(mat, this.intensity * (0.35 + pulse * 0.45), dt);
    });

    // Drift wildlife motes upward and recycle them, for a living atmosphere.
    const pos = this.wildlife.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) + dt * (1.2 + (i % 5) * 0.3);
      if (y > 56) y = -6;
      pos.setY(i, y);
      pos.setX(i, pos.getX(i) + Math.sin(elapsed * 0.4 + i) * dt * 0.4);
    }
    pos.needsUpdate = true;

    for (const ring of this.markers) ring.rotation.z += dt * 0.4;
  }

  getPickables(): THREE.Object3D[] {
    if (this.intensity < 0.3) return [];
    return [this.ground, this.canopy, this.trunks, ...this.markers];
  }

  /** Pick metadata for a hovered/selected biome object. */
  static tagFor(id: string): PickTag | null {
    const variant = BIOME_VARIANTS.find((v) => `biome:${v.id}` === id);
    return variant ? { id, scale: Scale.Biome } : null;
  }

  dispose(): void {
    disposeObject(this.root);
  }
}
