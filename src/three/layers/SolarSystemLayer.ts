import * as THREE from 'three';
import { Scale } from '../../types';
import { SceneLayer, fadeMaterial } from '../core/SceneLayer';
import { disposeObject } from '../core/dispose';
import { createSpriteLabel } from '../labels/SpriteLabel';
import {
  createAstroSunTexture,
  createLensFlareTexture,
  createProminenceTexture,
  createGasGiantTexture,
  createRockyTexture,
  createIceGiantTexture,
} from '../textures/proceduralTextures';
import {
  PLANETS,
  SUN,
  ASTEROID_BELT,
  auToUnits,
  PlanetData,
  SurfaceSpec,
} from '../../data/cosmos';

interface OrbitingBody {
  /** Rotates each frame to carry the planet around its orbit. */
  pivot: THREE.Group;
  /** The planet sphere; spins on its own axis. */
  mesh: THREE.Mesh;
  orbitSpeed: number;
  spinSpeed: number;
  moons: { pivot: THREE.Group; speed: number }[];
}

// Orbital angular speed follows v ∝ 1/sqrt(a), so the inner planets sweep faster
// than the outer ones, as they really do. Spin speed is tuned from the sidereal
// rotation period, preserving direction (retrograde stays retrograde).
const ORBIT_BASE = 0.22;
function orbitSpeedFor(au: number): number {
  return ORBIT_BASE / Math.sqrt(au);
}
function spinSpeedFor(rotationHours: number): number {
  const dir = Math.sign(rotationHours) || 1;
  return dir * THREE.MathUtils.clamp(12 / Math.abs(rotationHours), 0.02, 1.5);
}

/**
 * A heliocentric solar system rebuilt from real astronomy: a corona-lit Sun, the
 * eight planets on AU-derived, inclined orbits with procedurally textured
 * surfaces (upgraded by live open-licensed maps when they load), atmospheric
 * hazes, Saturn's ring, major moons, an asteroid belt, and billboard labels.
 * Planets are pickable; selecting Earth dives to the planet scale. Visible around
 * the Solar System scale and cross-faded with its neighbours.
 */
export class SolarSystemLayer implements SceneLayer {
  readonly root = new THREE.Group();
  readonly activeScales = [Scale.SolarSystem];

  private readonly loader = new THREE.TextureLoader();
  private readonly bodies: OrbitingBody[] = [];
  private readonly fadeables: (THREE.Material & { opacity: number })[] = [];
  private readonly sunLight: THREE.PointLight;
  private readonly corona: THREE.Sprite;
  private readonly pickables: THREE.Object3D[] = [];
  private readonly ownedTextures: THREE.Texture[] = [];
  private readonly belt: THREE.InstancedMesh;
  private readonly beltMat: THREE.MeshStandardMaterial;
  private intensity = 0;

  // Sun corona shells that breathe, and prominence flames that flicker — driven
  // each frame so the star reads as a living photosphere, exactly as Astro's.
  private readonly coronaShells: { mesh: THREE.Mesh; base: number; speed: number; phase: number; amp: number }[] = [];
  private readonly prominences: THREE.Sprite[] = [];

