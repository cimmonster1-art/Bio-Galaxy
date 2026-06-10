// Pure layout helpers for the 2D cladogram. No React, no DOM: these functions
// turn the nested TaxonNode tree into flat arrays of positioned nodes and link
// segments, so the view component stays a thin renderer and the math stays
// unit-testable. Two layouts are supported: a tidy rectangular cladogram (x by
// depth, leaves evenly spaced, internal nodes centered on their children) and a
// radial projection of the same tidy coordinates.

import { TaxonNode } from '../../data/taxonomy';
import { TaxonRank } from '../../types';

export type CladogramMode = 'rectangular' | 'radial';

/** A taxon placed at a concrete (x, y) in layout space. */
export interface PositionedNode {
  id: string;
  name: string;
  common?: string;
  rank: TaxonRank;
  hue: number;
  ncbiTaxId?: number;
  /** Horizontal position in layout space (before any pan/zoom transform). */
  x: number;
  /** Vertical position in layout space. */
  y: number;
  /** 0 for the synthetic roots, growing by one per rank down the tree. */
  depth: number;
  /** True when the node has no children. */
  leaf: boolean;
}

/** A right-angled connector from a parent node to one child. */
export interface LinkSegment {
  parentId: string;
  childId: string;
  /** Parent anchor. */
  x1: number;
  y1: number;
  /** Child anchor. */
  x2: number;
  y2: number;
  /** Hue carried from the child clade for tinted strokes. */
  hue: number;
}

/** Everything the renderer needs for one layout pass. */
export interface CladogramLayout {
  mode: CladogramMode;
  nodes: PositionedNode[];
  links: LinkSegment[];
  /** Bounding box in layout space, useful for fit-to-view. */
  width: number;
  height: number;
  maxDepth: number;
}

export interface LayoutOptions {
  /** Horizontal gap between successive ranks in rectangular mode. */
  xGap?: number;
  /** Vertical gap between adjacent leaves in rectangular mode. */
  yGap?: number;
  /** Radial ring spacing per depth in radial mode. */
  ringGap?: number;
}

const DEFAULTS = {
  xGap: 220,
  yGap: 30,
  ringGap: 150,
};

// Internal mutable mirror of a TaxonNode used while we walk the tree. Keeping
// this separate from PositionedNode lets us assign tidy coordinates in two
// passes without mutating the source data.
interface WorkNode {
  src: TaxonNode;
  depth: number;
  children: WorkNode[];
  x: number;
  y: number;
}

function toWork(src: TaxonNode, depth: number): WorkNode {
  return {
    src,
    depth,
    children: src.children.map((c) => toWork(c, depth + 1)),
    x: 0,
    y: 0,
  };
}

/**
 * Assign tidy coordinates to a work tree. Leaves get sequential slots along the
 * y axis; internal nodes are centered on the midpoint of their children. The
 * `slot` counter is threaded through by reference via the returned next value.
 */
function assignTidy(node: WorkNode, xGap: number, yGap: number, nextSlot: number): number {
  node.x = node.depth * xGap;
  if (node.children.length === 0) {
    node.y = nextSlot * yGap;
    return nextSlot + 1;
  }
  let slot = nextSlot;
  for (const child of node.children) {
    slot = assignTidy(child, xGap, yGap, slot);
  }
  const first = node.children[0];
  const last = node.children[node.children.length - 1];
  node.y = (first.y + last.y) / 2;
  return slot;
}

function flattenWork(node: WorkNode, out: WorkNode[]): void {
  out.push(node);
  for (const child of node.children) flattenWork(child, out);
}

/**
 * Build a tidy rectangular layout from a forest of taxonomy roots. A single
 * synthetic spacing offset keeps the multiple domain roots from overlapping by
 * laying them out as if they shared one virtual parent.
 */
