import React, { useRef, useEffect } from "react";
import { ZoomScale } from "../types";

interface ScaleItem {
  name: string;
  magnitude: string;
  scaleLevel: ZoomScale;
}

const SIDE_SCALES: ScaleItem[] = [
  { name: "HUMAN", magnitude: "~10⁰ m", scaleLevel: ZoomScale.HUMAN },
  { name: "ORGAN SYSTEM", magnitude: "~10⁻¹ m", scaleLevel: ZoomScale.ORGAN_SYSTEM },
  { name: "ORGAN", magnitude: "~10⁻² m", scaleLevel: ZoomScale.ORGAN },
  { name: "TISSUE", magnitude: "~10⁻³ m", scaleLevel: ZoomScale.TISSUE },
  { name: "CELL", magnitude: "~10⁻⁵ m", scaleLevel: ZoomScale.CELL },
  { name: "ORGANELLE", magnitude: "~10⁻⁶ m", scaleLevel: ZoomScale.ORGANELLE },
  { name: "PROTEIN COMPLEX", magnitude: "~10⁻⁹ m", scaleLevel: ZoomScale.PROTEIN_COMPLEX },
  { name: "MOLECULE", magnitude: "~10⁻¹⁰ m", scaleLevel: ZoomScale.MOLECULE },
  { name: "ATOM", magnitude: "~10⁻¹⁰ m", scaleLevel: ZoomScale.ATOM },
];

