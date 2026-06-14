import * as THREE from 'three';
import { Scale, PickTag } from '../../types';
import { SceneLayer, fadeMaterial } from '../core/SceneLayer';
import { disposeObject } from '../core/dispose';
import { loadColorTexture } from '../textures/loadTexture';
import { EARTH_TEXTURES } from '../../data/cosmos';
import { ECOLOGY_CITIES } from '../../data/ecology';

/**
 * Earth Ecology Explorer — the Ecosystem scale rendered as a living planet you
 * dive into. A Blue Marble globe with atmospheric scattering, a drifting cloud
 * shell, and a faint scientific graticule carries glowing, clickable city
 * markers. Selecting a city eases the globe so that place rotates to the front
 * and its marker expands — a smooth cinematic "city dive" — while React opens
 * the ecological profile, card rail, and copilot grounding above.
 *
 * Cities are not endpoints; they are entry points into life. Each marker picks
 * as `city:<id>`, and the bottom rail's species cards descend into the existing
 * organism ontology, making Earth → City → Ecosystem → Species continuous.
 */

const RADIUS = 13.4;
// Camera sits near +Z and slightly above; bring a focused city to face it.
const FRONT = new THREE.Vector3(0, 0.22, 1).normalize();
const ACCENT = 0x4fe3c8; // ecological cyan-green, matching the atlas palette

interface Marker {
  group: THREE.Group;
  cityId: string;
  baseDir: THREE.Vector3;
  coreMat: THREE.MeshBasicMaterial;
  glowMat: THREE.MeshBasicMaterial;
  ringMat: THREE.MeshBasicMaterial;
  scale: number; // eased visual scale
}

/** Lat/lon (degrees) → unit direction on the globe, matching equirectangular maps. */
function latLonToDir(lat: number, lon: number): THREE.Vector3 {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon + 180);
  return new THREE.Vector3(
    -Math.sin(phi) * Math.cos(theta),
    Math.cos(phi),
    Math.sin(phi) * Math.sin(theta),
  );
}

export class EcologyGlobeLayer implements SceneLayer {
  readonly root = new THREE.Group();
  readonly activeScales = [Scale.Ecosystem];

  private readonly loader = new THREE.TextureLoader();
  private readonly world = new THREE.Group(); // spins / focuses; holds globe + markers
  private readonly globeMat: THREE.MeshStandardMaterial;
  private readonly cloudMat: THREE.MeshStandardMaterial;
  private readonly clouds: THREE.Mesh;
  private readonly atmosphereMat: THREE.MeshBasicMaterial;
  private readonly graticuleMat: THREE.LineBasicMaterial;
  private readonly markers: Marker[] = [];
  private readonly fadeables: (THREE.Material & { opacity: number })[] = [];

  private intensity = 0;
  private selectedCity: string | null = null;
  private focusTarget: THREE.Quaternion | null = null;

  constructor() {
    this.root.name = 'EcologyGlobeLayer';
    this.root.visible = false;
    this.root.add(this.world);

    // ── Globe: day map + night city-lights emission ─────────────────────────
    this.globeMat = new THREE.MeshStandardMaterial({
      map: loadColorTexture(EARTH_TEXTURES.day, this.loader),
      emissiveMap: loadColorTexture(EARTH_TEXTURES.night, this.loader),
      emissive: new THREE.Color('#ffd9a0'),
      emissiveIntensity: 0.5,
      roughness: 0.92,
      metalness: 0,
      transparent: true,
      opacity: 0,
    });
    const globe = new THREE.Mesh(new THREE.SphereGeometry(RADIUS, 64, 64), this.globeMat);
    this.world.add(globe);
    this.fadeables.push(this.globeMat);

    // ── Drifting cloud shell ────────────────────────────────────────────────
    this.cloudMat = new THREE.MeshStandardMaterial({
      map: loadColorTexture(EARTH_TEXTURES.clouds, this.loader),
      alphaMap: loadColorTexture(EARTH_TEXTURES.clouds, this.loader),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      roughness: 1,
    });
    this.clouds = new THREE.Mesh(new THREE.SphereGeometry(RADIUS * 1.015, 64, 64), this.cloudMat);
    this.world.add(this.clouds);
    this.fadeables.push(this.cloudMat);

    // ── Faint scientific graticule (lat/long grid) ──────────────────────────
    this.graticuleMat = new THREE.LineBasicMaterial({
      color: ACCENT, transparent: true, opacity: 0, depthWrite: false,
    });
    this.world.add(this.buildGraticule());
    this.fadeables.push(this.graticuleMat);

    // ── Atmospheric scattering rim (back-faced additive shell) ──────────────
    this.atmosphereMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#3fb6ff'),
      transparent: true,
      opacity: 0,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(RADIUS * 1.06, 48, 48), this.atmosphereMat);
    this.root.add(atmosphere); // stays put; not spun by the world group
    this.fadeables.push(this.atmosphereMat);

