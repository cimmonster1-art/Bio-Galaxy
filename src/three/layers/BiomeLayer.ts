import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Scale, PickTag } from '../../types';
import { SceneLayer, fadeMaterial } from '../core/SceneLayer';
import { disposeObject } from '../core/dispose';
import { loadGlb, fitModel, WILDLIFE_MODELS } from '../core/glbLoader';
import {
  createFoliageTexture, createGroundTexture, createBarkTexture, createBumpTexture,
} from '../textures/proceduralTextures';

/** Merge several displaced spheres into one irregular, bushy crown so a canopy
 *  reads as a clump of foliage rather than a single faceted ball. */
function bushyCrown(radius: number): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const blobs = 5 + Math.floor(Math.random() * 3);
  for (let i = 0; i < blobs; i++) {
    const r = radius * (0.5 + Math.random() * 0.45);
    const sphere = new THREE.IcosahedronGeometry(r, 2);
    // Roughen each blob's surface so the silhouette is leafy, not smooth.
    const p = sphere.attributes.position as THREE.BufferAttribute;
    for (let v = 0; v < p.count; v++) {
      const n = 1 + (Math.random() - 0.5) * 0.28;
      p.setXYZ(v, p.getX(v) * n, p.getY(v) * n, p.getZ(v) * n);
    }
    sphere.translate(
      (Math.random() - 0.5) * radius * 1.1,
      radius * (0.3 + Math.random() * 0.7),
      (Math.random() - 0.5) * radius * 1.1,
    );
    parts.push(sphere);
  }
  const merged = mergeGeometries(parts, false) ?? parts[0];
  merged.computeVertexNormals();
  for (const part of parts) if (part !== merged) part.dispose();
  return merged;
}

/**
 * Biome — a living planetary environment you descend into from orbit. Built as a
 * layered ecosystem rather than a field of identical lollipop trees:
 *
 *   • a hierarchical vegetation system — old-growth canopy, understory saplings,
 *     shrubs, and ground cover — each instanced with strong per-plant variation
 *     in height, tilt, and colour;
 *   • forest-floor clutter — fallen logs, rocks, mushrooms, and dead snags;
 *   • rolling terrain with hills and a hollow, dense atmospheric haze,
 *     volumetric god-ray shafts, a dynamic sky, and wind that sways everything;
 *   • real open-source wildlife models roaming the clearing.
 *
 * Six biome variants ring the horizon as selectable waypoints, and the ground,
 * vegetation, and animals are all clickable.
 */

interface BiomeVariant {
  id: string; name: string; canopy: number; ground: number; horizon: number;
}

export const BIOME_VARIANTS: BiomeVariant[] = [
  { id: 'rainforest', name: 'Tropical Rainforest', canopy: 0x1f6b3a, ground: 0x24351f, horizon: 0x123b32 },
  { id: 'reef', name: 'Coral Reef', canopy: 0x18a3b8, ground: 0x0f3a55, horizon: 0x0a4a63 },
  { id: 'tundra', name: 'Arctic Tundra', canopy: 0xbfe6ff, ground: 0x3a4a5a, horizon: 0x214055 },
  { id: 'savanna', name: 'Savanna', canopy: 0xc7a14a, ground: 0x6b5a2a, horizon: 0x4a3a1e },
  { id: 'temperate', name: 'Temperate Forest', canopy: 0x2f7d4a, ground: 0x2c3a22, horizon: 0x1d4034 },
  { id: 'desert', name: 'Desert', canopy: 0xd9a35a, ground: 0x7a5a32, horizon: 0x5a3a22 },
];

const SUN = new THREE.Vector3(0.45, 0.62, 0.35).normalize();
const GROUND_Y = -10;
const RADIUS = 150;

/** Shared rolling-terrain height field so plants sit on the surface. */
function heightAt(x: number, z: number): number {
  return (
    Math.sin(x * 0.045) * Math.cos(z * 0.04) * 4.2 +
    Math.sin(x * 0.12 + z * 0.1) * 1.4 -
    Math.exp(-((x * x + z * z) / 900)) * 5 // a central hollow / clearing
  );
}

