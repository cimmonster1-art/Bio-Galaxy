import * as THREE from 'three';

/**
 * Load a color texture from a URL with sRGB color space and sensible defaults.
 * The returned texture is owned by the caller and is disposed when its material
 * is disposed (see core/dispose). Loading is asynchronous and non-blocking; the
 * material updates when the image arrives, and failures are swallowed so a
 * missing asset never breaks the scene.
 */
export function loadColorTexture(
  url: string,
  loader: THREE.TextureLoader,
  onLoad?: () => void,
): THREE.Texture {
  const texture = loader.load(
    url,
    () => onLoad?.(),
    undefined,
    () => {
      // Leave the material with no map; the base color still renders.
    },
  );
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}