  constructor() {
    this.root.name = 'SolarSystemLayer';
    this.root.visible = false;

    // Sun: a photoreal SDO-style photosphere — deep red-orange with a bright
    // magma filament network — kept unlit so the bloom pass and the layered
    // corona shells below give it a living glow. Ported to match Astro's sky.
    const sunTex = createAstroSunTexture();
    this.ownedTextures.push(sunTex);
    const sunMat = new THREE.MeshBasicMaterial({
      map: sunTex,
      transparent: true,
      opacity: 0,
      color: 0xffffff,
    });
    const sun = new THREE.Mesh(new THREE.SphereGeometry(SUN.radius, 128, 128), sunMat);
    sun.userData.pick = { id: 'planet:sun', scale: Scale.SolarSystem };
    this.root.add(sun);
    this.fadeables.push(sunMat);
    this.pickables.push(sun);

    // Thin chromosphere shell — a hair brighter on the limb, suggesting the
    // glowing atmosphere clinging to the photosphere.
    const chromoMat = new THREE.MeshBasicMaterial({
      color: 0xff5018,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
    });
    const chromo = new THREE.Mesh(new THREE.SphereGeometry(SUN.radius * 1.012, 96, 96), chromoMat);
    sun.add(chromo);
    chromoMat.userData.fadeWeight = 0.22;
    this.fadeables.push(chromoMat);

    // Corona: additive layered shells fading from hot orange to deep crimson,
    // each breathing at its own rate. Exact colors/opacities/radii from Astro.
    const coronaColors = [0xff7028, 0xe85a18, 0xc0380a, 0x9a2a08, 0x6a1a04, 0x401004];
    const coronaOpacity = [0.22, 0.2, 0.17, 0.12, 0.08, 0.04];
    [1.05, 1.14, 1.3, 1.6, 2.1, 2.9].forEach((mult, i) => {
      const cm = new THREE.MeshBasicMaterial({
        color: coronaColors[i],
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const cmesh = new THREE.Mesh(new THREE.SphereGeometry(SUN.radius * mult, 48, 48), cm);
      this.root.add(cmesh);
      cm.userData.fadeWeight = coronaOpacity[i];
      this.fadeables.push(cm);
      this.coronaShells.push({ mesh: cmesh, base: SUN.radius * mult, speed: 0.6 + i * 0.2, phase: i, amp: 0.025 + i * 0.012 });
    });

    // Prominence arcs: small bright flame loops licking off the limb, placed on
    // a ring around the Sun and flickering with a slow independent pulse.
    const promTex = createProminenceTexture();
    this.ownedTextures.push(promTex);
    const PROM_COUNT = 14;
    for (let i = 0; i < PROM_COUNT; i++) {
      const ang = (i / PROM_COUNT) * Math.PI * 2 + Math.random() * 0.3;
      const tilt = (Math.random() - 0.5) * 0.6;
      const scale = SUN.radius * (0.28 + Math.random() * 0.32);
      const rDist = SUN.radius * 1.04;
      const promMat = new THREE.SpriteMaterial({
        map: promTex,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(promMat);
      const sx = Math.cos(ang) * rDist;
      const sy = Math.sin(tilt) * rDist * 0.4;
      const sz = Math.sin(ang) * rDist;
      const outDir = new THREE.Vector3(sx, sy, sz).normalize();
      sprite.position.set(sx + outDir.x * scale * 0.45, sy + outDir.y * scale * 0.45, sz + outDir.z * scale * 0.45);
      sprite.scale.set(scale * 0.8, scale, 1);
      this.root.add(sprite);
      promMat.userData.fadeWeight = 0.9;
      this.fadeables.push(promMat);
      this.prominences.push(sprite);
    }

    // Soft outer glare halo behind the disc — a tinted lens flare with faint
    // diffraction spikes. depthTest stays on so planets in front still occlude.
    const flareTex = createLensFlareTexture(255, 120, 50);
    this.ownedTextures.push(flareTex);
    const flareMat = new THREE.SpriteMaterial({
      map: flareTex,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.corona = new THREE.Sprite(flareMat);
    this.corona.scale.setScalar(SUN.radius * 4.2);
    this.root.add(this.corona);
    flareMat.userData.fadeWeight = 0.35;
    this.fadeables.push(flareMat);

    const sunLabel = createSpriteLabel('Sun', '#ffd9a0');
    sunLabel.position.set(0, SUN.radius + 3, 0);
    this.root.add(sunLabel);
    this.fadeables.push(sunLabel.material);

    this.sunLight = new THREE.PointLight(0xfff4e0, 0, 0, 0.5);
    this.root.add(this.sunLight);

    for (const planet of PLANETS) this.addPlanet(planet);

    // Main asteroid belt between Mars and Jupiter, scattered through a thin torus.
    const { innerAu, outerAu, count } = ASTEROID_BELT;
    const inner = auToUnits(innerAu);
    const outer = auToUnits(outerAu);
    this.beltMat = new THREE.MeshStandardMaterial({
      color: 0x8a7f72,
      roughness: 0.95,
      metalness: 0,
      transparent: true,
      opacity: 0,
    });
    this.belt = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.07, 0), this.beltMat, count);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = inner + Math.random() * (outer - inner);
      dummy.position.set(Math.cos(a) * r, (Math.random() - 0.5) * 1.6, Math.sin(a) * r);
      dummy.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      dummy.scale.setScalar(0.4 + Math.random() * 1.6);
      dummy.updateMatrix();
      this.belt.setMatrixAt(i, dummy.matrix);
    }
    this.belt.instanceMatrix.needsUpdate = true;
    this.fadeables.push(this.beltMat);
    this.root.add(this.belt);
  }

  /** Build the procedural surface map for a planet from its descriptor. */
  private surfaceTexture(spec: SurfaceSpec): THREE.Texture {
    switch (spec.kind) {
      case 'sun':
        return createAstroSunTexture();
      case 'gas':
        return createGasGiantTexture({ palette: spec.palette, storm: spec.storm });
      case 'ice':
        return createIceGiantTexture(spec.base, spec.accent);
      case 'rocky':
      default:
        return createRockyTexture({ base: spec.base, highland: spec.highland, craters: spec.craters });
    }
  }

  /** Asynchronously upgrade a material's map to a live photographic texture. */
  private upgradeMap(material: THREE.MeshStandardMaterial | THREE.MeshBasicMaterial, url: string): void {
    this.loader.load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        material.map = tex;
        material.needsUpdate = true;
        this.ownedTextures.push(tex);
      },
      undefined,
      () => {
        /* keep the procedural surface */
      },
    );
  }

  private addPlanet(data: PlanetData): void {
    const orbit = auToUnits(data.au);

    // An orbit group tilted by the planet's inclination, holding a spin pivot.
    const orbitGroup = new THREE.Group();
    orbitGroup.rotation.x = THREE.MathUtils.degToRad(data.inclination ?? 0);
    this.root.add(orbitGroup);

    const pivot = new THREE.Group();
    pivot.rotation.y = Math.random() * Math.PI * 2;
    orbitGroup.add(pivot);

    // Orbit ring in the body's orbital plane: Astro's signature lavender, glowing
    // additively so the whole solar system is laced with luminous ellipses.
    const orbitMat = new THREE.MeshBasicMaterial({
      color: 0xb494f5,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const orbitRing = new THREE.Mesh(
      new THREE.RingGeometry(orbit - 0.05, orbit + 0.05, 256),
      orbitMat,
    );
    orbitRing.rotation.x = Math.PI / 2;
    orbitGroup.add(orbitRing);
    orbitMat.userData.fadeWeight = 0.32;
    this.fadeables.push(orbitMat);

    const surfaceTex = this.surfaceTexture(data.surface);
    this.ownedTextures.push(surfaceTex);
    const mat = new THREE.MeshStandardMaterial({
      map: surfaceTex,
      color: 0xffffff,
      roughness: data.surface.kind === 'gas' || data.surface.kind === 'ice' ? 0.62 : 0.92,
      metalness: 0.0,
      transparent: true,
      opacity: 0,
    });
    this.upgradeMap(mat, data.texture);
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(data.radius, 64, 64), mat);
    mesh.position.x = orbit;
    mesh.rotation.z = THREE.MathUtils.degToRad(data.tilt);
    mesh.userData.pick = {
      id: `planet:${data.id}`,
      scale: data.id === 'earth' ? Scale.Planet : Scale.SolarSystem,
    };
    pivot.add(mesh);
    this.fadeables.push(mat);
    this.pickables.push(mesh);

    // Soft atmospheric haze: an additive back-faced shell hugging the horizon.
    if (data.atmosphere) {
      const atmoMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(data.atmosphere.color),
        transparent: true,
        opacity: 0,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const atmo = new THREE.Mesh(new THREE.SphereGeometry(data.radius * 1.06, 48, 48), atmoMat);
      mesh.add(atmo);
      this.fadeables.push(atmoMat);
      // Track the desired atmosphere strength so fade respects its opacity cap.
      atmoMat.userData.fadeWeight = data.atmosphere.opacity;
    }

    if (data.ring) {
      const ringTex = createRingTexture();
      this.ownedTextures.push(ringTex);
      const ringMat = new THREE.MeshBasicMaterial({
        map: ringTex,
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      this.upgradeMap(ringMat, data.ring.texture);
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(data.ring.inner, data.ring.outer, 96),
        ringMat,
      );
      ring.rotation.x = Math.PI / 2.1;
      mesh.add(ring);
      this.fadeables.push(ringMat);
    }

    const label = createSpriteLabel(data.name, '#cfe8ff');
    label.position.set(orbit, data.radius + 2, 0);
    pivot.add(label);
    this.fadeables.push(label.material);

    const moons: { pivot: THREE.Group; speed: number }[] = [];
    for (const moon of data.moons ?? []) {
      const moonPivot = new THREE.Group();
      moonPivot.rotation.y = Math.random() * Math.PI * 2;
      mesh.add(moonPivot);
      const moonMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(moon.color ?? '#b9b6b0'),
        roughness: 0.95,
        transparent: true,
        opacity: 0,
      });
      const moonMesh = new THREE.Mesh(new THREE.SphereGeometry(moon.radius, 24, 24), moonMat);
      moonMesh.position.x = moon.orbit;
      moonPivot.add(moonMesh);
      this.fadeables.push(moonMat);
      moons.push({ pivot: moonPivot, speed: moon.speed });
    }

    this.bodies.push({
      pivot,
      mesh,
      orbitSpeed: orbitSpeedFor(data.au),
      spinSpeed: spinSpeedFor(data.rotationHours),
      moons,
    });
  }

  onScaleChange(_scale: Scale, intensity: number): void {
    this.intensity = intensity;
    this.root.visible = intensity > 0.01;
  }

  update(dt: number, elapsed: number): void {
    this.sunLight.intensity = 2.6 * this.intensity;
    for (const f of this.fadeables) {
      const weight = (f.userData?.fadeWeight as number | undefined) ?? 1;
      fadeMaterial(f, this.intensity * weight, dt);
    }
    // Gentle flare-halo shimmer.
    this.corona.scale.setScalar(SUN.radius * (4.0 + Math.sin(elapsed * 1.2) * 0.35));
    // Corona shells breathe, each at its own rate, for a living photosphere.
    for (const shell of this.coronaShells) {
      const s = 1 + Math.sin(elapsed * shell.speed + shell.phase) * shell.amp;
      shell.mesh.scale.setScalar(s);
    }
    // Prominences flicker independently so the limb looks alive.
    this.prominences.forEach((sprite, i) => {
      const mat = sprite.material as THREE.SpriteMaterial;
      const flicker = 0.7 + Math.sin(elapsed * (0.5 + (i % 5) * 0.13) + i) * 0.22;
      mat.opacity = this.intensity * 0.9 * flicker;
    });
    if (this.intensity < 0.02) return;
    this.belt.rotation.y += dt * 0.02;
    for (const body of this.bodies) {
      body.pivot.rotation.y += dt * body.orbitSpeed;
      body.mesh.rotation.y += dt * body.spinSpeed;
      for (const moon of body.moons) moon.pivot.rotation.y += dt * moon.speed * 0.5;
    }
  }

  getPickables(): THREE.Object3D[] {
    return this.intensity > 0.25 ? this.pickables : [];
  }

  dispose(): void {
    for (const tex of this.ownedTextures) tex.dispose();
    disposeObject(this.root);
  }
}

/** A simple banded ring texture so the ring reads as ice particles, not a disc. */
function createRingTexture(): THREE.Texture {
  const w = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    for (let x = 0; x < w; x++) {
      const t = x / w;
      // Concentric gaps (Cassini division near the middle) and brightness bands.
      const gap = Math.abs(t - 0.6) < 0.03 ? 0.15 : 1;
      const band = (0.55 + Math.sin(t * 60) * 0.12 + Math.sin(t * 17) * 0.18) * gap;
      const a = THREE.MathUtils.clamp(band, 0, 1);
      ctx.fillStyle = `rgba(228,210,170,${a})`;
      ctx.fillRect(x, 0, 1, 16);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}