interface LeftSidebarProps {
  currentScale: ZoomScale;
  onScaleChange: (scale: ZoomScale) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ currentScale, onScaleChange }) => {
  const cellCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animate the gorgeous neural-soma cell inside the CELL OVERVIEW box
  useEffect(() => {
    const canvas = cellCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let frame = 0;

    const drawNeuralCell = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Deep celestial radial back-gradient for organic mood
      const backGlow = ctx.createRadialGradient(cx, cy, 2, cx, cy, 32);
      backGlow.addColorStop(0, "rgba(20, 30, 70, 0.4)");
      backGlow.addColorStop(0.5, "rgba(59, 130, 246, 0.1)");
      backGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = backGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, 32, 0, Math.PI * 2);
      ctx.fill();

      // Draw branching axonal star structure (Realistic scientific visual)
      ctx.strokeStyle = "rgba(129, 140, 248, 0.5)";
      ctx.lineWidth = 1;
      const branchCount = 10;
      for (let i = 0; i < branchCount; i++) {
        const baseAngle = (i * Math.PI * 2) / branchCount + Math.sin(frame * 0.005) * 0.1;
        
        ctx.beginPath();
        ctx.moveTo(cx, cy);

        // Intricate wave dendrites extending out
        let px = cx;
        let py = cy;
        const segmentCount = 4;
        const totalLength = 26 + Math.cos(frame * 0.02 + i) * 4;

        for (let j = 1; j <= segmentCount; j++) {
          const ratio = j / segmentCount;
          const currLen = totalLength * ratio;
          // Add organic wavelike wiggle
          const waveFactor = Math.sin(frame * 0.04 + j + i * 2) * 2;
          const nX = cx + Math.cos(baseAngle + waveFactor * 0.05) * currLen;
          const nY = cy + Math.sin(baseAngle + waveFactor * 0.05) * currLen;

          ctx.lineTo(nX, nY);
          px = nX;
          py = nY;
        }
        ctx.stroke();

        // Small synapses endpoints (firing stars)
        ctx.fillStyle = i % 3 === 0 ? "#67e8f9" : "#818cf8";
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw dense nucleolus center core
      const nucleolus = ctx.createRadialGradient(cx - 2, cy - 2, 1, cx, cy, 7);
      nucleolus.addColorStop(0, "#ffffff");
      nucleolus.addColorStop(0.3, "#3b82f6");
      nucleolus.addColorStop(1, "#030712");
      ctx.fillStyle = nucleolus;
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(drawNeuralCell);
    };

    drawNeuralCell();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <aside className="w-80 shrink-0 border-r border-white/[0.08] bg-[#03060f]/60 backdrop-blur-sm flex flex-col justify-between h-full p-6 text-slate-300 font-sans select-none overflow-y-auto custom-scrollbar">
      
      {/* 1. Scale Navigation Segment */}
      <div className="flex-1 flex flex-col min-h-0">
        <h2 className="text-[11px] font-sans font-bold tracking-[0.2em] text-slate-400 uppercase mb-4 text-left">
          SCALE NAVIGATION
        </h2>

        {/* List of 9 scales matching reference */}
        <div className="space-y-1 overflow-y-auto pr-1">
          {SIDE_SCALES.map((item) => {
            const isActive = currentScale === item.scaleLevel;
            return (
              <button
                key={item.name}
                id={`scale-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => onScaleChange(item.scaleLevel)}
                className={`w-full group flex items-center justify-between px-3.5 py-2.5 rounded border transition-all duration-200 text-left cursor-pointer ${
                  isActive
                    ? "bg-cyan-500/10 border-cyan-500/30 text-white shadow-[inset_0_0_12px_rgba(34,211,238,0.12)]"
                    : "border-transparent hover:bg-white/[0.02] text-slate-400 hover:text-slate-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center w-3 h-3">
                    <div
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        isActive
                          ? "bg-cyan-400 shadow-[0_0_10px_#22d3ee] scale-125"
                          : "bg-slate-700 group-hover:bg-slate-400"
                      }`}
                    />
                  </div>
                  <span className={`text-[10.5px] font-bold tracking-widest uppercase ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
                    {item.name}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-300 font-medium">
                  {item.magnitude}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Cell Overview Segment at Bottom */}
      <div className="pt-6 mt-6 border-t border-white/[0.08] space-y-4">
        <h2 className="text-[11px] font-sans font-bold tracking-[0.2em] text-slate-400 uppercase text-left">
          CELL OVERVIEW
        </h2>

        {/* Neuronal cell specs container */}
        <div className="flex items-center justify-between bg-[#070b16]/40 p-4 rounded-md border border-white/[0.05] relative overflow-hidden">
          <div className="space-y-3.5 text-left text-xs">
            <div>
              <span className="text-slate-500 text-[8px] font-mono block uppercase tracking-wider">Cell Type</span>
              <span className="text-white font-bold block mt-0.5">Neuronal Cell</span>
            </div>
            <div>
              <span className="text-slate-500 text-[8px] font-mono block uppercase tracking-wider">ID</span>
              <span className="text-slate-300 font-mono text-[10.5px] mt-0.5 block">NC_88492</span>
            </div>
            <div>
              <span className="text-slate-500 text-[8px] font-mono block uppercase tracking-wider">Diameter</span>
              <span className="text-slate-300 font-mono text-[10.5px] mt-0.5 block">~20 µm</span>
            </div>
          </div>

          {/* Glowing biological icon canvas */}
          <div className="relative w-20 h-20 bg-[#040815]/90 rounded-full border border-indigo-500/10 flex items-center justify-center p-1 shadow-[inset_0_0_12px_rgba(99,102,241,0.1)]">
            <canvas ref={cellCanvasRef} width={76} height={76} className="w-full h-full block filter brightness-110 drop-shadow-[0_0_6px_rgba(129,140,248,0.3)]" />
          </div>
        </div>

        {/* Health circular gauge / indicator bottom rows */}
        <div className="flex items-center gap-4 bg-[#070b16]/40 p-4 rounded-md border border-white/[0.05]">
          {/* Health circular SVG ring */}
          <div className="relative w-11 h-11 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="22" cy="22" r="18" fill="transparent" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="3" />
              <circle
                cx="22"
                cy="22"
                r="18"
                fill="transparent"
                stroke="#10b981"
                strokeWidth="3.5"
                strokeDasharray={2 * Math.PI * 18}
                strokeDashoffset={2 * Math.PI * 18 * (1 - 0.98)}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-[10.5px] font-mono font-bold text-emerald-400">98%</span>
          </div>

          <div className="text-left">
            <span className="text-[10px] text-slate-400 font-sans block">Health Index</span>
            <span className="text-[10.5px] font-mono font-bold text-emerald-400">98.4%</span>
            <div className="w-24 h-1 bg-slate-900 rounded-full mt-1.5 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: "98.4%" }} />
            </div>
          </div>
        </div>

      </div>
    </aside>
  );
};