export class BiomeLayer implements SceneLayer {
  readonly root = new THREE.Group();
  readonly activeScales = [Scale.Biome];

  private intensity = 0;
  private active: BiomeVariant = BIOME_VARIANTS[0];
  private readonly wind = { value: 0 };

  private readonly skyMat: THREE.ShaderMaterial;
  private readonly groundMat: THREE.MeshStandardMaterial;
  private readonly ground: THREE.Mesh;
  private readonly hazeMat: THREE.MeshBasicMaterial;
  private readonly godRayMat: THREE.MeshBasicMaterial;
  private readonly wildlifeMat: THREE.PointsMaterial;
  private readonly wildlife: THREE.Points;
  private readonly canopyFoliage: THREE.InstancedMesh;
  private readonly markers: THREE.Mesh[] = [];
  private readonly markerMats: THREE.MeshBasicMaterial[] = [];
  private readonly fadeables: (THREE.Material & { opacity: number })[] = [];
  private readonly windMats: THREE.Material[] = [];
  private readonly pickables: THREE.Object3D[] = [];
  private readonly animals: { group: THREE.Group; angle: number; radius: number; speed: number }[] = [];
  private readonly loadedRoots: THREE.Object3D[] = [];

  // Shared living-world surfaces, generated once and reused across instances.
  private readonly foliageTex = createFoliageTexture('#3f9d4a', 256);
  private readonly foliageBump = createBumpTexture(256, 0.12);
  private readonly barkTex = createBarkTexture('#3c2a1a', 256);
  private readonly groundTex = createGroundTexture('#3f7d3a', '#3a2c1c', 512);
  private readonly groundBump = createBumpTexture(512, 0.05);
  private readonly textures: THREE.Texture[] = [this.foliageTex, this.foliageBump, this.barkTex, this.groundTex, this.groundBump];

  constructor() {
    this.root.name = 'BiomeLayer';
    this.root.visible = false;
    this.foliageTex.repeat.set(2, 2);
    this.barkTex.repeat.set(1, 3);
    this.groundTex.repeat.set(18, 18);
    this.groundBump.repeat.set(24, 24);

    // ── Dynamic sky ───────────────────────────────────────────────────────────
    this.skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, transparent: true,
      uniforms: {
        uTime: { value: 0 }, uOpacity: { value: 0 },
        uTop: { value: new THREE.Color(0x041018) },
        uHorizon: { value: new THREE.Color(this.active.horizon) },
        uSun: { value: SUN.clone() }, uSunColor: { value: new THREE.Color(0xbff0ff) },
      },
      vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `precision highp float; uniform float uTime,uOpacity; uniform vec3 uTop,uHorizon,uSun,uSunColor; varying vec3 vDir;
        void main(){ vec3 d=normalize(vDir); float h=clamp(d.y*0.5+0.5,0.0,1.0);
          vec3 col=mix(uHorizon,uTop,pow(h,0.65)); float sun=max(dot(d,normalize(uSun)),0.0);
          col += uSunColor*pow(sun,220.0)*1.4 + uSunColor*pow(sun,6.0)*0.18;
          col += vec3(0.02,0.05,0.06)*(sin(d.x*6.0+uTime*0.05)*0.5+0.5)*smoothstep(0.0,0.4,d.y);
          gl_FragColor=vec4(col,uOpacity); }`,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(820, 32, 24), this.skyMat);
    sky.frustumCulled = false;
    this.root.add(sky);
    this.fadeables.push(this.skyMat as unknown as THREE.Material & { opacity: number });

