import * as THREE from 'three';

/**
 * Procedural, canvas-generated textures. Keeping these in code means the atlas
 * ships no binary image assets, stays fully open source, and can tint or
 * regenerate surfaces on the fly. Every texture returned here is owned by the
 * caller and must be disposed on teardown.
 */

/** Soft radial glow, used for node sprites and luminous markers. */
export function createGlowTexture(size = 128): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const c = size / 2;
    const gradient = ctx.createRadialGradient(c, c, 0, c, c, c);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.25, 'rgba(255,255,255,0.7)');
    gradient.addColorStop(0.55, 'rgba(255,255,255,0.18)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Mottled organic surface texture built from layered value noise. Suitable as a
 * subtle roughness or color map on tissue and organelle materials.
 */
export function createOrganicTexture(size = 256, tint = '#1f6f8b'): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const image = ctx.createImageData(size, size);
    const base = new THREE.Color(tint);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const n =
          valueNoise(x * 0.05, y * 0.05) * 0.6 +
          valueNoise(x * 0.13, y * 0.13) * 0.3 +
          valueNoise(x * 0.4, y * 0.4) * 0.1;
        const shade = 0.6 + n * 0.6;
        const i = (y * size + x) * 4;
        image.data[i] = Math.min(255, base.r * 255 * shade);
        image.data[i + 1] = Math.min(255, base.g * 255 * shade);
        image.data[i + 2] = Math.min(255, base.b * 255 * shade);
        image.data[i + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Tileable grayscale noise for use as a bump map, giving organic surfaces fine
 * relief without a normal-map asset. Layered octaves read as a cell-like,
 * mottled membrane texture.
 */
export function createBumpTexture(size = 256, frequency = 0.06): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const image = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const n =
          valueNoise(x * frequency, y * frequency) * 0.55 +
          valueNoise(x * frequency * 3, y * frequency * 3) * 0.3 +
          valueNoise(x * frequency * 7, y * frequency * 7) * 0.15;
        const v = Math.floor(40 + n * 200);
        const i = (y * size + x) * 4;
        image.data[i] = image.data[i + 1] = image.data[i + 2] = v;
        image.data[i + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

// Deterministic 2D value noise so textures are stable across reloads.
function valueNoise(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const tl = rand2(xi, yi);
  const tr = rand2(xi + 1, yi);
  const bl = rand2(xi, yi + 1);
  const br = rand2(xi + 1, yi + 1);
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  return lerp(lerp(tl, tr, u), lerp(bl, br, u), v);
}

function rand2(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
