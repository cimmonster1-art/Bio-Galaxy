import * as THREE from 'three';
import { Scale } from '../types';
import { clampScale, getScaleLevel } from '../data/scales';

/**
 * Owns the semantics of moving between biological scales: the target camera
 * distance for each scale, a continuously eased scale position, and the
 * per-layer intensity weights that drive cross-fading. It does not own the
 * camera or renderer; BioGalaxyScene applies the values it produces.
 */

// Camera distance from the focus point at each scale. Larger when zoomed out.
const SCALE_DISTANCE: Record<Scale, number> = {
  [Scale.Universe]: 150,
  [Scale.Taxonomy]: 95,
  [Scale.Organism]: 55,
  [Scale.OrganSystem]: 42,
  [Scale.Organ]: 32,
  [Scale.Tissue]: 24,
  [Scale.Cell]: 40,
  [Scale.Organelle]: 16,
  [Scale.ProteinComplex]: 22,
  [Scale.Molecule]: 14,
  [Scale.Atom]: 18,
};

export class ScaleNavigator {
  /** Continuous position along the scale ladder; eases toward targetScale. */
  private pos: number;
  private targetScale: Scale;

  constructor(initial: Scale) {
    this.pos = initial;
    this.targetScale = initial;
  }

  get target(): Scale {
    return this.targetScale;
  }

  /** Nearest discrete scale to the current eased position. */
  get nearest(): Scale {
    return clampScale(this.pos);
  }

  get label(): string {
    return getScaleLevel(this.nearest).name;
  }

  setScale(scale: Scale): void {
    this.targetScale = clampScale(scale);
  }

  step(direction: 1 | -1): void {
    this.setScale(clampScale(this.targetScale + direction));
  }

  /** Ease the continuous position. Returns true while still moving. */
  update(dt: number): boolean {
    const diff = this.targetScale - this.pos;
    if (Math.abs(diff) < 0.001) {
      this.pos = this.targetScale;
      return false;
    }
    this.pos += diff * Math.min(1, dt * 3.5);
    return true;
  }

  /** Interpolated camera distance for the current eased position. */
  cameraDistance(): number {
    const lo = Math.floor(this.pos);
    const hi = Math.min(lo + 1, Scale.Atom);
    const frac = this.pos - lo;
    return THREE.MathUtils.lerp(SCALE_DISTANCE[lo as Scale], SCALE_DISTANCE[hi as Scale], frac);
  }

  /**
   * Visibility weight (0..1) for a layer covering `scales`. Full strength when
   * the eased position sits within the layer's range, fading across a one-step
   * transition band on either side.
   */
  intensityFor(scales: Scale[]): number {
    const min = Math.min(...scales);
    const max = Math.max(...scales);
    if (this.pos >= min && this.pos <= max) return 1;
    const dist = this.pos < min ? min - this.pos : this.pos - max;
    return Math.max(0, 1 - dist);
  }
}
