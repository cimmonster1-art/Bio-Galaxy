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
// The curve eases the descent so each step reads as a continuous dive rather
// than a jump between pages.
const SCALE_DISTANCE: Record<Scale, number> = {
  [Scale.Cosmos]: 620,
  [Scale.Galaxy]: 380,
  [Scale.SolarSystem]: 220,
  [Scale.Planet]: 90,
  [Scale.TreeOfLife]: 150,
  [Scale.Domain]: 132,
  [Scale.Kingdom]: 116,
  [Scale.Phylum]: 102,
  [Scale.Class]: 90,
  [Scale.Order]: 80,
  [Scale.Family]: 70,
  [Scale.Genus]: 60,
  [Scale.Species]: 52,
  [Scale.Organism]: 46,
  [Scale.OrganSystem]: 38,
  [Scale.Organ]: 30,
  [Scale.Tissue]: 24,
  [Scale.Cell]: 44,
  [Scale.Organelle]: 18,
  [Scale.ProteinComplex]: 24,
  [Scale.Molecule]: 15,
  [Scale.Atom]: 20,
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

  /** Continuous eased position along the ladder, for layer cross-fading. */
  get position(): number {
    return this.pos;
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
    this.pos += diff * Math.min(1, dt * 6);
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
