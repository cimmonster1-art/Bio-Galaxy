import React, { useEffect, useRef } from 'react';
import { Scale, PickTag } from '../types';
import { BioGalaxyScene } from '../three/BioGalaxyScene';

interface Props {
  scale: Scale;
  selectedId: string | null;
  onHover: (tag: PickTag | null) => void;
  onSelect: (tag: PickTag | null) => void;
  onScaleSettled: (scale: Scale) => void;
}

/**
 * React host for the Three.js atlas. Owns the imperative scene through a ref and
 * keeps it in sync with declarative props. All scene teardown happens on
 * unmount so navigating away from the atlas frees GPU resources.
 */
export const BioGalaxyCanvas: React.FC<Props> = ({
  scale,
  selectedId,
  onHover,
  onSelect,
  onScaleSettled,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<BioGalaxyScene | null>(null);

  // Keep the latest callbacks without re-creating the scene.
  const cbRef = useRef({ onHover, onSelect, onScaleSettled });
  cbRef.current = { onHover, onSelect, onScaleSettled };

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

  return <div ref={containerRef} className="absolute inset-0" />;
};
