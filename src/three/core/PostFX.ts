import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

/**
 * Post-processing pipeline. A restrained UnrealBloom pass gives luminous nodes,
 * membranes, and structures a soft glow, and the OutputPass applies tone
 * mapping and color management. Bloom is intentionally subtle so the result
 * reads as a serious instrument, not a neon toy.
 *
 * Owns its composer and render targets and disposes them on teardown to avoid
 * WebGL memory leaks.
 */
export class PostFX {
  private readonly composer: EffectComposer;
  private readonly bloom: UnrealBloomPass;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    width: number,
    height: number,
  ) {
    this.composer = new EffectComposer(renderer);
    this.composer.setPixelRatio(renderer.getPixelRatio());
    this.composer.setSize(width, height);

    this.composer.addPass(new RenderPass(scene, camera));

    this.bloom = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.55, // strength
      0.5, // radius
      0.82, // threshold: only bright emissive elements bloom
    );
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
  }

  render(): void {
    this.composer.render();
  }

  setSize(width: number, height: number): void {
    this.composer.setSize(width, height);
    this.bloom.setSize(width, height);
  }

  dispose(): void {
    this.bloom.dispose();
    this.composer.dispose();
  }
}