    // ── Rolling terrain with a central clearing ───────────────────────────────
    const groundGeo = new THREE.CircleGeometry(RADIUS, 120);
    groundGeo.rotateX(-Math.PI / 2);
    const gp = groundGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < gp.count; i++) gp.setY(i, heightAt(gp.getX(i), gp.getZ(i)));
    gp.needsUpdate = true;
    groundGeo.computeVertexNormals();
    this.groundMat = new THREE.MeshStandardMaterial({
      color: this.active.ground, roughness: 0.97, metalness: 0, transparent: true, opacity: 0, envMapIntensity: 0.4,
      map: this.groundTex, bumpMap: this.groundBump, bumpScale: 0.6,
    });
    this.ground = new THREE.Mesh(groundGeo, this.groundMat);
    this.ground.position.y = GROUND_Y;
    this.ground.receiveShadow = true;
    this.ground.userData.pick = { id: `biome:${this.active.id}`, scale: Scale.Biome };
    this.root.add(this.ground);
    this.fadeables.push(this.groundMat);
    this.pickables.push(this.ground);

    // ── Atmospheric haze + volumetric god-rays ────────────────────────────────
    this.hazeMat = new THREE.MeshBasicMaterial({ color: 0x1d4a5a, transparent: true, opacity: 0, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false });
    const haze = new THREE.Mesh(new THREE.SphereGeometry(360, 24, 18), this.hazeMat);
    haze.frustumCulled = false;
    this.root.add(haze);
    this.fadeables.push(this.hazeMat);

    this.godRayMat = new THREE.MeshBasicMaterial({ color: 0xbff0ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const shaft = new THREE.CylinderGeometry(2, 40, 240, 24, 1, true);
    const godRays = new THREE.Mesh(shaft, this.godRayMat);
    godRays.position.copy(SUN.clone().multiplyScalar(70)).add(new THREE.Vector3(0, 30, 0));
    godRays.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), SUN);
    godRays.frustumCulled = false;
    this.root.add(godRays);
    this.fadeables.push(this.godRayMat);

    // ── Hierarchical vegetation ───────────────────────────────────────────────
    // Canopy: tall old-growth + mature trees, sparse, with wide crowns.
    this.scatterTrees('canopy', 64, 18, RADIUS * 0.92, 9, 9, 0.18);
    this.canopyFoliage = this.lastFoliage!;
    // Understory: smaller trees and saplings, denser.
    this.scatterTrees('understory', 150, 14, RADIUS * 0.95, 3.5, 4, 0.12);
    // Shrubs and bushes.
    this.scatterShrubs(240);
    // Ground cover: dense grass tufts and ferns.
    this.scatterGrass(4200);
    // Forest-floor clutter.
    this.scatterClutter();

    // ── Ambient wildlife particles ────────────────────────────────────────────
    const COUNT = 600;
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 220;
      positions[i * 3 + 1] = Math.random() * 60 - 6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 220;
    }
    const wlGeo = new THREE.BufferGeometry();
    wlGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.wildlifeMat = new THREE.PointsMaterial({ color: 0x9ff0ff, size: 0.5, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true });
    this.wildlife = new THREE.Points(wlGeo, this.wildlifeMat);
    this.wildlife.frustumCulled = false;
    this.root.add(this.wildlife);
    this.fadeables.push(this.wildlifeMat);

    // ── Selectable biome-variant waypoints ────────────────────────────────────
    BIOME_VARIANTS.forEach((variant, i) => {
      const angle = (i / BIOME_VARIANTS.length) * Math.PI * 2;
      const mat = new THREE.MeshBasicMaterial({ color: variant.canopy, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.22, 12, 40), mat);
      ring.position.set(Math.cos(angle) * 96, 16 + Math.sin(i) * 4, Math.sin(angle) * 96);
      ring.lookAt(0, 16, 0);
      ring.userData.pick = { id: `biome:${variant.id}`, scale: Scale.Biome };
      this.markers.push(ring);
      this.markerMats.push(mat);
      this.fadeables.push(mat);
      this.pickables.push(ring);
      this.root.add(ring);
    });

    // ── Real roaming wildlife (best-effort, with no fallback clutter) ──────────
    this.spawnAnimal('deer', 'organism:herbivore', 4, 40);
    this.spawnAnimal('wolf', 'organism:predator', 3.2, 60);
  }

  // ── construction helpers ────────────────────────────────────────────────────

  private lastFoliage: THREE.InstancedMesh | null = null;

  private windMaterial(
    color: number, roughness: number, sway: number,
    opts: { map?: THREE.Texture; bumpMap?: THREE.Texture; flat?: boolean } = {},
  ): THREE.MeshStandardMaterial {
    const mat = new THREE.MeshStandardMaterial({
      color, roughness, metalness: 0, transparent: true, opacity: 0, envMapIntensity: 0.5,
      flatShading: opts.flat ?? true, map: opts.map, bumpMap: opts.bumpMap,
      bumpScale: opts.bumpMap ? 0.4 : undefined,
    });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uWind = this.wind;
      shader.uniforms.uSway = { value: sway };
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uWind;\nuniform float uSway;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
           vec4 wWind = modelMatrix * instanceMatrix * vec4(transformed, 1.0);
           float wPhase = uWind + wWind.x * 0.18 + wWind.z * 0.18;
           float wH = max(transformed.y, 0.0);
           transformed.x += sin(wPhase) * 0.05 * wH * uSway;
           transformed.z += cos(wPhase * 0.8) * 0.04 * wH * uSway;`);
    };
    this.windMats.push(mat);
    this.fadeables.push(mat);
    return mat;
  }

  private trackStd(mat: THREE.MeshStandardMaterial): THREE.MeshStandardMaterial {
    mat.transparent = true; mat.opacity = 0;
    this.fadeables.push(mat);
    return mat;
  }

  /** Scatter a layer of trees: instanced trunks + instanced wind-swayed crowns,
   *  with strong per-tree height, tilt, and colour variation. */
  private scatterTrees(
    key: string, count: number, baseH: number, maxR: number, hVar: number, crownR: number, sway: number,
  ): void {
    const trunkGeo = new THREE.CylinderGeometry(0.16, 0.42, baseH, 8);
    trunkGeo.translate(0, baseH / 2, 0);
    const trunkMat = this.trackStd(new THREE.MeshStandardMaterial({
      color: 0x6a4a30, roughness: 0.95, map: this.barkTex, bumpMap: this.barkTex, bumpScale: 0.5,
    }));
    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, count);

    // A bushy clump of leaf-textured blobs instead of one faceted ball.
    const crownGeo = bushyCrown(crownR);
    crownGeo.translate(0, baseH, 0);
    const crownMat = this.windMaterial(this.active.canopy, 0.92, sway, {
      map: this.foliageTex, bumpMap: this.foliageBump, flat: false,
    });
    const crowns = new THREE.InstancedMesh(crownGeo, crownMat, count);
    crowns.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
    crowns.castShadow = true;

    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    const base = new THREE.Color(this.active.canopy);
    const col = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 14 + Math.random() * (maxR - 14);
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      p.set(x, GROUND_Y + heightAt(x, z), z);
      // Old-growth giants are rare; most are average; some are saplings.
      const roll = Math.random();
      const scale = roll > 0.9 ? 1.5 + Math.random() * 0.8 : roll < 0.25 ? 0.5 + Math.random() * 0.3 : 0.8 + Math.random() * 0.5;
      const tilt = (Math.random() - 0.5) * 0.18;
      e.set(tilt, Math.random() * Math.PI * 2, tilt);
      q.setFromEuler(e);
      s.set(scale + Math.random() * (hVar / baseH) * 0, scale * (0.9 + Math.random() * 0.4), scale);
      s.x = s.z = scale;
      m.compose(p, q, s);
      trunks.setMatrixAt(i, m);
      crowns.setMatrixAt(i, m);
      col.copy(base).offsetHSL((Math.random() - 0.5) * 0.06, (Math.random() - 0.5) * 0.15, (Math.random() - 0.5) * 0.18);
      crowns.setColorAt(i, col);
    }
    trunks.instanceMatrix.needsUpdate = true;
    crowns.instanceMatrix.needsUpdate = true;
    if (crowns.instanceColor) crowns.instanceColor.needsUpdate = true;
    trunks.userData.pick = { id: `biome:${this.active.id}`, scale: Scale.Biome };
    crowns.userData.pick = { id: `biome:${this.active.id}`, scale: Scale.Biome };
    void up; // (kept for clarity of orientation intent)
    this.root.add(trunks, crowns);
    this.pickables.push(trunks, crowns);
    this.lastFoliage = crowns;
  }

  private scatterShrubs(count: number): void {
    const geo = bushyCrown(1.1);
    const mat = this.windMaterial(0x356b2e, 0.9, 0.5, { map: this.foliageTex, bumpMap: this.foliageBump, flat: false });
    const shrubs = new THREE.InstancedMesh(geo, mat, count);
    shrubs.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
    const m = new THREE.Matrix4(); const q = new THREE.Quaternion(); const s = new THREE.Vector3(); const p = new THREE.Vector3();
    const base = new THREE.Color(0x356b2e); const col = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2; const r = 8 + Math.random() * RADIUS * 0.95;
      const x = Math.cos(a) * r; const z = Math.sin(a) * r;
      p.set(x, GROUND_Y + heightAt(x, z), z);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * Math.PI * 2);
      const sc = 0.5 + Math.random() * 1.4;
      s.set(sc, sc * (0.6 + Math.random() * 0.7), sc);
      m.compose(p, q, s);
      shrubs.setMatrixAt(i, m);
      col.copy(base).offsetHSL((Math.random() - 0.5) * 0.05, 0, (Math.random() - 0.5) * 0.16);
      shrubs.setColorAt(i, col);
    }
    shrubs.instanceMatrix.needsUpdate = true;
    if (shrubs.instanceColor) shrubs.instanceColor.needsUpdate = true;
    shrubs.userData.pick = { id: `biome:${this.active.id}`, scale: Scale.Biome };
    this.root.add(shrubs);
    this.pickables.push(shrubs);
  }

  private scatterGrass(count: number): void {
    // A slim, slightly curved blade reads as grass rather than a spike.
    const geo = new THREE.ConeGeometry(0.09, 1.7, 3);
    geo.translate(0, 0.85, 0);
    const mat = this.windMaterial(0x4f9a3e, 0.95, 1.2, { flat: false });
    const grass = new THREE.InstancedMesh(geo, mat, count);
    const m = new THREE.Matrix4(); const q = new THREE.Quaternion(); const s = new THREE.Vector3(); const p = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2; const r = 6 + Math.random() * RADIUS * 0.95;
      const x = Math.cos(a) * r; const z = Math.sin(a) * r;
      p.set(x, GROUND_Y + heightAt(x, z), z);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * Math.PI * 2);
      const sc = 0.6 + Math.random();
      s.set(sc, sc * (0.7 + Math.random()), sc);
      m.compose(p, q, s);
      grass.setMatrixAt(i, m);
    }
    grass.instanceMatrix.needsUpdate = true;
    this.root.add(grass);
  }

  /** Forest-floor clutter: fallen logs, rocks, mushrooms, and dead snags. */
  private scatterClutter(): void {
    const place = (geo: THREE.BufferGeometry, mat: THREE.MeshStandardMaterial, count: number, lay: boolean, scl: () => number) => {
      const mesh = new THREE.InstancedMesh(geo, this.trackStd(mat), count);
      const m = new THREE.Matrix4(); const q = new THREE.Quaternion(); const e = new THREE.Euler(); const s = new THREE.Vector3(); const p = new THREE.Vector3();
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2; const r = 10 + Math.random() * RADIUS * 0.9;
        const x = Math.cos(a) * r; const z = Math.sin(a) * r;
        p.set(x, GROUND_Y + heightAt(x, z) + (lay ? 0.4 : 0), z);
        e.set(lay ? Math.PI / 2 : 0, Math.random() * Math.PI * 2, lay ? (Math.random() - 0.5) * 0.4 : 0);
        q.setFromEuler(e);
        const v = scl(); s.set(v, v, v);
        m.compose(p, q, s);
        mesh.setMatrixAt(i, m);
      }
      mesh.instanceMatrix.needsUpdate = true;
      mesh.receiveShadow = true; mesh.castShadow = true;
      this.root.add(mesh);
    };
    // Fallen logs.
    const logGeo = new THREE.CylinderGeometry(0.4, 0.5, 6, 7); logGeo.translate(0, 3, 0);
    place(logGeo, new THREE.MeshStandardMaterial({ color: 0x4a3422, roughness: 0.95, flatShading: true }), 16, true, () => 0.7 + Math.random() * 0.8);
    // Rocks.
    place(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: 0x6b6b70, roughness: 0.9, flatShading: true }), 44, false, () => 0.5 + Math.random() * 1.6);
    // Dead snags (bare trunks).
    const snagGeo = new THREE.CylinderGeometry(0.18, 0.42, 9, 6); snagGeo.translate(0, 4.5, 0);
    place(snagGeo, new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.95, flatShading: true }), 12, false, () => 0.6 + Math.random() * 0.9);
    // Mushrooms (cap only, instanced; tiny accent).
    const capGeo = new THREE.SphereGeometry(0.35, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2); capGeo.translate(0, 0.3, 0);
    place(capGeo, new THREE.MeshStandardMaterial({ color: 0xc0563f, roughness: 0.7, emissive: 0x3a1208, emissiveIntensity: 0.3, flatShading: true }), 36, false, () => 0.5 + Math.random());
  }

  private spawnAnimal(model: keyof typeof WILDLIFE_MODELS, pickId: string, height: number, radius: number): void {
    loadGlb(WILDLIFE_MODELS[model]).then((scene) => {
      if (!scene) return;
      fitModel(scene, height);
      const group = new THREE.Group();
      group.add(scene);
      group.userData.pick = { id: pickId, scale: Scale.Organism };
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * radius; const z = Math.sin(angle) * radius;
      group.position.set(x, GROUND_Y + heightAt(x, z), z);
      this.root.add(group);
      this.loadedRoots.push(scene);
      this.pickables.push(group);
      this.animals.push({ group, angle, radius, speed: 0.05 + Math.random() * 0.05 });
    });
  }

  // ── SceneLayer ──────────────────────────────────────────────────────────────

  setVariant(id: string): void {
    const variant = BIOME_VARIANTS.find((v) => v.id === id);
    if (!variant || variant === this.active) return;
    this.active = variant;
    this.groundMat.color.setHex(variant.ground);
    (this.canopyFoliage.material as THREE.MeshStandardMaterial).color.setHex(variant.canopy);
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
    for (const mat of this.fadeables) fadeMaterial(mat, this.intensity, dt);
    this.skyMat.uniforms.uOpacity.value = this.skyMat.opacity;
    // Re-weight the atmospheric extras below full strength.
    this.hazeMat.opacity = Math.min(this.hazeMat.opacity, this.intensity * 0.35);
    this.godRayMat.opacity = Math.min(this.godRayMat.opacity, this.intensity * 0.24);
    this.markerMats.forEach((mat, i) => {
      const pulse = 0.5 + 0.5 * Math.sin(elapsed * 1.5 + i);
      mat.opacity = Math.min(mat.opacity, this.intensity * (0.35 + pulse * 0.45));
    });

    const pos = this.wildlife.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) + dt * (1.2 + (i % 5) * 0.3);
      if (y > 56) y = -6;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
    for (const ring of this.markers) ring.rotation.z += dt * 0.4;

    // Roaming animals wander a slow circle and face their heading.
    for (const a of this.animals) {
      a.angle += dt * a.speed;
      const x = Math.cos(a.angle) * a.radius;
      const z = Math.sin(a.angle) * a.radius;
      a.group.position.set(x, GROUND_Y + heightAt(x, z), z);
      a.group.rotation.y = -a.angle + Math.PI / 2;
    }
  }

  getPickables(): THREE.Object3D[] {
    return this.intensity > 0.3 ? this.pickables : [];
  }

  static tagFor(id: string): PickTag | null {
    const variant = BIOME_VARIANTS.find((v) => `biome:${v.id}` === id);
    return variant ? { id, scale: Scale.Biome } : null;
  }

  dispose(): void {
    for (const r of this.loadedRoots) disposeObject(r);
    for (const t of this.textures) t.dispose();
    disposeObject(this.root);
  }
}