    this.buildMarkers();
  }

  private buildGraticule(): THREE.LineSegments {
    const pts: number[] = [];
    const r = RADIUS * 1.002;
    for (let lat = -60; lat <= 60; lat += 30) {
      let prev: THREE.Vector3 | null = null;
      for (let lon = -180; lon <= 180; lon += 6) {
        const v = latLonToDir(lat, lon).multiplyScalar(r);
        if (prev) pts.push(prev.x, prev.y, prev.z, v.x, v.y, v.z);
        prev = v;
      }
    }
    for (let lon = -180; lon < 180; lon += 30) {
      let prev: THREE.Vector3 | null = null;
      for (let lat = -90; lat <= 90; lat += 6) {
        const v = latLonToDir(lat, lon).multiplyScalar(r);
        if (prev) pts.push(prev.x, prev.y, prev.z, v.x, v.y, v.z);
        prev = v;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return new THREE.LineSegments(geo, this.graticuleMat);
  }

  private buildMarkers(): void {
    const up = new THREE.Vector3(0, 1, 0);
    for (const city of ECOLOGY_CITIES) {
      const dir = latLonToDir(city.lat, city.lon);
      const group = new THREE.Group();
      group.position.copy(dir.clone().multiplyScalar(RADIUS * 1.01));
      group.quaternion.setFromUnitVectors(up, dir); // stand the marker off the surface
      group.userData.pick = { id: `city:${city.id}`, scale: Scale.Ecosystem };

      const coreMat = new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0 });
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), coreMat);
      core.position.y = 0.18;
      group.add(core);

      const glowMat = new THREE.MeshBasicMaterial({
        color: ACCENT, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      const glow = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 16), glowMat);
      glow.position.y = 0.18;
      group.add(glow);

      const ringMat = new THREE.MeshBasicMaterial({
        color: ACCENT, transparent: true, opacity: 0, side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.42, 28), ringMat);
      ring.rotation.x = -Math.PI / 2; // lie flat against the surface tangent
      group.add(ring);

      this.world.add(group);
      this.markers.push({ group, cityId: city.id, baseDir: dir, coreMat, glowMat, ringMat, scale: 1 });
      this.fadeables.push(coreMat, glowMat, ringMat);
    }
  }

  /** Drive the cinematic city dive: rotate the chosen place to the front. */
  setSelectedCity(id: string | null): void {
    this.selectedCity = id;
    const marker = id ? this.markers.find((m) => m.cityId === id) : null;
    if (!marker) {
      this.focusTarget = null;
      return;
    }
    // Quaternion that rotates the city's surface direction to face the camera.
    this.focusTarget = new THREE.Quaternion().setFromUnitVectors(marker.baseDir, FRONT);
  }

  onScaleChange(_scale: Scale, intensity: number): void {
    this.intensity = intensity;
    this.root.visible = intensity > 0.01;
  }

  update(dt: number, elapsed: number): void {
    for (const mat of this.fadeables) fadeMaterial(mat, this.intensity, dt);
    // Keep the rim and graticule subordinate to the surface.
    this.atmosphereMat.opacity = Math.min(this.atmosphereMat.opacity, this.intensity * 0.5);
    this.graticuleMat.opacity = Math.min(this.graticuleMat.opacity, this.intensity * 0.22);
    this.cloudMat.opacity = Math.min(this.cloudMat.opacity, this.intensity * 0.65);
    this.clouds.rotation.y += dt * 0.012;

    if (this.focusTarget) {
      // Ease the globe so the selected city rotates smoothly to the front.
      this.world.quaternion.slerp(this.focusTarget, Math.min(1, dt * 2.4));
    } else {
      // Idle: a slow, calm planetary rotation.
      this.world.rotateOnAxis(new THREE.Vector3(0, 1, 0), dt * 0.03);
    }

    // Marker glow: gentle pulse, with the selected city expanded and brighter.
    for (const m of this.markers) {
      const selected = m.cityId === this.selectedCity;
      const targetScale = selected ? 2.3 : 1;
      m.scale += (targetScale - m.scale) * Math.min(1, dt * 6);
      m.group.scale.setScalar(m.scale);
      const pulse = 0.5 + 0.5 * Math.sin(elapsed * 2 + m.baseDir.x * 4);
      const lift = selected ? 1 : 0.55 + pulse * 0.35;
      m.glowMat.opacity = Math.min(m.glowMat.opacity, this.intensity * lift);
      m.ringMat.opacity = Math.min(m.ringMat.opacity, this.intensity * (selected ? 0.9 : 0.3 + pulse * 0.3));
      m.coreMat.opacity = Math.min(m.coreMat.opacity, this.intensity);
    }
  }

  getPickables(): THREE.Object3D[] {
    return this.intensity > 0.3 ? this.markers.map((m) => m.group) : [];
  }

  static tagFor(id: string): PickTag | null {
    return id.startsWith('city:') ? { id, scale: Scale.Ecosystem } : null;
  }

  dispose(): void {
    disposeObject(this.root);
  }
}
