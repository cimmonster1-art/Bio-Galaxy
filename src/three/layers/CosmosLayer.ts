import * as THREE from 'three';
import { Scale } from '../../types';
import { SceneLayer, fadeMaterial } from '../core/SceneLayer';
import { disposeObject } from '../core/dispose';
import { loadColorTexture } from '../textures/loadTexture';
import { MILKYWAY_TEXTURE } from '../../data/cosmos';

/**
 * The cosmic backdrop: a luminous core standing in for the Big Bang and
 * galactic center, a deep field of distant galaxies, and a spiral galaxy that
 * resolves as the camera approaches the galaxy scale. Instanced throughout so
 * thousands of points cost only a couple of draw calls. Not pickable; it sets
 * the stage above the solar system.
 */
export class CosmosLayer implements SceneLayer {
  readonly root = new THREE.Group();
  readonly activeScales = [Scale.Cosmos, Scale.Galaxy];

  private readonly field: THREE.InstancedMesh;
  private readonly fieldMat: THREE.MeshBasicMaterial;
  private readonly spiral: THREE.InstancedMesh;
  private readonly spiralMat: THREE.MeshBasicMaterial;
  private readonly core: THREE.Mesh;
  private readonly coreMat: THREE.MeshBasicMaterial;
  private readonly sky: THREE.Mesh;
  private readonly skyMat: THREE.MeshBasicMaterial;
  private readonly stars: THREE.Points;
  private readonly starMat: THREE.PointsMaterial;
  private readonly starTex: THREE.Texture;

  private readonly loader = new THREE.TextureLoader();

  private intensity = 0;
  private currentScale: Scale = Scale.Cosmos;

  constructor() {
    this.root.name = 'CosmosLayer';
    this.root.visible = false;

    // Milky Way panorama on the inside of a vast back-faced sphere, so the deep
    // field sits inside the real galactic band at the cosmos scale.
    this.skyMat = new THREE.MeshBasicMaterial({
      map: loadColorTexture(MILKYWAY_TEXTURE, this.loader),
      color: 0x8893a8,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(620, 64, 64), this.skyMat);
    this.root.add(this.sky);

    // Bright core: the Big Bang origin and, later, the galactic center.
    this.coreMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#fff1d6'),
      transparent: true,
      opacity: 0,
    });
    this.core = new THREE.Mesh(new THREE.SphereGeometry(6, 32, 32), this.coreMat);
    this.root.add(this.core);

