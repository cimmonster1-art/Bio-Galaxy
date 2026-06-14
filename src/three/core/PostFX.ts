import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { VignetteShader } from 'three/examples/jsm/shaders/VignetteShader.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

/**
 * Post-processing pipeline shared by every scale, so the whole atlas looks like
 * it belongs to one universe:
 *
 *   • an HDR, multisampled render target — crisp anti-aliased edges that read
 *     like temporal AA, with headroom for bright emissive elements to bloom;
 *   • a restrained UnrealBloom pass for the soft glow on nodes, membranes,
 *     god-rays, and structures;
 *   • a gentle vignette that pulls the eye inward toward the subject;
 *   • an OutputPass applying ACES tone mapping and color management.
 *
 * Owns its composer and render targets and disposes them on teardown to avoid
 * WebGL memory leaks.
 */
export class PostFX {
  private readonly composer: EffectComposer;
  private readonly bloom: UnrealBloomPass;
  private readonly renderTarget: THREE.WebGLRenderTarget;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    width: number,
    height: number,
  ) {
    const dpr = renderer.getPixelRatio();
    const samples = renderer.capabilities.isWebGL2 ? 4 : 0;
    this.renderTarget = new THREE.WebGLRenderTarget(
      Math.max(1, Math.floor(width * dpr)),
      Math.max(1, Math.floor(height * dpr)),
      { type: THREE.HalfFloatType, samples },
    );

    this.composer = new EffectComposer(renderer, this.renderTarget);
    this.composer.setPixelRatio(dpr);
    this.composer.setSize(width, height);

    this.composer.addPass(new RenderPass(scene, camera));

    this.bloom = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.42, // strength
      0.5, // radius
      0.82, // threshold: only genuinely bright elements bloom
    );
    this.composer.addPass(this.bloom);

    const vignette = new ShaderPass(VignetteShader);
    vignette.uniforms.offset.value = 1.1;
    vignette.uniforms.darkness.value = 1.05;
    this.composer.addPass(vignette);

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
    this.renderTarget.dispose();
    this.composer.dispose();
  }
}
