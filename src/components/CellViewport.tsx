import React, { useRef, useEffect, useState } from "react";
import { ZoomScale, BioEntity } from "../types";
import { BIOLOGICAL_ENTITIES } from "../biologicalData";
import { Play as PlayIcon, Pause as PauseIcon, Compass as CompassIcon } from "lucide-react";
import { 
  drawGrid,
  drawCytoskeletonFilaments,
  drawCellMembrane,
  drawER,
  drawGolgi,
  drawMitochondria,
  drawNucleus,
  drawLysosome,
  drawPeroxisome,
  drawRibosomesCluster,
  drawCentrosome,
  Particle,
  Hotspot
} from "../utils/cellRenderer";

interface CellViewportProps {
  currentScale: ZoomScale;
  onScaleChange: (scale: ZoomScale) => void;
  selectedEntity: BioEntity | null;
  onSelectEntity: (entity: BioEntity | null) => void;
}

export const CellViewport: React.FC<CellViewportProps> = ({
  currentScale,
  onScaleChange,
  selectedEntity,
  onSelectEntity,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [is3D, setIs3D] = useState(true);
  const [activeTool, setActiveTool] = useState<string>("Select");
  
  // Interactive viewport navigation states
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Canvas dimensions
  const [size, setSize] = useState({ width: 800, height: 600 });

  // Floating cytoplasmic vesicles (cytoplasm system context waves)
  const particlesRef = useRef<Particle[]>([]);

  // Monitor resize of container
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ width: width || 800, height: height || 600 });
      }
    });
    observer.observe(containerRef.current);

    // Initial feed particles
    const list: Particle[] = [];
    for (let i = 0; i < 45; i++) {
      list.push({
        x: (Math.random() - 0.5) * 450,
        y: (Math.random() - 0.5) * 450,
        s: 0.3 + Math.random() * 0.7,
        alpha: 0.15 + Math.random() * 0.45,
        angle: Math.random() * Math.PI * 2,
        r: 1.2 + Math.random() * 1.8,
      });
    }
    particlesRef.current = list;

    return () => observer.disconnect();
  }, []);

  // 9 Hotspots definitions inside the active observatories cell viewport
  const hotspots: Hotspot[] = [
    { id: "nucleus", label: "NUCLEUS", role: "Genetic Control Center", source: "Source: UniProt", x: -20, y: -20, r: 60 },
    { id: "mitochondrion", label: "MITOCHONDRION", role: "ATP Power Plant", source: "Source: Reactome", x: 190, y: -130, r: 40 },
    { id: "golgi_apparatus", label: "GOLGI APPARATUS", role: "Secretory Protein Packer", source: "Source: UniProt", x: -160, y: 150, r: 42 },
    { id: "endoplasmic_reticulum", label: "ENDOPLASMIC RETICULUM", role: "Ribosome Translation", source: "Source: Reactome", x: -140, y: -110, r: 38 },
    { id: "cytoskeleton", label: "CYTOSKELETON", role: "Structural Scaffold Grid", source: "Source: UniProt", x: 170, y: 130, r: 30 },
    { id: "lysosome", label: "LYSOSOME", role: "Acidic Scrap Digest", source: "Source: UniProt", x: 50, y: 190, r: 24 },
    { id: "peroxisome", label: "PEROXISOME", role: "Detoxification Center", source: "Source: Reactome", x: 230, y: 30, r: 22 },
    { id: "ribosome", label: "RIBOSOMES CLUSTER", role: "Peptide Synthesizer", source: "Source: UniProt", x: -245, y: 12, r: 20 },
    { id: "centrosome", label: "CENTROSOME HUB", role: "Microtubule Center", source: "Source: UniProt", x: 95, y: 110, r: 24 },
  ];

  // Drag listeners
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === "Pan" || e.button === 1 || e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Map screen clicks into zoomed/panned coordinate space
    const originX = size.width / 2 + pan.x;
    const originY = size.height / 2 + pan.y;
    const relativeX = (clickX - originX) / zoom;
    const relativeY = (clickY - originY) / zoom;

    // Check hit hotspots
    let clickedHotspotId: string | null = null;
    for (const spot of hotspots) {
      const dist = Math.sqrt((relativeX - spot.x) ** 2 + (relativeY - spot.y) ** 2);
      if (dist < spot.r + 14) {
        clickedHotspotId = spot.id;
        break;
      }
    }

    if (clickedHotspotId) {
      onSelectEntity(BIOLOGICAL_ENTITIES[clickedHotspotId] || null);
    } else {
      onSelectEntity(null);
    }
  };

  // Canvas drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let frame = 0;

    const renderFrame = () => {
      frame++;
      
      // 1. Grid Background
      drawGrid(ctx, size.width, size.height, pan.x, pan.y);

      // Save matrix context for viewport controls
      ctx.save();
      ctx.translate(size.width / 2 + pan.x, size.height / 2 + pan.y);
      ctx.scale(zoom, zoom);

      const dynamicTime = isPlaying ? frame * 0.015 : 0;

      // 2. Cytoskeleton Filaments Grid network
      drawCytoskeletonFilaments(ctx, hotspots, dynamicTime);

      // 3. Waving Cellular Lipid Membrane Boundary
      drawCellMembrane(ctx, dynamicTime);

      // 4. Cytoplasmic flowing vesicles particles
      if (isPlaying) {
        particlesRef.current.forEach((p) => {
          p.angle += 0.005 * p.s;
          const radialDist = 180 + p.s * 75;
          p.x = Math.cos(p.angle) * radialDist;
          p.y = Math.sin(p.angle) * radialDist;
        });
      }

      particlesRef.current.forEach((p) => {
        ctx.fillStyle = `rgba(14, 165, 233, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // 5. Draw Organelles (Traditional + New additions)
      
      // (a) Endoplasmic Reticulum folds studded with Ribosomes
      drawER(ctx, -130, -90, dynamicTime);

      // (b) Golgi Apparatus Glands Sorting
      drawGolgi(ctx, -150, 130, dynamicTime);

      // (c) Mitochondria Energy Generators (Double representation)
      drawMitochondria(ctx, 180, -110, 28, Math.PI / 4, 0, dynamicTime);
      drawMitochondria(ctx, 110, -180, 22, -Math.PI / 10, 1, dynamicTime);

      // (d) central Nucleus Genome repository
      const isNucleusHovered = selectedEntity?.id === "nucleus";
      const radNuc = 58 + (isNucleusHovered ? 6 : 0);
      drawNucleus(ctx, isNucleusHovered, dynamicTime, radNuc);

      // (e) Lysosome Garbage Disposal Spheres
      drawLysosome(ctx, 50, 190, dynamicTime);

      // (f) Peroxisome Crystalline Detoxification Core
      drawPeroxisome(ctx, 230, 30, dynamicTime);

      // (g) Ribosomes free cytoplasm clusters translation
      drawRibosomesCluster(ctx, -245, 12, dynamicTime);

      // (h) Centrosome mitotic hubs tubule launcher
      drawCentrosome(ctx, 95, 110, dynamicTime);

      // 6. Interactive Placards & NASA Overlays
      hotspots.forEach((h) => {
        const isSelected = selectedEntity?.id === h.id;
        
        ctx.save();
        ctx.translate(h.x, h.y);

        // Spot pulse ring
        ctx.strokeStyle = isSelected ? "#22d3ee" : "rgba(34, 211, 238, 0.4)";
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.beginPath();
        ctx.arc(0, 0, isSelected ? 12 : 8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = isSelected ? "#22d3ee" : "#0ea5e9";
        ctx.beginPath();
        ctx.arc(0, 0, isSelected ? 5.5 : 3, 0, Math.PI * 2);
        ctx.fill();

        // Pointer Line drawing to dynamic overlay board
        const labelX = h.x > 0 ? 55 : -140;
        const labelY = h.y > 0 ? 40 : -45;

        ctx.strokeStyle = isSelected ? "rgba(34, 211, 238, 0.75)" : "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(labelX * 0.4, labelY);
        ctx.lineTo(labelX, labelY);
        ctx.stroke();

        // Text Placard Frame background
        ctx.fillStyle = isSelected ? "rgba(9, 21, 46, 0.9)" : "rgba(2, 4, 10, 0.7)";
        ctx.strokeStyle = isSelected ? "#22d3ee" : "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = 1;
        
        const boxW = 125;
        const boxH = 34;
        const boxX = labelX + (h.x > 0 ? 0 : -boxW);
        const boxY = labelY - boxH / 2;

        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // Write detail elements within overlay box
        ctx.fillStyle = isSelected ? "#ffffff" : "#cbd5e1";
        ctx.font = "bold 8.5px sans-serif";
        ctx.fillText(h.label, boxX + 8, boxY + 12);

        ctx.fillStyle = "#94a3b8";
        ctx.font = "7.5px sans-serif";
        ctx.fillText(h.role, boxX + 8, boxY + 21);

        ctx.fillStyle = isSelected ? "#22d3ee" : "#64748b";
        ctx.font = "italic 7px monospace";
        ctx.fillText(h.source, boxX + 8, boxY + 30);

        ctx.restore();
      });

      ctx.restore(); // restore translated state matrices
      animId = requestAnimationFrame(renderFrame);
    };

    renderFrame();
    return () => cancelAnimationFrame(animId);
  }, [size, zoom, pan, selectedEntity, isPlaying]);

  return (
    <div className="flex-1 min-w-0 bg-[#02050c] flex flex-col relative border-r border-white/[0.05]" ref={containerRef}>
      
      {/* Simulation action triggers */}
      <div className="absolute top-6 left-6 z-30 flex items-center gap-2">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-[#030712]/80 border border-white/10 hover:border-cyan-400 text-white rounded text-[10px] font-mono font-bold tracking-widest uppercase cursor-pointer"
        >
          {isPlaying ? (
            <>
              <PauseIcon className="w-3 h-3 text-cyan-400" />
              <span>PAUSE SIMULATION</span>
            </>
          ) : (
            <>
              <PlayIcon className="w-3 h-3 text-emerald-400" />
              <span>RESUME SIMULATION</span>
            </>
          )}
        </button>

        <button
          onClick={() => {
            setZoom(1.0);
            setPan({ x: 0, y: 0 });
          }}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#030712]/80 border border-white/10 hover:border-cyan-400 text-white rounded text-[10px] font-mono font-bold tracking-widest uppercase cursor-pointer"
          title="Recenter and calibrate cellular viewport"
        >
          <CompassIcon className="w-3 h-3 text-cyan-400" />
          <span>RECENTER Scale</span>
        </button>
      </div>

      {/* Primary HTML canvas */}
      <canvas
        ref={canvasRef}
        width={size.width}
        height={size.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
        className="w-full h-full block touch-none cursor-grab active:cursor-grabbing"
      />

      {/* Scientific controls dock */}
      <div className="absolute bottom-6 left-6 right-6 z-30 flex items-center justify-between bg-[#040815]/90 border border-white/10 px-5 py-2.5 rounded-lg select-none backdrop-blur-sm shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-1">
          {["Select", "Orbit", "Pan", "Zoom", "Focus", "Layers"].map((tool) => {
            const isActive = activeTool === tool;
            return (
              <button
                key={tool}
                onClick={() => {
                  setActiveTool(tool);
                  if (tool === "Zoom") {
                    setZoom((z) => Math.min(2.5, z + 0.23));
                  }
                }}
                className={`text-[9.5px] font-mono font-bold uppercase tracking-wider px-3.5 py-1.5 rounded transition ${
                  isActive
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                    : "text-slate-400 hover:text-white border border-transparent hover:bg-white/[0.02]"
                } cursor-pointer`}
              >
                {tool}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIs3D(true)}
            className={`text-[9.5px]/none font-mono font-bold px-3 py-1.5 rounded transition uppercase tracking-widest border cursor-pointer ${
              is3D
                ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                : "text-slate-550 border-transparent hover:text-white"
            }`}
          >
            3D OBSERVATORY
          </button>
          <button
            onClick={() => setIs3D(false)}
            className={`text-[9.5px]/none font-mono font-bold px-3 py-1.5 rounded transition uppercase tracking-widest border cursor-pointer ${
              !is3D
                ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                : "text-slate-550 border-transparent hover:text-white"
            }`}
          >
            2D OBSERVATORY
          </button>
        </div>
      </div>

    </div>
  );
};
