import * as THREE from 'three';
import { Scale } from '../../types';
import { SceneLayer, fadeMaterial } from '../core/SceneLayer';
import { disposeObject } from '../core/dispose';
import { loadColorTexture } from '../textures/loadTexture';
import { createSpriteLabel } from '../labels/SpriteLabel';
import { PLANETS, SUN, PlanetData, MOON_TEXTURE, MILKYWAY_TEXTURE } from '../../data/cosmos';
import { heliocentricLongitudes } from '../../data/ephemeris';

interface OrbitingBody {
  id: string;
  pivot: THREE.Group;
  mesh: THREE.Mesh;
  orbitSpeed: number;
  spinSpeed: number;
  moons: { pivot: THREE.Group; speed: number }[];
}

/**
 * A heliocentric solar system: a luminous Sun, the eight planets on compressed
 * orbits with real open-licensed surface maps, Saturn's ring, major moons, and
 * billboard labels. Planets are pickable so selecting Earth dives to the planet
 * scale. Visible around the Solar System scale and cross-faded with its
 * neighbours.
 */
export class SolarSystemLayer implements SceneLayer {
  readonly root = new THREE.Group();
  readonly activeScales = [Scale.SolarSystem];

  private readonly loader = new THREE.TextureLoader();
  private readonly bodies: OrbitingBody[] = [];
  private readonly fadeables: (THREE.Material & { opacity: number })[] = [];
  private readonly sunLight: THREE.PointLight;
  private readonly pickables: THREE.Object3D[] = [];
  private intensity = 0;
  // Once a date is scrubbed in, planet angles come from the ephemeris and the
  // gentle auto-advance stands down so it does not fight the scrubbed positions.
  private simDate: Date | null = null;

  constructor() {
    this.root.name = 'SolarSystemLayer';
    this.root.visible = false;

    // Background sky dome: the real Milky Way panorama on the inside of a large
    // back-faced sphere, so the system sits in an actual starfield. Fades with
    // the layer intensity.
    const skyMat = new THREE.MeshBasicMaterial({
      map: loadColorTexture(MILKYWAY_TEXTURE, this.loader),
      color: 0x9099aa,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 64, 64), skyMat);
    this.root.add(sky);
    this.fadeables.push(skyMat);

    // Sun: unlit and bright so the bloom pass gives it a corona.
    const sunMat = new THREE.MeshBasicMaterial({
      map: loadColorTexture(SUN.texture, this.loader),
      transparent: true,
      opacity: 0,
      color: 0xffffff,
    });
    const sun = new THREE.Mesh(new THREE.SphereGeometry(SUN.radius, 64, 64), sunMat);
    sun.userData.pick = { id: 'planet:sun', scale: Scale.SolarSystem };
    this.root.add(sun);
    this.fadeables.push(sunMat);
    this.pickables.push(sun);

    // Additive corona shell: a larger glow around the Sun so bloom renders it
    // as a blazing, incandescent star.
    const coronaMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#ffd28a'),
      transparent: true,
      opacity: 0,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const corona = new THREE.Mesh(new THREE.SphereGeometry(SUN.radius * 1.6, 64, 64), coronaMat);
    sun.add(corona);
    this.fadeables.push(coronaMat);

    const sunLabel = createSpriteLabel('Sun', '#ffd9a0');
    sunLabel.position.set(0, SUN.radius + 3, 0);
    this.root.add(sunLabel);
    this.fadeables.push(sunLabel.material);

    this.sunLight = new THREE.PointLight(0xfff4e0, 0, 0, 0.6);
    this.root.add(this.sunLight);

    for (const planet of PLANETS) this.addPlanet(planet);
  }

