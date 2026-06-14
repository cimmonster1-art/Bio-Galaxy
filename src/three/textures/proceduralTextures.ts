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
 * Lens-flare cross used behind the Sun: a hot white core fading to the given
 * tint, with two long and two short diffraction spikes. Additive-blended by the
 * caller. Ported to match Astro-insight's flagship sky exactly.
 */
export function createLensFlareTexture(r: number, g: number, b: number): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  if (ctx) {
    const cx = 128;
    const cy = 128;
    const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60);
    core.addColorStop(0, 'rgba(255,255,255,1)');
    core.addColorStop(0.2, `rgba(${r},${g},${b},0.95)`);
    core.addColorStop(0.6, `rgba(${r},${g},${b},0.25)`);
    core.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = core;
    ctx.fillRect(0, 0, 256, 256);
    const drawSpike = (angle: number, len: number, width: number): void => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      const grad = ctx.createLinearGradient(-len, 0, len, 0);
      grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
      grad.addColorStop(0.45, `rgba(${r},${g},${b},0.7)`);
      grad.addColorStop(0.5, 'rgba(255,255,255,1)');
      grad.addColorStop(0.55, `rgba(${r},${g},${b},0.7)`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(-len, -width / 2, len * 2, width);
      ctx.restore();
    };
    drawSpike(0, 120, 4);
    drawSpike(Math.PI / 2, 120, 4);
    drawSpike(Math.PI / 4, 80, 2);
    drawSpike(-Math.PI / 4, 80, 2);
  }
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * A single upward flame loop for solar prominences arcing off the Sun's limb:
 * bright orange at the base fading up into hot wisps. Additive sprite texture,
 * ported to match Astro-insight's flagship sky exactly.
 */
