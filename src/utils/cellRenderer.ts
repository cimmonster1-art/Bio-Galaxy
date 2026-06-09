// Cell Visual Observatory rendering engine
// Decouples all scientific drawing states from React context to maintain clean modularity

export interface Particle {
  x: number;
  y: number;
  s: number;
  alpha: number;
  angle: number;
  r: number;
}

export interface Hotspot {
  id: string;
  label: string;
  role: string;
  source: string;
  x: number;
  y: number;
  r: number;
}

// 1. Grid renderer showing technical background
export const drawGrid = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  panX: number,
  panY: number
) => {
  ctx.strokeStyle = "rgba(34, 211, 238, 0.015)";
  ctx.lineWidth = 1;
  const spacing = 40;
  const startX = panX % spacing;
  const startY = panY % spacing;

  for (let x = startX; x < width; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = startY; y < height; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
};

// 2. Cytoskeletal filament networks connecting active hot regions
export const drawCytoskeletonFilaments = (
  ctx: CanvasRenderingContext2D,
  hotspots: Hotspot[],
  dynamicTime: number
) => {
  ctx.strokeStyle = "rgba(6, 182, 212, 0.12)";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  hotspots.forEach((h1, i) => {
    hotspots.forEach((h2, j) => {
      if (i < j) {
        ctx.moveTo(h1.x, h1.y);
        const midX = (h1.x + h2.x) / 2 + Math.sin(dynamicTime + i) * 15;
        const midY = (h1.y + h2.y) / 2 + Math.cos(dynamicTime + j) * 15;
        ctx.quadraticCurveTo(midX, midY, h2.x, h2.y);
      }
    });
  });
  ctx.stroke();

  // Draw minor micro-nodes along filaments
  ctx.fillStyle = "rgba(6, 182, 212, 0.25)";
  hotspots.forEach((h, i) => {
    ctx.beginPath();
    ctx.arc(
      h.x + Math.sin(dynamicTime + i) * 8,
      h.y + Math.cos(dynamicTime * 0.8 + i) * 8,
      2,
      0,
      Math.PI * 2
    );
    ctx.fill();
  });
};

// 3. Waving Fluid Cell Membrane Outline
export const drawCellMembrane = (
  ctx: CanvasRenderingContext2D,
  dynamicTime: number
) => {
  ctx.strokeStyle = "rgba(129, 140, 248, 0.25)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  const numPoints = 85;
  for (let i = 0; i <= numPoints; i++) {
    const phi = (Math.PI * 2 / numPoints) * i;
    const amp = 8 * Math.cos(phi * 8 + dynamicTime * 1.5) + 4 * Math.sin(phi * 4 - dynamicTime);
    const radius = 300 + amp;
    const mx = Math.cos(phi) * radius;
    const my = Math.sin(phi) * radius;
    if (i === 0) ctx.moveTo(mx, my);
    else ctx.lineTo(mx, my);
  }
  ctx.closePath();
  ctx.stroke();
};

// 4. Endoplasmic Reticulum folds with bound ribosomes
export const drawER = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dynamicTime: number
) => {
  ctx.strokeStyle = "rgba(6, 182, 212, 0.4)";
  ctx.lineWidth = 2.5;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(dynamicTime * 0.08);
  ctx.beginPath();
  for (let k = 0; k < 6; k++) {
    const rVal = 24 + k * 8;
    ctx.arc(0, 0, rVal, -Math.PI * 0.8, Math.PI * 1.15);
  }
  ctx.stroke();

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
};

// 5. Parallel Crescent Glands of Golgi Apparatus
export const drawGolgi = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dynamicTime: number
) => {
  ctx.strokeStyle = "rgba(236, 72, 153, 0.55)";
  ctx.lineWidth = 3.2;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 6 + dynamicTime * 0.04);
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    const baseArc = 20 + i * 5.5;
    ctx.arc(0, -i * 2.5, baseArc, -Math.PI / 1.3, -Math.PI / 3.5);
    ctx.stroke();
  }
  ctx.restore();
};

// 6. Double-membraned mitochondria capsules and folding cristae matrix
export const drawMitochondria = (
  ctx: CanvasRenderingContext2D,
  mx: number,
  my: number,
  size: number,
  rot: number,
  idx: number,
  dynamicTime: number
) => {
  ctx.save();
  ctx.translate(mx, my + Math.sin(dynamicTime + idx * 2) * 5);
  ctx.rotate(rot + dynamicTime * 0.05);

  const elGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, size * 1.5);
  elGrad.addColorStop(0, "#fef08a");
  elGrad.addColorStop(0.3, "#eab308");
  elGrad.addColorStop(0.75, "#854d0e");
  elGrad.addColorStop(1, "#1c0d02");

  ctx.fillStyle = elGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 1.6, size, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(234, 179, 8, 0.45)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-size * 1.2, 0);
  ctx.lineTo(-size * 0.8, -size * 0.4);
  ctx.lineTo(-size * 0.4, size * 0.4);
  ctx.lineTo(0, -size * 0.4);
  ctx.lineTo(size * 0.4, size * 0.4);
  ctx.lineTo(size * 0.8, -size * 0.4);
  ctx.lineTo(size * 1.2, 0);
  ctx.stroke();

  ctx.restore();
};

