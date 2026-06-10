import * as THREE from 'three';

/**
 * A billboard text label rendered from a canvas texture. Used to name planets
 * and other cosmic bodies. Sprites always face the camera and, with size
 * attenuation off, hold a stable on-screen size regardless of distance. The
 * caller owns the returned sprite and disposes it via the scene graph.
 */
export function createSpriteLabel(text: string, color = '#cfe8ff'): THREE.Sprite {
  const pad = 16;
  const font = 48;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.font = `600 ${font}px Inter, system-ui, sans-serif`;
    const width = ctx.measureText(text).width;
    canvas.width = Math.ceil(width + pad * 2);
    canvas.height = font + pad * 2;
    // Re-set after resizing the canvas (which clears the context state).
    ctx.font = `600 ${font}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.shadowBlur = 8;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    sizeAttenuation: false,
  });
  const sprite = new THREE.Sprite(material);
  const aspect = canvas.height > 0 ? canvas.width / canvas.height : 4;
  const h = 0.04;
  sprite.scale.set(h * aspect, h, 1);
  sprite.renderOrder = 10;
  return sprite;
}