export function createProminenceTexture(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  if (g) {
    g.fillStyle = '#000';
    g.fillRect(0, 0, 128, 128);
    g.globalCompositeOperation = 'lighter';
    const grad = g.createLinearGradient(64, 110, 64, 20);
    grad.addColorStop(0, 'rgba(255,200,120,0.95)');
    grad.addColorStop(0.25, 'rgba(255,140,50,0.85)');
    grad.addColorStop(0.55, 'rgba(240,80,20,0.55)');
    grad.addColorStop(1, 'rgba(160,30,10,0)');
    g.fillStyle = grad;
    for (let i = 0; i < 14; i++) {
      const y = 110 - i * 6;
      const w = 18 - i * 0.9 + Math.sin(i * 1.3) * 3;
      const x = 64 + Math.sin(i * 0.7) * 4;
      g.beginPath();
      g.ellipse(x, y, w, 7, 0, 0, Math.PI * 2);
      g.fill();
    }
    for (let i = 0; i < 30; i++) {
      const ny = 110 - Math.random() * 90;
      const nx = 64 + (Math.random() - 0.5) * 18;
      const nr = 1 + Math.random() * 3;
      g.fillStyle = `rgba(255,${(140 + Math.random() * 80) | 0},${(40 + Math.random() * 60) | 0},${0.3 + Math.random() * 0.5})`;
      g.beginPath();
      g.arc(nx, ny, nr, 0, Math.PI * 2);
      g.fill();
    }
  }
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Photoreal SDO-style Sun photosphere: a deep red-orange base with a bright
 * magma filament network, dark active-region patches, and hot equatorial plage.
 * Ported from Astro-insight so the Solar System scale matches its flagship sky.
 */
export function createAstroSunTexture(): THREE.Texture {
  const W = 2048;
  const H = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext('2d');
  if (!g) return createGlowTexture();

  // Deep red-orange base, darker at the poles like SDO 304 imagery.
  const base = g.createLinearGradient(0, 0, 0, H);
  base.addColorStop(0.0, '#3a0a02');
  base.addColorStop(0.18, '#7a1a04');
  base.addColorStop(0.4, '#b8300a');
  base.addColorStop(0.5, '#d04010');
  base.addColorStop(0.6, '#b8300a');
  base.addColorStop(0.82, '#7a1a04');
  base.addColorStop(1.0, '#3a0a02');
  g.fillStyle = base;
  g.fillRect(0, 0, W, H);

  // Multi-octave value-noise field for the filament network.
  const noiseW = 256;
  const noiseH = 128;
  const noiseGrid = new Float32Array(noiseW * noiseH);
  for (let i = 0; i < noiseGrid.length; i++) noiseGrid[i] = Math.random();
  const sampleSmooth = (nx: number, ny: number): number => {
    const fx = ((((nx % 1) + 1) % 1)) * noiseW;
    const fy = Math.max(0, Math.min(1, ny)) * (noiseH - 1);
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const x1 = (x0 + 1) % noiseW;
    const y1 = Math.min(noiseH - 1, y0 + 1);
    const tx = fx - x0;
    const ty = fy - y0;
    const a = noiseGrid[y0 * noiseW + x0];
    const b = noiseGrid[y0 * noiseW + x1];
    const cc = noiseGrid[y1 * noiseW + x0];
    const d = noiseGrid[y1 * noiseW + x1];
    return a * (1 - tx) * (1 - ty) + b * tx * (1 - ty) + cc * (1 - tx) * ty + d * tx * ty;
  };
  const fbmS = (u: number, v: number): number => {
    let sum = 0;
    let amp = 0.5;
    let freq = 1;
    for (let o = 0; o < 5; o++) {
      sum += sampleSmooth(u * freq, v * freq) * amp;
      amp *= 0.55;
      freq *= 2.05;
    }
    return sum;
  };

  const img = g.getImageData(0, 0, W, H);
  const data = img.data;
  for (let y = 0; y < H; y++) {
    const v = y / H;
    const eq = 1 - Math.pow(Math.abs(v - 0.5) * 2, 1.6);
    for (let x = 0; x < W; x++) {
      const u = x / W;
      const n = fbmS(u * 6, v * 3);
      const filament = Math.pow(Math.max(0, n - 0.42) * 1.7, 1.8);
      const dark = Math.pow(Math.max(0, 0.48 - n) * 1.6, 1.6);
      const idx = (y * W + x) * 4;
      const rr = data[idx];
      const gC = data[idx + 1];
      const bb = data[idx + 2];
      const hi = filament * (180 + 60 * eq);
      const hiG = filament * (90 + 40 * eq);
      const hiB = filament * 18;
      const lo = dark * 110;
      data[idx] = Math.max(0, Math.min(255, rr + hi - lo));
      data[idx + 1] = Math.max(0, Math.min(255, gC + hiG - lo * 0.7));
      data[idx + 2] = Math.max(0, Math.min(255, bb + hiB - lo * 0.4));
    }
  }
  g.putImageData(img, 0, 0);

  // Higher-frequency speckle for crispness.
  g.globalCompositeOperation = 'screen';
  for (let i = 0; i < 22000; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const r = Math.random() * 1.6 + 0.4;
    const hot = Math.random();
    if (hot > 0.92) g.fillStyle = 'rgba(255,180,90,0.55)';
    else if (hot > 0.62) g.fillStyle = 'rgba(255,120,40,0.25)';
    else g.fillStyle = 'rgba(120,30,8,0.18)';
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  // Dark active-region patches.
  g.globalCompositeOperation = 'multiply';
  for (let i = 0; i < 18; i++) {
    const x = Math.random() * W;
    const y = 180 + Math.random() * 660;
    const r = 26 + Math.random() * 80;
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(40,8,0,0.85)');
    grad.addColorStop(0.7, 'rgba(90,20,5,0.45)');
    grad.addColorStop(1, 'rgba(120,40,10,0)');
    g.fillStyle = grad;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  // Bright plage along the equatorial band.
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 24; i++) {
    const x = Math.random() * W;
    const y = 320 + Math.random() * 380;
    const r = 40 + Math.random() * 120;
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(255,160,70,0.40)');
    grad.addColorStop(0.6, 'rgba(220,90,30,0.18)');
    grad.addColorStop(1, 'rgba(220,90,30,0)');
    g.fillStyle = grad;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  g.globalCompositeOperation = 'source-over';

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.wrapS = THREE.RepeatWrapping;
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

// ---- living-world surface maps ----------------------------------------------
//
// Tileable canvas textures for the biome, ecosystem, tissue, and organ scales so
// foliage, ground, bark, and muscle read as real surfaces rather than flat
// colour. Each returns a RepeatWrapping CanvasTexture owned by the caller.

function tiled(canvas: HTMLCanvasElement, srgb = true): THREE.Texture {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

/**
 * Bushy foliage: a dense scatter of individual leaf blobs in varied greens, so a
 * canopy reads as thousands of leaves instead of a smooth painted shell. Tints
 * around the given base colour.
 */
export function createFoliageTexture(base = '#2f7d3a', size = 256): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const b = new THREE.Color(base);
    const dark = b.clone().multiplyScalar(0.5);
    ctx.fillStyle = `rgb(${(dark.r * 255) | 0},${(dark.g * 255) | 0},${(dark.b * 255) | 0})`;
    ctx.fillRect(0, 0, size, size);
    const col = new THREE.Color();
    // Wrap leaves across the seam by drawing each blob in a 3×3 toroidal stamp.
    for (let i = 0; i < 1500; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 2 + Math.random() * 5;
      col.copy(b).offsetHSL((Math.random() - 0.5) * 0.08, (Math.random() - 0.5) * 0.25, (Math.random() - 0.5) * 0.4);
      ctx.fillStyle = `rgba(${(col.r * 255) | 0},${(col.g * 255) | 0},${(col.b * 255) | 0},0.85)`;
      const rot = Math.random() * Math.PI;
      for (const ox of [-size, 0, size]) {
        for (const oy of [-size, 0, size]) {
          ctx.save();
          ctx.translate(x + ox, y + oy);
          ctx.rotate(rot);
          ctx.beginPath();
          ctx.ellipse(0, 0, r, r * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    }
  }
  return tiled(canvas);
}

/** A single leaf shape with a midrib, on transparent ground, for foliage cards. */
export function createLeafCardTexture(base = '#3f9d4a', size = 128): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const c = size / 2;
    const b = new THREE.Color(base);
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, `rgb(${(b.r * 255 * 1.2) | 0},${(b.g * 255 * 1.2) | 0},${(b.b * 255 * 1.2) | 0})`);
    grad.addColorStop(1, `rgb(${(b.r * 255 * 0.55) | 0},${(b.g * 255 * 0.55) | 0},${(b.b * 255 * 0.55) | 0})`);
    ctx.fillStyle = grad;
    // A pointed-oval leaf silhouette.
    ctx.beginPath();
    ctx.moveTo(c, 6);
    ctx.bezierCurveTo(size - 8, size * 0.3, size - 8, size * 0.7, c, size - 6);
    ctx.bezierCurveTo(8, size * 0.7, 8, size * 0.3, c, 6);
    ctx.fill();
    // Midrib + a few veins.
    ctx.strokeStyle = `rgba(${(b.r * 255 * 0.4) | 0},${(b.g * 255 * 0.45) | 0},${(b.b * 255 * 0.4) | 0},0.7)`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(c, 8); ctx.lineTo(c, size - 8); ctx.stroke();
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
      const y = 8 + (i / 5) * (size - 16);
      ctx.beginPath(); ctx.moveTo(c, y); ctx.lineTo(c + (size * 0.3) * (1 - i / 6), y + size * 0.12); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(c, y); ctx.lineTo(c - (size * 0.3) * (1 - i / 6), y + size * 0.12); ctx.stroke();
    }
  }
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

/** Mottled grassy ground: a noisy grass/earth blend speckled with blades and pebbles. */
export function createGroundTexture(grass = '#3f7d3a', earth = '#4a3a24', size = 512): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = new THREE.Color(grass);
    const e = new THREE.Color(earth);
    const img = ctx.createImageData(size, size);
    const col = new THREE.Color();
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const n = fbm(x * 0.03, y * 0.03, 4) * 0.7 + fbm(x * 0.12, y * 0.12, 2) * 0.3;
        col.copy(e).lerp(g, THREE.MathUtils.clamp(n * 1.5 - 0.1, 0, 1));
        col.multiplyScalar(0.8 + valueNoise(x * 0.5, y * 0.5) * 0.4);
        const i = (y * size + x) * 4;
        img.data[i] = col.r * 255; img.data[i + 1] = col.g * 255; img.data[i + 2] = col.b * 255; img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    // Short grass-blade strokes and a few pebbles for fine detail.
    for (let i = 0; i < 2600; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      const c = g.clone().offsetHSL((Math.random() - 0.5) * 0.06, 0, (Math.random() - 0.3) * 0.3);
      ctx.strokeStyle = `rgba(${(c.r * 255) | 0},${(c.g * 255) | 0},${(c.b * 255) | 0},0.5)`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (Math.random() - 0.5) * 3, y - 2 - Math.random() * 4); ctx.stroke();
    }
  }
  return tiled(canvas);
}