export function layoutRectangular(
  roots: TaxonNode[],
  opts: LayoutOptions = {},
): CladogramLayout {
  const xGap = opts.xGap ?? DEFAULTS.xGap;
  const yGap = opts.yGap ?? DEFAULTS.yGap;

  const work = roots.map((r) => toWork(r, 0));
  let slot = 0;
  for (const root of work) {
    slot = assignTidy(root, xGap, yGap, slot);
  }

  const flat: WorkNode[] = [];
  for (const root of work) flattenWork(root, flat);

  const nodes: PositionedNode[] = flat.map((w) => positioned(w));

  const links: LinkSegment[] = [];
  for (const w of flat) {
    for (const child of w.children) {
      links.push({
        parentId: w.src.id,
        childId: child.src.id,
        x1: w.x,
        y1: w.y,
        x2: child.x,
        y2: child.y,
        hue: child.src.hue,
      });
    }
  }

  let maxX = 0;
  let maxY = 0;
  let maxDepth = 0;
  for (const n of nodes) {
    if (n.x > maxX) maxX = n.x;
    if (n.y > maxY) maxY = n.y;
    if (n.depth > maxDepth) maxDepth = n.depth;
  }

  return { mode: 'rectangular', nodes, links, width: maxX, height: maxY, maxDepth };
}

/**
 * Project the same tidy coordinates onto concentric rings. Depth becomes the
 * radius and the tidy y slot becomes the angle, so the rectangular and radial
 * views share one combinatorial structure and feel like the same tree.
 */
export function layoutRadial(
  roots: TaxonNode[],
  opts: LayoutOptions = {},
): CladogramLayout {
  const yGap = opts.yGap ?? DEFAULTS.yGap;
  const ringGap = opts.ringGap ?? DEFAULTS.ringGap;

  // Reuse the tidy pass with a unit xGap so depth is a clean integer.
  const work = roots.map((r) => toWork(r, 0));
  let slot = 0;
  for (const root of work) {
    slot = assignTidy(root, 1, yGap, slot);
  }
  const totalSpan = Math.max(1, slot * yGap);

  const flat: WorkNode[] = [];
  for (const root of work) flattenWork(root, flat);

  // Map each work node's tidy y onto an angle around the full circle, and its
  // depth onto a radius. Center the diagram in a positive coordinate box.
  const maxDepth = flat.reduce((m, w) => Math.max(m, w.depth), 0);
  const maxRadius = (maxDepth + 1) * ringGap;
  const cx = maxRadius;
  const cy = maxRadius;

  const polar = new Map<WorkNode, { x: number; y: number }>();
  for (const w of flat) {
    const angle = (w.y / totalSpan) * Math.PI * 2 - Math.PI / 2;
    const radius = w.depth * ringGap;
    polar.set(w, {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    });
  }

  const nodes: PositionedNode[] = flat.map((w) => {
    const p = polar.get(w)!;
    return { ...positioned(w), x: p.x, y: p.y };
  });

  const links: LinkSegment[] = [];
  for (const w of flat) {
    const pp = polar.get(w)!;
    for (const child of w.children) {
      const cp = polar.get(child)!;
      links.push({
        parentId: w.src.id,
        childId: child.src.id,
        x1: pp.x,
        y1: pp.y,
        x2: cp.x,
        y2: cp.y,
        hue: child.src.hue,
      });
    }
  }

  return {
    mode: 'radial',
    nodes,
    links,
    width: maxRadius * 2,
    height: maxRadius * 2,
    maxDepth,
  };
}

function positioned(w: WorkNode): PositionedNode {
  return {
    id: w.src.id,
    name: w.src.name,
    common: w.src.common,
    rank: w.src.rank,
    hue: w.src.hue,
    ncbiTaxId: w.src.ncbiTaxId,
    x: w.x,
    y: w.y,
    depth: w.depth,
    leaf: w.children.length === 0,
  };
}

/** Convenience dispatcher used by the view. */
export function computeLayout(
  roots: TaxonNode[],
  mode: CladogramMode,
  opts: LayoutOptions = {},
): CladogramLayout {
  return mode === 'radial' ? layoutRadial(roots, opts) : layoutRectangular(roots, opts);
}
