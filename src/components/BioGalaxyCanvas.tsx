import React, { useEffect, useRef } from 'react';
import { Scale, PickTag } from '../types';
import { BioGalaxyScene } from '../three/BioGalaxyScene';

export interface StructurePayload {
  atoms: { element: string; x: number; y: number; z: number }[];
  pickId: string;
}

export interface OrganismModelRequest {
  url: string;
  label: string;
  sourceUrl?: string;
}

interface Props {
  scale: Scale;
  selectedId: string | null;
  /** Taxon id (with `taxon:` prefix) to focus in the Tree of Life. */
  focusTaxonId?: string | null;
  /** Parsed PDB coordinates to render at the molecular scale. */
  structure?: StructurePayload | null;
  /** Open organism model to load at the anatomy scale. */
  organismModel?: OrganismModelRequest | null;
  /** Drives the live scene while the history cutscene is open. */
  cinematicProgress?: number | null;
  onHover: (tag: PickTag | null) => void;
  onSelect: (tag: PickTag | null) => void;
  onScaleSettled: (scale: Scale) => void;
  /** Reports whether an organism model loaded or fell back to procedural. */
  onModelResult?: (ok: boolean) => void;
}

/**
 * React host for the Three.js atlas. Owns the imperative scene through a ref and
 * keeps it in sync with declarative props. All scene teardown happens on
 * unmount so navigating away from the atlas frees GPU resources.
 */
export const BioGalaxyCanvas: React.FC<Props> = ({
  scale,
  selectedId,
  focusTaxonId = null,
  structure = null,
  organismModel = null,
  cinematicProgress = null,
  onHover,
  onSelect,
  onScaleSettled,
  onModelResult,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<BioGalaxyScene | null>(null);

  // Keep the latest callbacks without re-creating the scene.
  const cbRef = useRef({ onHover, onSelect, onScaleSettled, onModelResult });
  cbRef.current = { onHover, onSelect, onScaleSettled, onModelResult };

  useEffect(() => {
    if (!containerRef.current) return;
    const scene = new BioGalaxyScene(containerRef.current, scale, {
      onHover: (t) => cbRef.current.onHover(t),
      onSelect: (t) => cbRef.current.onSelect(t),
      onScaleSettled: (s) => cbRef.current.onScaleSettled(s),
    });
    sceneRef.current = scene;
    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
    // Scene is created once; prop changes are pushed imperatively below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    sceneRef.current?.setScale(scale);
  }, [scale]);

  useEffect(() => {
    sceneRef.current?.setSelected(selectedId);
  }, [selectedId]);

  useEffect(() => {
    sceneRef.current?.setCinematicProgress(cinematicProgress);
  }, [cinematicProgress]);

  useEffect(() => {
    sceneRef.current?.setFocusTaxon(focusTaxonId);
  }, [focusTaxonId]);

  useEffect(() => {
    if (structure) sceneRef.current?.setStructure(structure.atoms, structure.pickId);
  }, [structure]);

  useEffect(() => {
    if (!organismModel) return;
    let active = true;
    sceneRef.current
      ?.loadOrganismModel(organismModel.url, {
        label: organismModel.label,
        url: organismModel.sourceUrl,
        external: false,
      })
      .then((ok) => {
        if (active) cbRef.current.onModelResult?.(ok);
      });
    return () => {
      active = false;
    };
  }, [organismModel]);

  return <div ref={containerRef} className="absolute inset-0" />;
};