/** Tree bark: vertical fibrous streaks with darker cracks. */
export function createBarkTexture(base = '#4a3322', size = 256): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const b = new THREE.Color(base);
    ctx.fillStyle = `rgb(${(b.r * 255) | 0},${(b.g * 255) | 0},${(b.b * 255) | 0})`;
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 240; i++) {
      const x = Math.random() * size;
      const c = b.clone().multiplyScalar(0.5 + Math.random() * 0.9);
      ctx.strokeStyle = `rgba(${(c.r * 255) | 0},${(c.g * 255) | 0},${(c.b * 255) | 0},0.55)`;
      ctx.lineWidth = 0.6 + Math.random() * 2.4;
      ctx.beginPath();
      let y = 0; let cx = x;
      ctx.moveTo(cx, y);
      while (y < size) { y += 8; cx += (Math.random() - 0.5) * 4; ctx.lineTo(cx, y); }
      ctx.stroke();
    }
  }
  return tiled(canvas);
}

/**
 * Myocardium grayscale relief: interwoven muscle-fibre striations with darker
 * crevices. Sampled (red channel) as a triplanar detail/bump map so the heart
 * and skeletal muscle read as real fibrous tissue rather than smooth rubber.
 */
export function createMuscleTexture(size = 512): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const img = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Wavy fibre bundles flowing across the surface, broken up by fbm so
        // they twist like real muscle rather than ruled lines.
        const warp = fbm(x * 0.02, y * 0.02, 3) * 6.0;
        const fibre = 0.5 + 0.5 * Math.sin((y + warp * 8) * 0.32 + Math.sin(x * 0.05) * 2.0);
        const bundle = 0.5 + 0.5 * Math.sin(y * 0.045 + fbm(x * 0.05, y * 0.05, 2) * 4.0);
        const crev = fbm(x * 0.09, y * 0.015, 3);
        let v = fibre * 0.55 + bundle * 0.3 + crev * 0.15;
        v = Math.pow(THREE.MathUtils.clamp(v, 0, 1), 1.2);
        const g = (40 + v * 200) | 0;
        const i = (y * size + x) * 4;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = g; img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }
  return tiled(canvas, false);
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
