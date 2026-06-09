import React, { useRef, useEffect } from "react";
import { BioEntity } from "../types";

interface RightSidebarProps {
  entity: BioEntity | null;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ entity }) => {
  // Use "nucleus" if nothing is chosen, to keep the sidebar fully populated and gorgeous as in mockup
  const defaultEntity: BioEntity = {
    id: "mitochondrion",
    name: "Mitochondrion",
    category: "organelle",
    description: "Primary double-membrane intracellular engine converting metabolic nutrient inputs into physical adenosine triphosphate (ATP) molecules through the mitochondrial respiratory transport chain.",
    metricSize: "2 µm",
    facts: [
      "Triggers respiratory metabolic chain and manages core energy yield.",
      "Releases Cytochrome c which acts as the localized cellular apoptotic signal.",
      "Concentrated in high abundance at critical axonal synaptic clefts."
    ],
    source: "Reactome"
  };

  const activeEntity = entity || defaultEntity;
  const MicrographCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Micro-sparkline generator for bio metrics
  const sparklineRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

  // Animate the gorgeous HD Micrograph inside the right sidebar
  useEffect(() => {
    const canvas = MicrographCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let frame = 0;

    const drawMicrograph = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Dark sci-tech blue grid background inside the micrograph frame
      ctx.fillStyle = "#020409";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "rgba(34, 211, 238, 0.03)";
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 15) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 15) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      // Dynamic animated elements depending on selected entity
      const lowerId = activeEntity.id.toLowerCase();
      
      if (lowerId.includes("mitochondrion") || lowerId.includes("mitochon")) {
        // Draw stunning gold sliced mitochondrion with internal cristae folds
        const rVal = 38;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-Math.PI / 8 + Math.sin(frame * 0.01) * 0.15);

        // Gradient outer capsule
        const outerGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, rVal);
        outerGrad.addColorStop(0, "#fef08a");
        outerGrad.addColorStop(0.3, "#eab308");
        outerGrad.addColorStop(0.8, "#854d0e");
        outerGrad.addColorStop(1, "#1c0d02");

        ctx.fillStyle = outerGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, rVal * 1.5, rVal, 0, 0, Math.PI * 2);
        ctx.fill();

        // Internals: outer boundary line
        ctx.strokeStyle = "rgba(254, 240, 138, 0.5)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Cristae wireframe particle loops (red/crimson detailed folds)
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-rVal * 1.25, 0);
        ctx.bezierCurveTo(-rVal * 0.9, -rVal * 0.7, -rVal * 0.75, rVal * 0.7, -rVal * 0.5, 0);
        ctx.bezierCurveTo(-rVal * 0.25, -rVal * 0.7, -rVal * 0.1, rVal * 0.7, 0, 0);
        ctx.bezierCurveTo(rVal * 0.25, -rVal * 0.7, rVal * 0.4, rVal * 0.7, rVal * 0.6, 0);
        ctx.bezierCurveTo(rVal * 0.85, -rVal * 0.7, rVal * 1.1, rVal * 0.7, rVal * 1.25, 0);
        ctx.stroke();

        ctx.restore();
      } 
      else if (lowerId.includes("nucleus")) {
        // Draw beautiful purple/magenta sphere with dynamic transcription loops
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(frame * 0.007);

        // Core 3D styling
        const rVal = 36;
        const nGrad = ctx.createRadialGradient(-4, -4, 2, 0, 0, rVal);
        nGrad.addColorStop(0, "#fdf4ff");
        nGrad.addColorStop(0.3, "#d946ef");
        nGrad.addColorStop(0.8, "#701a75");
        nGrad.addColorStop(1, "#1e0121");

        ctx.fillStyle = nGrad;
        ctx.beginPath();
        ctx.arc(0, 0, rVal, 0, Math.PI * 2);
        ctx.fill();

        // outer shell line
        ctx.strokeStyle = "rgba(240, 171, 252, 0.4)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // chromatin threads
        ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        for (let l = 0; l < 3; l++) {
          ctx.arc(0, 0, 12 + l * 8, 0, Math.PI * 1.6);
        }
        ctx.stroke();
        ctx.restore();
      } 
      else if (lowerId.includes("golgi")) {
        // Stacked parallel cisternae plates
        ctx.save();
        ctx.translate(cx - 5, cy);
        ctx.strokeStyle = "#ec4899";
        ctx.lineWidth = 3.5;
        for (let i = 0; i < 6; i++) {
          ctx.beginPath();
          ctx.arc(10, -12 + i * 5, 24 - i * 3, -Math.PI / 1.4, -Math.PI / 3.2);
          ctx.stroke();
        }
        ctx.restore();
      }
      else {
        // DNA or macromolecular cluster
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(frame * 0.015);
        ctx.strokeStyle = "rgba(34, 211, 238, 0.45)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        // helix wave
        for (let xNum = -45; xNum <= 45; xNum += 3) {
          const yNum = Math.sin(xNum * 0.1 + frame * 0.05) * 18;
          ctx.lineTo(xNum, yNum);
          ctx.arc(xNum, yNum, 1.5, 0, Math.PI * 2);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Specular sheen overlay across micrograph canvas (glass reflections)
      const sheen = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      sheen.addColorStop(0, "rgba(255, 255, 255, 0.015)");
      sheen.addColorStop(0.5, "rgba(255, 255, 255, 0)");
      sheen.addColorStop(1, "rgba(0, 0, 0, 0.4)");
      ctx.fillStyle = sheen;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Fine diagnostic telemetry lines around corner bounds
      ctx.strokeStyle = "rgba(34, 211, 238, 0.25)";
      ctx.lineWidth = 1;
      // top-left
      ctx.beginPath(); ctx.moveTo(6, 14); ctx.lineTo(6, 6); ctx.lineTo(14, 6); ctx.stroke();
      // top-right
      ctx.beginPath(); ctx.moveTo(canvas.width - 6, 14); ctx.lineTo(canvas.width - 6, 6); ctx.lineTo(canvas.width - 14, 6); ctx.stroke();
      // bottom-left
      ctx.beginPath(); ctx.moveTo(6, canvas.height - 14); ctx.lineTo(6, canvas.height - 6); ctx.lineTo(14, canvas.height - 6); ctx.stroke();
      // bottom-right
      ctx.beginPath(); ctx.moveTo(canvas.width - 6, canvas.height - 14); ctx.lineTo(canvas.width - 6, canvas.height - 6); ctx.lineTo(canvas.width - 14, canvas.height - 6); ctx.stroke();

      animId = requestAnimationFrame(drawMicrograph);
    };

    drawMicrograph();
    return () => cancelAnimationFrame(animId);
  }, [activeEntity]);

  // Handle sparking mini metrics charts
  useEffect(() => {
    const list: { id: string; color: string }[] = [
      { id: "atp", color: "#10b981" },
      { id: "volt", color: "#a855f7" },
      { id: "oxy", color: "#3b82f6" },
      { id: "cal", color: "#f97316" },
      { id: "prot", color: "#10b981" },
    ];

    const intervals: number[] = [];

    list.forEach((m) => {
      const canvas = sparklineRefs.current[m.id];
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const pts: number[] = Array.from({ length: 22 }, () => 10 + Math.random() * 20);

      const drawSpark = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // draw background line
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();

        // draw sparkline
        ctx.strokeStyle = m.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        pts.forEach((p, idx) => {
          const x = (canvas.width / (pts.length - 1)) * idx;
          const y = canvas.height - p;
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Shift points for continuous motion
        pts.shift();
        pts.push(10 + Math.random() * 20);
      };

      const hInterval = window.setInterval(drawSpark, 140);
      intervals.push(hInterval);
    });

    return () => {
      intervals.forEach((i) => clearInterval(i));
    };
  }, [activeEntity]);

  return (
    <aside className="w-80 shrink-0 border-l border-white/[0.08] bg-[#03060f]/60 backdrop-blur-sm flex flex-col h-full p-6 text-slate-300 font-sans select-none overflow-y-auto custom-scrollbar">
      
      {/* Active Organelle Title Label */}
      <div className="text-left border-b border-white/[0.08] pb-4.5 mb-5 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-cyan-400 border border-cyan-500/25 px-2 py-0.5 rounded bg-cyan-950/20">
            {activeEntity.category.replace("_", " ")}
          </span>
          <span className="text-[10.5px] font-mono text-slate-500">
            d = ~{activeEntity.metricSize}
          </span>
        </div>
        <h2 className="text-lg font-bold tracking-wide text-white mt-2 uppercase">
          {activeEntity.name}
        </h2>
      </div>

      {/* 3D Micrograph Render Window */}
      <div className="relative border border-white/[0.08] rounded-md overflow-hidden bg-[#020409]/90 shrink-0 mb-5 shadow-inner">
        <canvas
          ref={MicrographCanvasRef}
          width={272}
          height={136}
          className="w-full h-[136px] block"
        />
        <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 border border-white/5 text-[7px] font-mono text-slate-500 uppercase tracking-widest leading-none">
          HD Microscopic Slices
        </div>
      </div>

      {/* Primary Description Overview */}
      <div className="text-left mb-6 shrink-0">
        <h3 className="text-[9.5px] font-mono text-slate-500 tracking-[0.2em] uppercase mb-1.5 font-bold">
          OVERVIEW
        </h3>
        <p className="text-[11.5px] leading-relaxed text-slate-400 font-sans font-medium">
          {activeEntity.description}
        </p>
      </div>

      {/* Verified Database Providers provenance */}
      <div className="text-left mb-6 shrink-0">
        <h3 className="text-[9.5px] font-mono text-slate-500 tracking-[0.2em] uppercase mb-2 font-bold">
          DATA PROVENANCE
        </h3>
        <div className="flex gap-2">
          {["UniProt", "Reactome", "RCSB PDB", "Human Protein Atlas"].map((src) => {
            const isMatch = activeEntity.source === src || (activeEntity.id === "mitochondrion" && src !== "NCBI");
            return (
              <span
                key={src}
                className={`text-[8px] font-mono font-extrabold uppercase px-1.5 py-1 rounded transition duration-150 ${
                  isMatch
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 shadow-[0_0_8px_rgba(6,182,212,0.1)]"
                    : "bg-slate-900/40 text-slate-600 border border-transparent"
                }`}
              >
                {src.substring(0, 1)}
              </span>
            );
          })}
          <span className="text-[10px] text-slate-500 font-sans leading-none self-center ml-1">
            Source: <b className="text-slate-300 font-bold">{activeEntity.source}</b>
          </span>
        </div>
      </div>

      {/* Physical Cellular metrics sparklines list */}
      <div className="text-left mb-6 flex-1 min-h-[220px]">
        <h3 className="text-[9.5px] font-mono text-slate-500 tracking-[0.2em] uppercase mb-4.5 font-bold">
          BIOMECHANICAL METRICS
        </h3>

        <div className="space-y-4">
          {/* metric 1 */}
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
            <div className="text-left">
              <span className="text-[8px] font-mono block text-slate-500 uppercase tracking-wide">ATP Production Rate</span>
              <span className="text-[11.5px] font-mono font-bold text-white leading-normal mt-0.5">2.47 mM/s</span>
            </div>
            <canvas ref={(el) => { sparklineRefs.current["atp"] = el; }} width={76} height={20} className="w-[76px] h-5 block opacity-85" />
          </div>

          {/* metric 2 */}
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
            <div className="text-left">
              <span className="text-[8px] font-mono block text-slate-500 uppercase tracking-wide">Membrane Potential</span>
              <span className="text-[11.5px] font-mono font-bold text-white leading-normal mt-0.5">-67.3 mV</span>
            </div>
            <canvas ref={(el) => { sparklineRefs.current["volt"] = el; }} width={76} height={20} className="w-[76px] h-5 block opacity-85" />
          </div>

          {/* metric 3 */}
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
            <div className="text-left">
              <span className="text-[8px] font-mono block text-slate-500 uppercase tracking-wide">Oxygen Consumption</span>
              <span className="text-[11.5px] font-mono font-bold text-white leading-normal mt-0.5">4.78 pmol/s</span>
            </div>
            <canvas ref={(el) => { sparklineRefs.current["oxy"] = el; }} width={76} height={20} className="w-[76px] h-5 block opacity-85" />
          </div>

          {/* metric 4 */}
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
            <div className="text-left">
              <span className="text-[8px] font-mono block text-slate-500 uppercase tracking-wide">Calcium Flux</span>
              <span className="text-[11.5px] font-mono font-bold text-white leading-normal mt-0.5">102 nM/s</span>
            </div>
            <canvas ref={(el) => { sparklineRefs.current["cal"] = el; }} width={76} height={20} className="w-[76px] h-5 block opacity-85" />
          </div>

          {/* metric 5 */}
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
            <div className="text-left">
              <span className="text-[8px] font-mono block text-slate-500 uppercase tracking-wide">Protein Synthesis Activity</span>
              <span className="text-[11.5px] font-mono font-bold text-white leading-normal mt-0.5">3.21 µM/s</span>
            </div>
            <canvas ref={(el) => { sparklineRefs.current["prot"] = el; }} width={76} height={20} className="w-[76px] h-5 block opacity-85" />
          </div>
        </div>
      </div>

      {/* Bottom recent structural occurrences */}
      <div className="border-t border-white/[0.08] pt-5 text-left shrink-0">
        <h3 className="text-[9.5px] font-mono text-slate-500 tracking-[0.2em] uppercase mb-3.5 font-bold">
          RECENT DISCOVERIES
        </h3>
        <ul className="space-y-2 text-[10px] text-slate-400 font-sans">
          <li className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>New protein complex isolated</span>
            </span>
            <span className="text-slate-600 font-mono">2m ago</span>
          </li>
          <li className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>ATP synthase turnover spiked</span>
            </span>
            <span className="text-slate-600 font-mono">5m ago</span>
          </li>
          <li className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
              <span>Calcium influx trace observed</span>
            </span>
            <span className="text-slate-600 font-mono">12m ago</span>
          </li>
        </ul>
      </div>

    </aside>
  );
};