// 7. Master Nucleus with active center chromatin fibers
export const drawNucleus = (
  ctx: CanvasRenderingContext2D,
  isHovered: boolean,
  dynamicTime: number,
  radNuc: number
) => {
  const nGrad = ctx.createRadialGradient(-4, -4, 5, 0, 0, radNuc);
  nGrad.addColorStop(0, "#fdf4ff");
  nGrad.addColorStop(0.15, "#e879f9");
  nGrad.addColorStop(0.5, "#a21caf");
  nGrad.addColorStop(0.85, "#4a044e");
  nGrad.addColorStop(1, "#020108");

  ctx.save();
  ctx.shadowColor = "#d946ef";
  ctx.shadowBlur = isHovered ? 40 : 18;
  ctx.fillStyle = nGrad;
  ctx.beginPath();
  ctx.arc(0, 0, radNuc, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = "rgba(255,150,255,0.22)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (let h = 0; h < 4; h++) {
    const rHelix = 16 + h * 9;
    ctx.arc(0, 0, rHelix, 0, Math.PI * 2);
  }
  ctx.stroke();

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

  const innerCore = ctx.createRadialGradient(-1, -1, 0, 0, 0, 14);
  innerCore.addColorStop(0, "white");
  innerCore.addColorStop(0.4, "#701a75");
  innerCore.addColorStop(1, "#2e022e");
  ctx.fillStyle = innerCore;
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(232, 121, 249, 0.4)";
  ctx.lineWidth = 1.75;
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.arc(0, 0, radNuc + 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
};

// 8. Acidic Lysosome spherical recycling organelles (New Organelle)
export const drawLysosome = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dynamicTime: number
) => {
  ctx.save();
  ctx.translate(x, y + Math.sin(dynamicTime * 1.2) * 4);
  
  const lyGrad = ctx.createRadialGradient(-2, -2, 1, 0, 0, 22);
  lyGrad.addColorStop(0, "#f87171");
  lyGrad.addColorStop(0.4, "#ef4444");
  lyGrad.addColorStop(0.8, "#b91c1c");
  lyGrad.addColorStop(1, "#450a0a");

  ctx.fillStyle = lyGrad;
  ctx.shadowColor = "#ef4444";
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Outer membrane boundary
  ctx.strokeStyle = "rgba(248, 113, 113, 0.5)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Internal debris digest segments
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(
      -5 + Math.sin(dynamicTime + i) * 6,
      -3 + Math.cos(dynamicTime + i * 1.5) * 6,
      2,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  ctx.restore();
};

// 9. Peroxisome detoxification spheres (New Organelle)
export const drawPeroxisome = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dynamicTime: number
) => {
  ctx.save();
  ctx.translate(x + Math.cos(dynamicTime * 0.9) * 3, y + Math.sin(dynamicTime * 0.9) * 3);

  const pxGrad = ctx.createRadialGradient(-1, -1, 1, 0, 0, 18);
  pxGrad.addColorStop(0, "#cbd5e1");
  pxGrad.addColorStop(0.3, "#475569");
  pxGrad.addColorStop(0.8, "#1e293b");
  pxGrad.addColorStop(1, "#020617");

  ctx.fillStyle = pxGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Crystalline oxidative protein core in center
  ctx.fillStyle = "#38bdf8";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.rect(-4, -4, 8, 8);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
  ctx.strokeRect(-4, -4, 8, 8);

  ctx.restore();
};

// 10. Ribosomal peptide synthesizing assemblies clusters (New Organelle)
export const drawRibosomesCluster = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dynamicTime: number
) => {
  ctx.save();
  ctx.translate(x, y);
  
  // Ribosomal sub-clusters coordinates
  const positions = [
    { dx: -12, dy: -8, size: 3.5 },
    { dx: 14, dy: 10, size: 4 },
    { dx: -6, dy: 12, size: 3 },
    { dx: 8, dy: -14, size: 4.5 },
  ];

  ctx.fillStyle = "#38bdf8";
  positions.forEach((p, idx) => {
    ctx.beginPath();
    // Micro jitter
    const ox = p.dx + Math.sin(dynamicTime * 3 + idx) * 2;
    const oy = p.dy + Math.cos(dynamicTime * 2.5 + idx) * 2;
    ctx.arc(ox, oy, p.size, 0, Math.PI * 2);
    ctx.fill();

    // Adding dynamic peptide chain leaking out
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.quadraticCurveTo(ox + 5, oy - 5, ox + 8 + Math.sin(dynamicTime) * 3, oy - 12);
    ctx.stroke();
  });

  ctx.restore();
};

// 11. Centrosome organizing cylinder hub (New Organelle)
export const drawCentrosome = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dynamicTime: number
) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(dynamicTime * 0.2);

  // Draw 2 orthogonal centrioles barrels
  ctx.fillStyle = "#818cf8";
  ctx.strokeStyle = "#4338ca";
  ctx.lineWidth = 1;

  // Barrel 1 (Vertical)
  ctx.fillRect(-12, -4, 24, 8);
  ctx.strokeRect(-12, -4, 24, 8);

  // Barrel 2 (Orthogonal)
  ctx.save();
  ctx.rotate(Math.PI / 2);
  ctx.fillRect(-12, -4, 24, 8);
  ctx.strokeRect(-12, -4, 24, 8);
  ctx.restore();

  // Draw launching radial spindle microtubules paths
  ctx.strokeStyle = "rgba(129, 140, 248, 0.15)";
  ctx.lineWidth = 0.5;
  for (let ang = 0; ang < Math.PI * 2; ang += Math.PI / 4) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    // Pulsing length
    const len = 40 + Math.sin(dynamicTime * 2 + ang) * 8;
    ctx.lineTo(Math.cos(ang) * len, Math.sin(ang) * len);
    ctx.stroke();
  }

  ctx.restore();
};
