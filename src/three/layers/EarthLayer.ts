import * as THREE from 'three';
import { Scale } from '../../types';
import { SceneLayer, fadeMaterial } from '../core/SceneLayer';
import { disposeObject } from '../core/dispose';
import { loadColorTexture } from '../textures/loadTexture';
import { EARTH_TEXTURES } from '../../data/cosmos';

/**
 * Earth as a Blue Marble: NASA Visible Earth day imagery, city-light night
 * emission, a drifting cloud shell, and a soft atmospheric rim. Centered at the
 * origin and shown at the Planet scale, it is the bridge between the solar
 * system above and the Tree of Life below.
 */
export class EarthLayer implements SceneLayer {
  readonly root = new THREE.Group();
  readonly activeScales = [Scale.Planet];

  private readonly loader = new THREE.TextureLoader();
  private readonly globe: THREE.Mesh;
  private readonly globeMat: THREE.MeshStandardMaterial;
  private readonly clouds: THREE.Mesh;
  private readonly cloudMat: THREE.MeshStandardMaterial;
  private readonly atmosphere: THREE.Mesh;
  private readonly atmosphereMat: THREE.MeshBasicMaterial;
  private intensity = 0;

  private readonly radius = 14;

  constructor() {
    this.root.name = 'EarthLayer';
    this.root.visible = false;
    this.root.rotation.z = THREE.MathUtils.degToRad(23.4); // axial tilt

    // The day map doubles as a subtle bump map for terrain relief.
    this.globeMat = new THREE.MeshStandardMaterial({
      map: loadColorTexture(EARTH_TEXTURES.day, this.loader),
      bumpMap: loadColorTexture(EARTH_TEXTURES.day, this.loader),
      bumpScale: 0.05,
      emissiveMap: loadColorTexture(EARTH_TEXTURES.night, this.loader),
      emissive: new THREE.Color('#ffd9a0'),
      emissiveIntensity: 0.55,
      roughness: 0.92,
      metalness: 0.0,
      transparent: true,
      opacity: 0,
    });
    this.globe = new THREE.Mesh(new THREE.SphereGeometry(this.radius, 128, 128), this.globeMat);
    this.globe.userData.pick = { id: 'planet:earth', scale: Scale.Planet };
    this.root.add(this.globe);

    this.cloudMat = new THREE.MeshStandardMaterial({
      map: loadColorTexture(EARTH_TEXTURES.clouds, this.loader),
      alphaMap: loadColorTexture(EARTH_TEXTURES.clouds, this.loader),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      roughness: 1,
    });
    this.clouds = new THREE.Mesh(
      new THREE.SphereGeometry(this.radius * 1.015, 96, 96),
      this.cloudMat,
    );
    this.root.add(this.clouds);

    // Soft atmospheric halo: a slightly larger back-faced shell.
    this.atmosphereMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#5aa9ff'),
      transparent: true,
      opacity: 0,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(this.radius * 1.06, 48, 48),
      this.atmosphereMat,
    );
    this.root.add(this.atmosphere);
  }

  onScaleChange(_scale: Scale, intensity: number): void {
    this.intensity = intensity;
    this.root.visible = intensity > 0.01;
  }

  update(dt: number, _elapsed: number): void {
    fadeMaterial(this.globeMat, this.intensity, dt);
    fadeMaterial(this.cloudMat, this.intensity * 0.7, dt);
    fadeMaterial(this.atmosphereMat, this.intensity * 0.35, dt);
    this.globe.rotation.y += dt * 0.04;
    this.clouds.rotation.y += dt * 0.05;
  }

  getPickables(): THREE.Object3D[] {
    return this.intensity > 0.3 ? [this.globe] : [];
  }

  dispose(): void {
    disposeObject(this.root);
  }
}