  private addPlanet(data: PlanetData): void {
    const pivot = new THREE.Group();
    pivot.rotation.y = Math.random() * Math.PI * 2;
    this.root.add(pivot);

    // Faint orbit ring in the ecliptic plane.
    const orbitMat = new THREE.MeshBasicMaterial({
      color: 0x3a5a78,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const orbit = new THREE.Mesh(
      new THREE.RingGeometry(data.orbit - 0.05, data.orbit + 0.05, 128),
      orbitMat,
    );
    orbit.rotation.x = Math.PI / 2;
    this.root.add(orbit);
    this.fadeables.push(orbitMat);

    // Reuse the surface map as a subtle bump map for low-relief surface detail.
    const mat = new THREE.MeshStandardMaterial({
      map: loadColorTexture(data.texture, this.loader),
      bumpMap: loadColorTexture(data.texture, this.loader),
      bumpScale: 0.04,
      color: new THREE.Color(data.color),
      roughness: 0.85,
      metalness: 0.0,
      transparent: true,
      opacity: 0,
    });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(data.radius, 64, 64), mat);
    mesh.position.x = data.orbit;
    mesh.userData.pick = { id: `planet:${data.id}`, scale: data.id === 'earth' ? Scale.Planet : Scale.SolarSystem };
    pivot.add(mesh);
    this.fadeables.push(mat);
    this.pickables.push(mesh);

    if (data.ring) {
      const ringMat = new THREE.MeshBasicMaterial({
        map: loadColorTexture(data.ring.texture, this.loader),
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(data.ring.inner, data.ring.outer, 64),
        ringMat,
      );
      ring.rotation.x = Math.PI / 2.2;
      mesh.add(ring);
      this.fadeables.push(ringMat);
    }

    const label = createSpriteLabel(data.name, '#cfe8ff');
    label.position.set(data.orbit, data.radius + 2, 0);
    pivot.add(label);
    this.fadeables.push(label.material);

    const moons: { pivot: THREE.Group; speed: number }[] = [];
    for (const moon of data.moons ?? []) {
      const moonPivot = new THREE.Group();
      mesh.add(moonPivot);
      const moonMat = new THREE.MeshStandardMaterial({
        map: loadColorTexture(MOON_TEXTURE, this.loader),
        bumpMap: loadColorTexture(MOON_TEXTURE, this.loader),
        bumpScale: 0.04,
        color: 0xffffff,
        roughness: 0.9,
        transparent: true,
        opacity: 0,
      });
      const moonMesh = new THREE.Mesh(new THREE.SphereGeometry(moon.radius, 32, 32), moonMat);
      moonMesh.position.x = moon.orbit;
      moonPivot.add(moonMesh);
      this.fadeables.push(moonMat);
      moons.push({ pivot: moonPivot, speed: moon.speed });
    }

    this.bodies.push({ id: data.id, pivot, mesh, orbitSpeed: data.speed, spinSpeed: data.spin, moons });
  }

  /**
   * Place every planet at its true heliocentric ecliptic longitude for the
   * given date, using the astronomy-engine ephemeris. A time scrubber drives
   * this so the system is scientifically correct for any simulation date. Once
   * set, update() honors these angles instead of auto-advancing.
   */
  setDate(date: Date): void {
    this.simDate = date;
    const longitudes = heliocentricLongitudes(date);
    for (const body of this.bodies) {
      const lon = longitudes[body.id];
      if (lon !== undefined) body.pivot.rotation.y = lon;
    }
  }

  onScaleChange(_scale: Scale, intensity: number): void {
    this.intensity = intensity;
    this.root.visible = intensity > 0.01;
  }

  update(dt: number, _elapsed: number): void {
    this.sunLight.intensity = 2.4 * this.intensity;
    for (const f of this.fadeables) fadeMaterial(f, this.intensity, dt);
    if (this.intensity < 0.02) return;
    for (const body of this.bodies) {
      // Only auto-advance the orbit when no date has been scrubbed in; once a
      // date is set the ephemeris owns the orbital angle and we leave it alone.
      if (this.simDate === null) body.pivot.rotation.y += dt * body.orbitSpeed * 0.25;
      body.mesh.rotation.y += dt * body.spinSpeed * 0.4;
      for (const moon of body.moons) moon.pivot.rotation.y += dt * moon.speed * 0.5;
    }
  }

  getPickables(): THREE.Object3D[] {
    return this.intensity > 0.25 ? this.pickables : [];
  }

  dispose(): void {
    disposeObject(this.root);
  }
}