    // Deep field of distant galaxies.
    const fieldCount = 1800;
    this.fieldMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0 });
    this.field = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.7, 0), this.fieldMat, fieldCount);
    this.field.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(fieldCount * 3), 3);
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    for (let i = 0; i < fieldCount; i++) {
      const dir = randomDir();
      const r = 90 + Math.random() * 460;
      dummy.position.copy(dir.multiplyScalar(r));
      dummy.scale.setScalar(0.5 + Math.random() * 2.4);
      dummy.updateMatrix();
      this.field.setMatrixAt(i, dummy.matrix);
      color.setHSL((200 + Math.random() * 120) / 360, 0.5, 0.55 + Math.random() * 0.3);
      this.field.setColorAt(i, color);
    }
    this.field.instanceMatrix.needsUpdate = true;
    this.root.add(this.field);

    // Spiral galaxy that resolves near the galaxy scale.
    const spiralCount = 4200;
    this.spiralMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0 });
    this.spiral = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.4, 0), this.spiralMat, spiralCount);
    this.spiral.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(spiralCount * 3), 3);
    const warm = new THREE.Color('#ffe7b3');
    const cool = new THREE.Color('#8fbfff');
    for (let i = 0; i < spiralCount; i++) {
      const t = i / spiralCount;
      const arm = i % 2 === 0 ? 0 : Math.PI;
      const radius = 8 + t * 130;
      const angle = arm + t * 9 + (Math.random() - 0.5) * 0.5;
      const spread = (1 - t) * 4 + 1.5;
      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * spread;
      const z = Math.sin(angle) * radius + (Math.random() - 0.5) * spread;
      const y = (Math.random() - 0.5) * (3 + (1 - t) * 8);
      dummy.position.set(x, y, z);
      dummy.scale.setScalar(0.5 + Math.random() * 1.4);
      dummy.updateMatrix();
      this.spiral.setMatrixAt(i, dummy.matrix);
      color.copy(cool).lerp(warm, Math.max(0, 1 - t * 1.6));
      this.spiral.setColorAt(i, color);
    }
    this.spiral.instanceMatrix.needsUpdate = true;
    this.root.add(this.spiral);

    // Dense deep-space starfield: a single THREE.Points so the entire sky is one
    // draw call no matter how many stars. Most stars sit on a vast back-faced
    // shell, with a thick Milky Way band of extra stars across the equator and a
    // sprinkling of brighter, nearer foreground stars. Colour runs from cool
    // blue-white to warm amber by temperature.
    const starCount = 600000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    const starColor = new THREE.Color();
    // Roughly a fifth of the stars cluster into the galactic band; the rest are
    // spread uniformly over the shell so the field never reads as a single blob.
    const bandShare = 0.22;
    const foregroundShare = 0.01;
    for (let i = 0; i < starCount; i++) {
      const roll = Math.random();
      let dir: THREE.Vector3;
      let radius: number;
      let size: number;
      let temp: number;
      if (roll < foregroundShare) {
        // Bright foreground stars: nearer, larger, slightly warmer on average.
        dir = randomDir();
        radius = 120 + Math.random() * 200;
        size = 2.6 + Math.random() * 3.4;
        temp = Math.random();
      } else if (roll < foregroundShare + bandShare) {
        // Milky Way band: cluster latitude tightly around the equatorial plane.
        const theta = Math.random() * Math.PI * 2;
        const lat = (Math.random() - 0.5) * 0.34 + gaussian() * 0.06;
        const cosLat = Math.cos(lat);
        dir = new THREE.Vector3(
          cosLat * Math.cos(theta),
          Math.sin(lat),
          cosLat * Math.sin(theta),
        );
        radius = 520 + Math.random() * 80;
        size = 0.7 + Math.random() * 1.6;
        temp = Math.random();
      } else {
        // Uniform shell of distant stars filling the rest of the sky.
        dir = randomDir();
        radius = 540 + Math.random() * 60;
        size = 0.5 + Math.random() * 1.1;
        temp = Math.random();
      }
      positions[i * 3] = dir.x * radius;
      positions[i * 3 + 1] = dir.y * radius;
      positions[i * 3 + 2] = dir.z * radius;
      sizes[i] = size;
      // Temperature ramp: cool blue-white -> neutral white -> warm amber.
      const hue = (210 - temp * 180) / 360;
      const lightness = 0.6 + Math.random() * 0.25;
      starColor.setHSL(hue < 0 ? hue + 1 : hue, 0.45 + temp * 0.25, lightness);
      colors[i * 3] = starColor.r;
      colors[i * 3 + 1] = starColor.g;
      colors[i * 3 + 2] = starColor.b;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.starTex = createStarTexture();
    this.starMat = new THREE.PointsMaterial({
      map: this.starTex,
      size: 2.2,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.stars = new THREE.Points(starGeo, this.starMat);
    // Render the starfield behind everything else in the layer.
    this.stars.renderOrder = -1;
    this.root.add(this.stars);
  }

  onScaleChange(scale: Scale, intensity: number): void {
    this.currentScale = scale;
    this.intensity = intensity;
    this.root.visible = intensity > 0.01;
  }

  update(dt: number, elapsed: number): void {
    const galaxyWeight = this.currentScale >= Scale.Galaxy ? 1 : 0.35;
    const fieldWeight = this.currentScale <= Scale.Cosmos ? 1 : 0.5;
    fadeMaterial(this.coreMat, this.intensity, dt);
    fadeMaterial(this.fieldMat, this.intensity * fieldWeight, dt);
    fadeMaterial(this.spiralMat, this.intensity * galaxyWeight, dt);
    fadeMaterial(this.skyMat, this.intensity * fieldWeight * 0.8, dt);
    // The dense starfield carries the cosmos scale and recedes as we dive in.
    fadeMaterial(this.starMat, this.intensity * fieldWeight, dt);

    this.sky.rotation.y = elapsed * 0.002;
    this.spiral.rotation.y = elapsed * 0.02;
    this.field.rotation.y = elapsed * 0.004;
    this.stars.rotation.y = elapsed * 0.0015;
    const pulse = 1 + Math.sin(elapsed * 1.5) * 0.05;
    this.core.scale.setScalar(pulse);
  }

  getPickables(): THREE.Object3D[] {
    return [];
  }

  dispose(): void {
    disposeObject(this.root);
  }
}

function randomDir(): THREE.Vector3 {
  const u = Math.random();
  const v = Math.random();
  const theta = u * Math.PI * 2;
  const phi = Math.acos(2 * v - 1);
  return new THREE.Vector3(
    Math.sin(phi) * Math.cos(theta),
    Math.sin(phi) * Math.sin(theta),
    Math.cos(phi),
  );
}

/** Approximate standard normal sample via the central limit theorem. */
function gaussian(): number {
  return (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
}

/**
 * A small soft round point sprite for the starfield, generated once and shared
 * by every star. A radial alpha falloff keeps points from reading as hard
 * squares under additive blending.
 */
function createStarTexture(size = 64): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const c = size / 2;
    const gradient = ctx.createRadialGradient(c, c, 0, c, c, c);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.35, 'rgba(255,255,255,0.55)');
    gradient.addColorStop(0.7, 'rgba(255,255,255,0.12)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
