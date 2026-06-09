import React, { useRef, useEffect, useState } from "react";
import { ZoomScale, BioEntity } from "../types";
import { BIOLOGICAL_ENTITIES } from "../biologicalData";
import { Play, Pause, Compass, Layers, Minimize2, Maximize2, Move } from "lucide-react";

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
  
  // Interactive navigation states
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Canvas context size
  const [size, setSize] = useState({ width: 800, height: 600 });

  // Floating micro-particles (cytoplasmic flow)
  const particlesRef = useRef<{ x: number; y: number; s: number; alpha: number; angle: number; r: number }[]>([]);

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
    const list = [];
    for (let i = 0; i < 40; i++) {
      list.push({
        x: (Math.random() - 0.5) * 400,
        y: (Math.random() - 0.5) * 400,
        s: 0.3 + Math.random() * 0.7,
        alpha: 0.15 + Math.random() * 0.45,
        angle: Math.random() * Math.PI * 2,
        r: 1 + Math.random() * 1.5,
      });
    }
    particlesRef.current = list;

    return () => observer.disconnect();
  }, []);

  // Hotspots definitions inside the CELL scale
  const hotspots = [
    { id: "nucleus", label: "NUCLEUS", role: "Genetic Control Center", source: "Source: UniProt", x: -20, y: -20, r: 65 },
    { id: "mitochondrion", label: "MITOCHONDRION", role: "ATP Production Generator", source: "Source: Reactome", x: 190, y: -130, r: 42 },
    { id: "golgi_apparatus", label: "GOLGI APPARATUS", role: "Secretory Protein Packer", source: "Source: UniProt", x: -160, y: 150, r: 45 },
    { id: "endoplasmic_reticulum", label: "ENDOPLASMIC RETICULUM", role: "Ribosome Translation", source: "Source: Reactome", x: -140, y: -110, r: 40 },
    { id: "cytoskeleton", label: "CYTOSKELETON", role: "Structural Scaffold Grid", source: "Source: UniProt", x: 180, y: 130, r: 35 },
  ];

  // Drag listeners
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === "Pan" || e.button === 1 || e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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
      if (dist < spot.r + 15) {
        clickedHotspotId = spot.id;
        break;
      }
    }

    if (clickedHotspotId) {
      onSelectEntity(BIOLOGICAL_ENTITIES[clickedHotspotId] || null);
    } else {
      // General environment hit
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
      
      // Clear with dark, space-inspired radial gradient
      const bgGrade = ctx.createRadialGradient(
        size.width / 2, size.height / 2, 5,
        size.width / 2, size.height / 2, Math.max(size.width, size.height) * 0.8
      );
      bgGrade.addColorStop(0, "#030816");
      bgGrade.addColorStop(0.5, "#020409");
      bgGrade.addColorStop(1, "#010204");
      ctx.fillStyle = bgGrade;
      ctx.fillRect(0, 0, size.width, size.height);

      // Draw faint, technical laboratory grids
      ctx.strokeStyle = "rgba(34, 211, 238, 0.015)";
      ctx.lineWidth = 1;
      const spacing = 40;
      const startX = pan.x % spacing;
      const startY = pan.y % spacing;
      
      for (let x = startX; x < size.width; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, size.height);
        ctx.stroke();
      }
      for (let y = startY; y < size.height; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(size.width, y);
        ctx.stroke();
      }

      // Save matrix context
      ctx.save();
      ctx.translate(size.width / 2 + pan.x, size.height / 2 + pan.y);
      ctx.scale(zoom, zoom);

      const dynamicTime = isPlaying ? frame * 0.015 : 0;

      // 1. CYTOSKELETON Network filaments (thin blue web lines across space)
      ctx.strokeStyle = "rgba(6, 182, 212, 0.12)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      hotspots.forEach((h1, i) => {
        hotspots.forEach((h2, j) => {
          if (i < j) {
            ctx.moveTo(h1.x, h1.y);
            // Draw a slightly curved line for biological filament feel
            const midX = (h1.x + h2.x) / 2 + Math.sin(dynamicTime + i) * 15;
            const midY = (h1.y + h2.y) / 2 + Math.cos(dynamicTime + j) * 15;
            ctx.quadraticCurveTo(midX, midY, h2.x, h2.y);
          }
        });
      });
      ctx.stroke();

      // Additional structural cytoskeletal nodes
      ctx.fillStyle = "rgba(6, 182, 212, 0.25)";
      hotspots.forEach((h, i) => {
        ctx.beginPath();
        ctx.arc(h.x + Math.sin(dynamicTime + i) * 8, h.y + Math.cos(dynamicTime * 0.8 + i) * 8, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. CELL MEMBRANE Outer lipid organic envelope boundary
      ctx.strokeStyle = "rgba(129, 140, 248, 0.25)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      const numPoints = 80;
      for (let i = 0; i <= numPoints; i++) {
        const phi = (Math.PI * 2 / numPoints) * i;
        // Waving fluid motion
        const amp = 8 * Math.cos(phi * 8 + dynamicTime * 1.5) + 4 * Math.sin(phi * 4 - dynamicTime);
        const radius = 290 + amp;
        const mx = Math.cos(phi) * radius;
        const my = Math.sin(phi) * radius;
        if (i === 0) ctx.moveTo(mx, my);
        else ctx.lineTo(mx, my);
      }
      ctx.closePath();
      ctx.stroke();

      // Floating cytoplasmic vesicles
      if (isPlaying) {
        particlesRef.current.forEach((p) => {
          p.angle += 0.005 * p.s;
          // Slowly orbit or flow
          const radialDist = 180 + p.s * 70;
          p.x = Math.cos(p.angle) * radialDist;
          p.y = Math.sin(p.angle) * radialDist;
        });
      }

      particlesRef.current.forEach((p) => {
        ctx.fillStyle = "rgba(14, 165, 233, " + p.alpha + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. ORGANELLES Renders:

      // (a) ENDOPLASMIC RETICULUM (Turquoise layered branching folds wrapped around nucleus)
      const erX = -130;
      const erY = -90;
      ctx.strokeStyle = "rgba(6, 182, 212, 0.4)";
      ctx.lineWidth = 2.5;
      ctx.save();
      ctx.translate(erX, erY);
      ctx.rotate(dynamicTime * 0.08);
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const rVal = 24 + k * 8;
        ctx.arc(0, 0, rVal, -Math.PI * 0.8, Math.PI * 1.1);
      }
      ctx.stroke();

      // Studying ribosome studs over the rough reticulum folds
      ctx.fillStyle = "#ffffff";
      for (let s = 0; s < 12; s++) {
        const ang = s * 0.6 + dynamicTime * 0.4;
        const rx = Math.cos(ang) * 48;
        const ry = Math.sin(ang) * 48;
        ctx.beginPath();
        ctx.arc(rx, ry, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // (b) GOLGI APPARATUS (Parallel glowing arcs of membranous crescent pools, magenta)
      const golgiX = -150;
      const golgiY = 130;
      ctx.strokeStyle = "rgba(236, 72, 153, 0.55)";
      ctx.lineWidth = 3.2;
      ctx.save();
      ctx.translate(golgiX, golgiY);
      ctx.rotate(-Math.PI / 6 + dynamicTime * 0.04);
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        const baseArc = 20 + i * 5.5;
        // Crest curved crescent look
        ctx.arc(0, -i * 2.5, baseArc, -Math.PI / 1.3, -Math.PI / 3.5);
        ctx.stroke();
      }
      ctx.restore();

      // (c) MITOCHONDRIA COMPLEX (Golden capsules showing internal cristae folded slices)
      const mitochondria = [
        { mx: 180, my: -110, size: 28, rot: Math.PI / 4, bounce: 0 },
        { mx: 110, my: -180, size: 22, rot: -Math.PI / 10, bounce: 1.5 },
      ];

      mitochondria.forEach((mit, idx) => {
        ctx.save();
        ctx.translate(mit.mx, mit.my + Math.sin(dynamicTime + idx * 2) * 5);
        ctx.rotate(mit.rot + dynamicTime * 0.05);

        // Core 3D capsule shading
        const scaleOval = mit.size;
        const elGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, scaleOval * 1.5);
        elGrad.addColorStop(0, "#fef08a"); // golden highlight
        elGrad.addColorStop(0.3, "#eab308"); // yellow body
        elGrad.addColorStop(0.75, "#854d0e"); // dark gold boundary
        elGrad.addColorStop(1, "#1c0d02");

        ctx.fillStyle = elGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, scaleOval * 1.6, scaleOval, 0, 0, Math.PI * 2);
        ctx.fill();

        // Membrane thin gold outline
        ctx.strokeStyle = "rgba(234, 179, 8, 0.45)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // 3D Inner Cristae membrane lines
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-scaleOval * 1.2, 0);
        ctx.lineTo(-scaleOval * 0.8, -scaleOval * 0.4);
        ctx.lineTo(-scaleOval * 0.4, scaleOval * 0.4);
        ctx.lineTo(0, -scaleOval * 0.4);
        ctx.lineTo(scaleOval * 0.4, scaleOval * 0.4);
        ctx.lineTo(scaleOval * 0.8, -scaleOval * 0.4);
        ctx.lineTo(scaleOval * 1.2, 0);
        ctx.stroke();

        ctx.restore();
      });

      // (d) NUCLEUS STAR (Centering chromatines strands)
      const isNucleusHovered = selectedEntity?.id === "nucleus";
      const radNuc = 58 + (isNucleusHovered ? 6 : 0);
      
      const nGrad = ctx.createRadialGradient(-4, -4, 5, 0, 0, radNuc);
      nGrad.addColorStop(0, "#fdf4ff"); // bright core
      nGrad.addColorStop(0.15, "#e879f9"); // light magenta
      nGrad.addColorStop(0.5, "#a21caf"); // deep purple chromatin
      nGrad.addColorStop(0.85, "#4a044e"); // indigo border
      nGrad.addColorStop(1, "#020108");

      ctx.save();
      ctx.translate(0, 0);
      
      // Dynamic pulsing glow
      ctx.shadowColor = "#d946ef";
      ctx.shadowBlur = isNucleusHovered ? 40 : 18;
      ctx.fillStyle = nGrad;
      ctx.beginPath();
      ctx.arc(0, 0, radNuc, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw elegant concentric genetic chromatin filament rings inside nucleus
      ctx.strokeStyle = "rgba(255,150,255,0.22)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (let helixIdx = 0; helixIdx < 4; helixIdx++) {
        const radiusHelix = 16 + helixIdx * 9;
        ctx.arc(0, 0, radiusHelix, 0, Math.PI * 2);
      }
      ctx.stroke();

      // Superfine chromatin lines looping in transcription folds
      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let ang = 0; ang < Math.PI * 2; ang += 0.3) {
        const r1 = 12 + Math.sin(ang * 4 + dynamicTime * 1.5) * 6;
        const r2 = 38 + Math.cos(ang * 3 - dynamicTime * 1.2) * 4;
        ctx.moveTo(Math.cos(ang) * r1, Math.sin(ang) * r1);
        ctx.lineTo(Math.cos(ang) * r2, Math.sin(ang) * r2);
      }
      ctx.stroke();

      // Innermost high-intensity dark Nucleolus Core
      const innerCore = ctx.createRadialGradient(-1, -1, 0, 0, 0, 14);
      innerCore.addColorStop(0, "white");
      innerCore.addColorStop(0.4, "#701a75");
      innerCore.addColorStop(1, "#2e022e");
      ctx.fillStyle = innerCore;
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();

      // Double Nuclear membrane selectively let entities inside
      ctx.strokeStyle = "rgba(232, 121, 249, 0.4)";
      ctx.lineWidth = 1.75;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, radNuc + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // 4. Pointer Labels overlays (NASA precision graphics)
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

        // Pointer Line drawing to dynamic placard
        const labelX = h.x > 0 ? 55 : -140;
        const labelY = h.y > 0 ? 40 : -45;

        ctx.strokeStyle = isSelected ? "rgba(34, 211, 238, 0.75)" : "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        // diagonal connector line
        ctx.lineTo(labelX * 0.4, labelY);
        // horizontal platform line
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

        // Texts within placard
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

      ctx.restore(); // restore translated matrices

      animId = requestAnimationFrame(renderFrame);
    };

    renderFrame();
    return () => cancelAnimationFrame(animId);
  }, [size, zoom, pan, selectedEntity, isPlaying]);

  return (
    <div className="flex-1 min-w-0 bg-[#02050c] flex flex-col relative" ref={containerRef}>
      
      {/* Play/Pause control state on top left corner */}
      <div className="absolute top-6 left-6 z-30 flex items-center gap-2">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-[#030712]/80 border border-white/10 hover:border-cyan-400 text-white rounded text-[10px] font-mono font-bold tracking-widest uppercase cursor-pointer"
        >
          {isPlaying ? (
            <>
              <Pause className="w-3 h-3 text-cyan-400" />
              <span>PAUSE SIM</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3 text-emerald-400" />
              <span>RESUME SIM</span>
            </>
          )}
        </button>

        <button
          onClick={() => {
            setZoom(1.0);
            setPan({ x: 0, y: 0 });
          }}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#030712]/80 border border-white/10 hover:border-cyan-400 text-white rounded text-[10px] font-mono font-bold tracking-widest uppercase cursor-pointer"
          title="Reset Pan and Zoom Viewport"
        >
          <Compass className="w-3 h-3 text-cyan-400" />
          <span>RECENTER</span>
        </button>
      </div>

      {/* Main visual canvas container */}
      <canvas
        ref={canvasRef}
        width={size.width}
        height={size.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
        className={`w-full h-full block touch-none cursor-grab active:cursor-grabbing`}
      />

      {/* Central Viewport Controls Dock (Aesthetic, non-cluttered scientific controls bar) */}
      <div className="absolute bottom-6 left-6 right-6 z-30 flex items-center justify-between bg-[#040815]/90 border border-white/10 px-5 py-2.5 rounded-lg select-none backdrop-blur-sm shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
        {/* Left Side: Actions */}
        <div className="flex items-center gap-1">
          {["Select", "Orbit", "Pan", "Zoom", "Focus", "Measure", "Layers"].map((tool) => {
            const isActive = activeTool === tool;
            return (
              <button
                key={tool}
                onClick={() => {
                  setActiveTool(tool);
                  if (tool === "Zoom") {
                    setZoom((z) => Math.min(2.5, z + 0.2));
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

        {/* Right Side: Dimension controllers */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIs3D(true)}
            className={`text-[9.5px] font-mono font-bold px-3 py-1.5 rounded transition uppercase tracking-widest border cursor-pointer ${
              is3D
                ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                : "text-slate-500 border-transparent hover:text-white"
            }`}
          >
            3D RENDER
          </button>
          <button
            onClick={() => setIs3D(false)}
            className={`text-[9.5px] font-mono font-bold px-3 py-1.5 rounded transition uppercase tracking-widest border cursor-pointer ${
              !is3D
                ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                : "text-slate-500 border-transparent hover:text-white"
            }`}
          >
            2D FLAT
          </button>
        </div>
      </div>

    </div>
  );
};
