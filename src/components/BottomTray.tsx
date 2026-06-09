import React, { useRef, useEffect } from "react";

export const BottomTray: React.FC = () => {
  const telemetryCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Ref for bento sparklines
  const sparkRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

  // Animate the continuous scrolling digital telemetry wave
  useEffect(() => {
    const canvas = telemetryCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let points: number[] = Array.from({ length: 45 }, () => 10 + Math.random() * 20);

    const drawWave = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Gradient representing neon blue line fill
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, "rgba(34, 211, 238, 0.15)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");

      // Line path
      ctx.fillStyle = grad;
      ctx.strokeStyle = "#06b6d4";
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      points.forEach((p, idx) => {
        const x = (canvas.width / (points.length - 1)) * idx;
        const y = canvas.height - p;
        ctx.lineTo(x, y);
      });
      ctx.lineTo(canvas.width, canvas.height);
      ctx.closePath();
      ctx.fill();

      // Line stroke
      ctx.beginPath();
      points.forEach((p, idx) => {
        const x = (canvas.width / (points.length - 1)) * idx;
        const y = canvas.height - p;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Shift and add new point
      points.shift();
      points.push(8 + Math.random() * 24);

      animId = requestAnimationFrame(drawWave);
    };

    drawWave();
    return () => cancelAnimationFrame(animId);
  }, []);

  // Animate the four bento sparklines
  useEffect(() => {
    const list = ["prot_syn", "ion_trans", "ves_traffic", "atp_prod"];
    const colors = ["#22d3ee", "#38bdf8", "#fb923c", "#a78bfa"];
    const intervals: number[] = [];

    list.forEach((key, i) => {
      const canvas = sparkRefs.current[key];
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const pts = Array.from({ length: 16 }, () => 4 + Math.random() * 12);

      const drawBentoSpark = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = colors[i];
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        pts.forEach((p, idx) => {
          const x = (canvas.width / (pts.length - 1)) * idx;
          const y = canvas.height - p;
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();

        pts.shift();
        pts.push(4 + Math.random() * 12);
      };

      const inter = window.setInterval(drawBentoSpark, 120);
      intervals.push(inter);
    });

    return () => intervals.forEach((i) => clearInterval(i));
  }, []);

  return (
    <footer className="h-28 shrink-0 border-t border-white/[0.08] bg-[#03060f]/80 backdrop-blur-md flex items-center justify-between px-8 z-40 select-none">
      
      {/* 1. DATA SOURCES ACTIVE Panel */}
      <div className="w-[30%] flex items-center justify-between h-full py-4 border-r border-white/[0.08] pr-8 text-left">
        <div className="space-y-2">
          <h3 className="text-[9px] font-mono font-bold tracking-[0.25em] text-slate-500 uppercase leading-none">
            DATA SOURCES ACTIVE
          </h3>
          {/* Databases tags list */}
          <div className="flex gap-1.5 flex-wrap">
            {[
              { l: "U", n: "UniProt", bg: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" },
              { l: "R", n: "Reactome", bg: "bg-purple-500/10 text-purple-400 border border-purple-500/20" },
              { l: "P", n: "PDB", bg: "bg-red-500/10 text-red-500/85 border border-red-500/20" },
              { l: "H", n: "HPA", bg: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
              { l: "N", n: "NCBI", bg: "bg-sky-500/10 text-sky-400 border border-sky-500/20" },
              { l: "E", n: "Ensembl", bg: "bg-amber-500/10 text-amber-500 border border-amber-505/20" }
            ].map((d) => (
              <span
                key={d.l}
                className={`text-[8.5px] font-mono font-bold px-1 py-0.5 rounded ${d.bg}`}
                title={d.n}
              >
                {d.l}
              </span>
            ))}
          </div>
        </div>

        {/* Dynamic sliding wave telemetry */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[7.5px] font-mono text-slate-500 block leading-none">ELAPSED CLOCK</span>
            <span className="text-[10px] font-mono font-bold text-cyan-400 mt-1 block">02:15:07</span>
          </div>
          <div className="w-20 h-10 border border-white/5 rounded bg-black/40 p-0.5 overflow-hidden">
            <canvas ref={telemetryCanvasRef} width={76} height={36} className="w-full h-full block" />
          </div>
        </div>
      </div>

      {/* 2. MOLECULAR ACTIVITY Bento Grid */}
      <div className="flex-1 h-full py-4 flex items-center justify-around pl-8">
        
        {/* Cell 1 */}
        <div className="flex items-center gap-4 text-left w-1/4 max-w-xs">
          <div className="space-y-1">
            <span className="text-[8px] font-mono text-slate-500 block uppercase tracking-wider leading-none">Protein Synthesis</span>
            <span className="text-[12.5px] font-mono font-bold text-white mt-0.5 block">2,431 /s</span>
          </div>
          <div className="w-14 h-6 bg-black/35 rounded border border-white/5 p-0.5">
            <canvas ref={(el) => { sparkRefs.current["prot_syn"] = el; }} width={52} height={20} className="w-full h-full block" />
          </div>
        </div>

        {/* Cell 2 */}
        <div className="flex items-center gap-4 text-left w-1/4 max-w-xs">
          <div className="space-y-1">
            <span className="text-[8px] font-mono text-slate-500 block uppercase tracking-wider leading-none">Ion Transport</span>
            <span className="text-[12.5px] font-mono font-bold text-white mt-0.5 block">1,892 /s</span>
          </div>
          <div className="w-14 h-6 bg-black/35 rounded border border-white/5 p-0.5">
            <canvas ref={(el) => { sparkRefs.current["ion_trans"] = el; }} width={52} height={20} className="w-full h-full block" />
          </div>
        </div>

        {/* Cell 3 */}
        <div className="flex items-center gap-4 text-left w-1/4 max-w-xs">
          <div className="space-y-1">
            <span className="text-[8px] font-mono text-slate-500 block uppercase tracking-wider leading-none">Vesicle Traffic</span>
            <span className="text-[12.5px] font-mono font-bold text-white mt-0.5 block">1,201 /s</span>
          </div>
          <div className="w-14 h-6 bg-black/35 rounded border border-white/5 p-0.5">
            <canvas ref={(el) => { sparkRefs.current["ves_traffic"] = el; }} width={52} height={20} className="w-full h-full block" />
          </div>
        </div>

        {/* Cell 4 */}
        <div className="flex items-center gap-4 text-left w-1/4 max-w-xs">
          <div className="space-y-1">
            <span className="text-[8px] font-mono text-slate-500 block uppercase tracking-wider leading-none">ATP Production</span>
            <span className="text-[12.5px] font-mono font-bold text-white mt-0.5 block">3,821 /s</span>
          </div>
          <div className="w-14 h-6 bg-black/35 rounded border border-white/5 p-0.5">
            <canvas ref={(el) => { sparkRefs.current["atp_prod"] = el; }} width={52} height={20} className="w-full h-full block" />
          </div>
        </div>

      </div>

    </footer>
  );
};
