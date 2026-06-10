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

/**
 * Soft star/clade sprite: a luminous core with a faint cross flare, used for the
 * Tree of Life nodes and deep-field points so they read as glowing markers
 * rather than faceted polygons. Additive-blended by the caller.
 */
export function createStarTexture(size = 128): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const c = size / 2;
    const core = ctx.createRadialGradient(c, c, 0, c, c, c);
    core.addColorStop(0, 'rgba(255,255,255,1)');
    core.addColorStop(0.18, 'rgba(255,255,255,0.85)');
    core.addColorStop(0.45, 'rgba(255,255,255,0.22)');
    core.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = core;
    ctx.fillRect(0, 0, size, size);
    // Four-point diffraction flare for a crisp, star-like highlight.
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = Math.max(1, size / 96);
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI;
      const len = c * 0.92;
      const grad = ctx.createLinearGradient(
        c - Math.cos(a) * len, c - Math.sin(a) * len,
        c + Math.cos(a) * len, c + Math.sin(a) * len,
      );
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(0.5, 'rgba(255,255,255,0.55)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = grad;
      ctx.beginPath();
      ctx.moveTo(c - Math.cos(a) * len, c - Math.sin(a) * len);
      ctx.lineTo(c + Math.cos(a) * len, c + Math.sin(a) * len);
      ctx.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

// ---- planetary surface maps -------------------------------------------------
//
// Equirectangular (2:1) canvas maps generated from fractal noise. They give every
// body a textured, sampled-looking surface offline, so the atlas never depends on
// a network fetch to look finished; live NASA/threex maps still layer on top when
// they load. Each returns an sRGB CanvasTexture owned by the caller.

interface SurfaceCanvas {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
}

function surface(width = 1024): SurfaceCanvas | null {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = width / 2;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  return { ctx, w: canvas.width, h: canvas.height };
}

function finishSurface(ctx: CanvasRenderingContext2D, equirect = true): THREE.Texture {
  const texture = new THREE.CanvasTexture(ctx.canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  if (equirect) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
  }
  texture.needsUpdate = true;
  return texture;
}

/** The Sun: a roiling photosphere of granulation, plage, and dark sunspots. */
export function createSunTexture(): THREE.Texture {
  const s = surface(1024);
  if (!s) return createGlowTexture();
  const { ctx, w, h } = s;
  const img = ctx.createImageData(w, h);
  const hot = new THREE.Color('#fff3c0');
  const mid = new THREE.Color('#ff8a1e');
  const deep = new THREE.Color('#b03205');
  const col = new THREE.Color();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const n =
        fbm(x * 0.02, y * 0.02, 5) * 0.6 +
        fbm(x * 0.08, y * 0.08, 3) * 0.3 +
        fbm(x * 0.3, y * 0.3, 2) * 0.1;
      const granule = valueNoise(x * 0.7, y * 0.7);
      let t = THREE.MathUtils.clamp(n * 1.5 - 0.2 + granule * 0.18, 0, 1);
      col.copy(deep).lerp(mid, THREE.MathUtils.clamp(t * 2, 0, 1));
      if (t > 0.5) col.lerp(hot, (t - 0.5) * 2);
      // Occasional dark active regions (sunspots).
      const spot = fbm(x * 0.012 + 11, y * 0.012 + 7, 3);
      if (spot > 0.78) col.multiplyScalar(0.35 + (spot - 0.78) * 0.5);
      const i = (y * w + x) * 4;
      img.data[i] = col.r * 255;
      img.data[i + 1] = col.g * 255;
      img.data[i + 2] = col.b * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return finishSurface(ctx);
}

/** Banded gas-giant atmosphere with turbulent zones and an optional storm. */
export function createGasGiantTexture(opts: {
  palette: string[];
  storm?: { u: number; v: number; color: string; size: number };
  turbulence?: number;
}): THREE.Texture {
  const s = surface(1024);
  if (!s) return createOrganicTexture(256, opts.palette[0]);
  const { ctx, w, h } = s;
  const img = ctx.createImageData(w, h);
  const bands = opts.palette.map((c) => new THREE.Color(c));
  const col = new THREE.Color();
  const turb = opts.turbulence ?? 14;
  for (let y = 0; y < h; y++) {
    const lat = y / h;
    for (let x = 0; x < w; x++) {
      // Warp the latitude so bands ripple, then sample the palette.
      const warp = (fbm(x * 0.012, y * 0.05, 4) - 0.5) * 0.06;
      const b = (lat + warp) * (bands.length - 1) * 1.0;
      const i0 = Math.max(0, Math.min(bands.length - 1, Math.floor(b)));
      const i1 = Math.min(bands.length - 1, i0 + 1);
      col.copy(bands[i0]).lerp(bands[i1], b - i0);
      const flow = fbm(x * 0.02 + lat * turb, y * 0.18, 3);
      col.multiplyScalar(0.82 + flow * 0.36);
      const i = (y * w + x) * 4;
      img.data[i] = col.r * 255;
      img.data[i + 1] = col.g * 255;
      img.data[i + 2] = col.b * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  // Paint a swirling oval storm (e.g. the Great Red Spot).
  if (opts.storm) {
    const { u, v, color, size } = opts.storm;
    ctx.save();
    ctx.translate(u * w, v * h);
    ctx.scale(size * w * 0.16, size * h * 0.12);
    for (let r = 1; r >= 0; r -= 0.12) {
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      const cc = new THREE.Color(color).multiplyScalar(0.6 + r * 0.6);
      g.addColorStop(0, `rgba(${cc.r * 255 | 0},${cc.g * 255 | 0},${cc.b * 255 | 0},0.9)`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  return finishSurface(ctx);
}

/** Rocky/regolith body: a tinted crust pocked with impact craters. */
export function createRockyTexture(opts: {
  base: string;
  highland?: string;
  craters?: number;
}): THREE.Texture {
  const s = surface(1024);
  if (!s) return createOrganicTexture(256, opts.base);
  const { ctx, w, h } = s;
  const img = ctx.createImageData(w, h);
  const base = new THREE.Color(opts.base);
  const high = new THREE.Color(opts.highland ?? opts.base).multiplyScalar(1.25);
  const col = new THREE.Color();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const n = fbm(x * 0.015, y * 0.015, 5) * 0.7 + fbm(x * 0.09, y * 0.09, 3) * 0.3;
      col.copy(base).lerp(high, THREE.MathUtils.clamp(n * 1.4 - 0.1, 0, 1));
      col.multiplyScalar(0.8 + valueNoise(x * 0.5, y * 0.5) * 0.4);
      const i = (y * w + x) * 4;
      img.data[i] = col.r * 255;
      img.data[i + 1] = col.g * 255;
      img.data[i + 2] = col.b * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  // Scatter craters with bright rims and shadowed floors.
  const count = opts.craters ?? 2200;
  for (let k = 0; k < count; k++) {
    const cx = Math.random() * w;
    const cy = Math.random() * h;
    const r = 1 + Math.pow(Math.random(), 3) * 16;
    const rim = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r);
    rim.addColorStop(0, 'rgba(0,0,0,0.28)');
    rim.addColorStop(0.78, 'rgba(0,0,0,0.18)');
    rim.addColorStop(0.85, 'rgba(255,255,255,0.22)');
    rim.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = rim;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  return finishSurface(ctx);
}

/** Smooth ice-giant atmosphere: faint methane bands over a clear blue/teal base. */
export function createIceGiantTexture(base: string, accent: string): THREE.Texture {
  const s = surface(1024);
  if (!s) return createOrganicTexture(256, base);
  const { ctx, w, h } = s;
  const img = ctx.createImageData(w, h);
  const a = new THREE.Color(base);
  const b = new THREE.Color(accent);
  const col = new THREE.Color();
  for (let y = 0; y < h; y++) {
    const lat = y / h;
    for (let x = 0; x < w; x++) {
      const warp = (fbm(x * 0.01, y * 0.04, 3) - 0.5) * 0.05;
      const band = 0.5 + Math.sin((lat + warp) * Math.PI * 7) * 0.5;
      col.copy(a).lerp(b, band * 0.4);
      col.multiplyScalar(0.92 + fbm(x * 0.03, y * 0.1, 2) * 0.16);
      const i = (y * w + x) * 4;
      img.data[i] = col.r * 255;
      img.data[i + 1] = col.g * 255;
      img.data[i + 2] = col.b * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return finishSurface(ctx);
}

/** Layered fractal Brownian motion built from the value-noise basis. */
function fbm(x: number, y: number, octaves = 4): number {
  let v = 0;
  let a = 0.5;
  let fx = x;
  let fy = y;
  for (let o = 0; o < octaves; o++) {
    v += a * valueNoise(fx, fy);
    fx *= 2.03;
    fy *= 2.03;
    a *= 0.5;
  }
  return v;
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
