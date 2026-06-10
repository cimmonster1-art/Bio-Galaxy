import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Minus,
  Plus,
  RotateCcw,
  GitBranch,
  Radius as RadiusIcon,
  Search,
} from 'lucide-react';
import { TREE_OF_LIFE } from '../../data/taxonomy';
import { TaxonRank } from '../../types';
import { wikipedia } from '../../data/clients';
import {
  CladogramMode,
  LinkSegment,
  PositionedNode,
  computeLayout,
} from './cladogramLayout';

interface Props {
  onSelect: (pickId: string) => void;
  activeId: string | null;
}

// Rank color coding. Hues run broad (cool) to fine (warm) so depth reads at a
// glance, independent of each clade's own galaxy hue.
const RANK_COLOR: Record<TaxonRank, string> = {
  domain: '#7dd3fc',
  kingdom: '#67e8f9',
  phylum: '#5eead4',
  class: '#a3e635',
  order: '#fde047',
  family: '#fdba74',
  genus: '#fca5a5',
  species: '#f0abfc',
};

const RANK_LABEL: Record<TaxonRank, string> = {
  domain: 'Domain',
  kingdom: 'Kingdom',
  phylum: 'Phylum',
  class: 'Class',
  order: 'Order',
  family: 'Family',
  genus: 'Genus',
  species: 'Species',
};

const RANK_ORDER: TaxonRank[] = [
  'domain',
  'kingdom',
  'phylum',
  'class',
  'order',
  'family',
  'genus',
  'species',
];

const MIN_SCALE = 0.15;
const MAX_SCALE = 4;

interface ViewTransform {
  x: number;
  y: number;
  k: number;
}

/**
 * A self contained, zoomable and pannable 2D cladogram built from the Tree of
 * Life. Inline SVG only: a single transform group is panned and scaled by wheel
 * and drag. A small toolbar toggles between a rectangular tidy tree and a radial
 * projection, drives zoom, and dims nodes that do not match a text filter.
 */
export const CladogramView: React.FC<Props> = ({ onSelect, activeId }) => {
  const [mode, setMode] = useState<CladogramMode>('rectangular');
  const [filter, setFilter] = useState('');
  const [transform, setTransform] = useState<ViewTransform>({ x: 80, y: 40, k: 0.5 });
  const [hoverId, setHoverId] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(
    null,
  );

  // The layout itself is expensive relative to a frame, so memoize it per mode.
  // Pan and zoom only touch the cheap transform on the group, never the layout.
  const layout = useMemo(() => computeLayout(TREE_OF_LIFE, mode), [mode]);

  const activeRawId = activeId?.startsWith('taxon:') ? activeId.slice('taxon:'.length) : null;

  const query = filter.trim().toLowerCase();
  const matchSet = useMemo(() => {
    if (!query) return null;
    const set = new Set<string>();
    for (const n of layout.nodes) {
      if (
        n.name.toLowerCase().includes(query) ||
        n.common?.toLowerCase().includes(query) ||
        n.rank.includes(query)
      ) {
        set.add(n.id);
      }
    }
    return set;
  }, [layout.nodes, query]);

  // ---- pan and zoom ---------------------------------------------------------

  const onWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    setTransform((t) => {
      const factor = Math.exp(-e.deltaY * 0.0015);
      const k = clamp(t.k * factor, MIN_SCALE, MAX_SCALE);
      const ratio = k / t.k;
      // Keep the point under the cursor fixed while scaling.
      return {
        k,
        x: px - (px - t.x) * ratio,
        y: py - (py - t.y) * ratio,
      };
    });
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (e.button !== 0) return;
      (e.target as Element).setPointerCapture?.(e.pointerId);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        ox: transform.x,
        oy: transform.y,
      };
    },
    [transform.x, transform.y],
  );

  const onPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const d = dragRef.current;
    if (!d) return;
    setTransform((t) => ({
      ...t,
      x: d.ox + (e.clientX - d.startX),
      y: d.oy + (e.clientY - d.startY),
    }));
  }, []);

  const endDrag = useCallback(() => {
    dragRef.current = null;
  }, []);

  const zoomBy = useCallback((factor: number) => {
    const svg = svgRef.current;
    const rect = svg?.getBoundingClientRect();
    const px = rect ? rect.width / 2 : 0;
    const py = rect ? rect.height / 2 : 0;
    setTransform((t) => {
      const k = clamp(t.k * factor, MIN_SCALE, MAX_SCALE);
      const ratio = k / t.k;
      return { k, x: px - (px - t.x) * ratio, y: py - (py - t.y) * ratio };
    });
  }, []);

  const reset = useCallback(() => {
    setTransform(mode === 'radial' ? { x: 40, y: 20, k: 0.4 } : { x: 80, y: 40, k: 0.5 });
  }, [mode]);

  // Re-center when the layout mode flips so the new diagram is in frame.
  useEffect(() => {
    reset();
  }, [mode, reset]);

  // ---- hover thumbnail ------------------------------------------------------

  const focusId = hoverId ?? activeRawId;
  const focusNode = useMemo(
    () => layout.nodes.find((n) => n.id === focusId) ?? null,
    [layout.nodes, focusId],
  );
  const thumb = useNodeThumbnail(focusNode?.name ?? null);

  // ---- rendering ------------------------------------------------------------

  const handleNodeClick = useCallback(
    (id: string) => onSelect(`taxon:${id}`),
    [onSelect],
  );

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#080b12] text-slate-200">
      <Toolbar
        mode={mode}
        onMode={setMode}
        onZoomIn={() => zoomBy(1.3)}
        onZoomOut={() => zoomBy(1 / 1.3)}
        onReset={reset}
        filter={filter}
        onFilter={setFilter}
        matchCount={matchSet?.size ?? null}
        total={layout.nodes.length}
      />

      <svg
        ref={svgRef}
        className="h-full w-full cursor-grab touch-none select-none active:cursor-grabbing"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        <defs>
          <radialGradient id="clado-vignette" cx="50%" cy="42%" r="75%">
            <stop offset="0%" stopColor="#0e1626" />
            <stop offset="100%" stopColor="#070a10" />
          </radialGradient>
        </defs>
        <rect x={0} y={0} width="100%" height="100%" fill="url(#clado-vignette)" />

        <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.k})`}>
          {mode === 'rectangular' && <DepthScale layout={layout} />}

          {layout.links.map((link) => (
            <Connector key={`${link.parentId}-${link.childId}`} link={link} mode={mode} />
          ))}

          {layout.nodes.map((node) => (
            <Node
              key={node.id}
              node={node}
              mode={mode}
              active={node.id === activeRawId}
              hovered={node.id === hoverId}
              dimmed={matchSet ? !matchSet.has(node.id) : false}
              scale={transform.k}
              onClick={handleNodeClick}
              onHover={setHoverId}
            />
          ))}
        </g>
      </svg>

      <Legend />
      {focusNode && (
        <FocusCard node={focusNode} thumbUrl={thumb} />
      )}
    </div>
  );
};

// ---- connectors -------------------------------------------------------------

/**
 * A single parent to child connector. Rectangular mode draws the classic square
 * cladogram elbow (down the parent column, then across to the child). Radial
 * mode draws a straight spoke, which reads cleanly on concentric rings.
 */
const Connector: React.FC<{ link: LinkSegment; mode: CladogramMode }> = ({ link, mode }) => {
  const stroke = `hsl(${link.hue} 45% 55% / 0.35)`;
  if (mode === 'radial') {
    return (
      <line
        x1={link.x1}
        y1={link.y1}
        x2={link.x2}
        y2={link.y2}
        stroke={stroke}
        strokeWidth={1}
      />
    );
  }
  const d = `M ${link.x1} ${link.y1} L ${link.x1} ${link.y2} L ${link.x2} ${link.y2}`;
  return <path d={d} fill="none" stroke={stroke} strokeWidth={1} />;
};

// ---- nodes ------------------------------------------------------------------

interface NodeProps {
  node: PositionedNode;
  mode: CladogramMode;
  active: boolean;
  hovered: boolean;
  dimmed: boolean;
  scale: number;
  onClick: (id: string) => void;
  onHover: (id: string | null) => void;
}

const Node: React.FC<NodeProps> = React.memo(
  ({ node, mode, active, hovered, dimmed, onClick, onHover }) => {
    const color = RANK_COLOR[node.rank];
    const r = node.leaf ? 3.2 : 4.4;
    const opacity = dimmed ? 0.16 : 1;
    // Italicise binomial and genus names per Linnaean convention.
    const italic = node.rank === 'species' || node.rank === 'genus';
    const label = node.name;
    // In radial mode push the label outward to the right of the dot.
    const anchor = mode === 'radial' ? 'middle' : 'start';
    const labelDx = mode === 'radial' ? 0 : 8;
    const labelDy = mode === 'radial' ? -8 : 3.5;

    return (
      <g
        transform={`translate(${node.x} ${node.y})`}
        opacity={opacity}
        style={{ cursor: 'pointer' }}
        onClick={(e) => {
          e.stopPropagation();
          onClick(node.id);
        }}
        onPointerEnter={() => onHover(node.id)}
        onPointerLeave={() => onHover(null)}
      >
        {active && (
          <circle r={r + 5} fill="none" stroke="#27c4d9" strokeWidth={1.5} opacity={0.9} />
        )}
        <circle
          r={hovered ? r + 1.5 : r}
          fill={color}
          stroke={active ? '#27c4d9' : '#0b1018'}
          strokeWidth={active ? 1.5 : 1}
        />
        <text
          x={labelDx}
          y={labelDy}
          textAnchor={anchor}
          fontSize={node.leaf ? 9 : 10.5}
          fontStyle={italic ? 'italic' : 'normal'}
          fontWeight={node.rank === 'domain' || node.rank === 'kingdom' ? 600 : 400}
          fill={active ? '#7fe9f3' : hovered ? '#e2e8f0' : '#9fb2c6'}
          style={{ pointerEvents: 'none' }}
        >
          {label}
        </text>
        {!node.leaf && mode === 'rectangular' && (
          <text
            x={labelDx}
            y={labelDy + 11}
            textAnchor={anchor}
            fontSize={7.5}
            fill="#5b6e83"
            letterSpacing={1}
            style={{ pointerEvents: 'none', textTransform: 'uppercase' }}
          >
            {RANK_LABEL[node.rank]}
          </text>
        )}
      </g>
    );
  },
);
Node.displayName = 'CladogramNode';

// ---- depth scale ------------------------------------------------------------

/** Faint vertical guides and rank labels by depth column, rectangular only. */
const DepthScale: React.FC<{ layout: ReturnType<typeof computeLayout> }> = ({ layout }) => {
  // Map each depth to the rank that appears at it (roots are domains at depth 0).
  const rankByDepth = useMemo(() => {
    const m = new Map<number, TaxonRank>();
    for (const n of layout.nodes) {
      if (!m.has(n.depth)) m.set(n.depth, n.rank);
    }
    return m;
  }, [layout.nodes]);

  const cols: number[] = [];
  for (let d = 0; d <= layout.maxDepth; d++) cols.push(d);
  const colX = (d: number) => (layout.width / Math.max(1, layout.maxDepth)) * d;

  return (
    <g>
      {cols.map((d) => {
        const x = colX(d);
        const rank = rankByDepth.get(d);
        return (
          <g key={d}>
            <line
              x1={x}
              y1={-30}
              x2={x}
              y2={layout.height + 30}
              stroke="#1a2638"
              strokeWidth={1}
              strokeDasharray="2 6"
            />
            {rank && (
              <text
                x={x}
                y={-16}
                textAnchor="middle"
                fontSize={9}
                fill="#3f5266"
                letterSpacing={1.5}
                style={{ textTransform: 'uppercase' }}
              >
                {RANK_LABEL[rank]}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
};

// ---- toolbar ----------------------------------------------------------------

interface ToolbarProps {
  mode: CladogramMode;
  onMode: (m: CladogramMode) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  filter: string;
  onFilter: (v: string) => void;
  matchCount: number | null;
  total: number;
}

const Toolbar: React.FC<ToolbarProps> = ({
  mode,
  onMode,
  onZoomIn,
  onZoomOut,
  onReset,
  filter,
  onFilter,
  matchCount,
  total,
}) => (
  <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-wrap items-center gap-2 p-3">
    <div className="pointer-events-auto flex overflow-hidden rounded-md border border-white/10 bg-black/40 backdrop-blur">
      <ToolButton active={mode === 'rectangular'} onClick={() => onMode('rectangular')} title="Rectangular cladogram">
        <GitBranch className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Tree</span>
      </ToolButton>
      <ToolButton active={mode === 'radial'} onClick={() => onMode('radial')} title="Radial cladogram">
        <RadiusIcon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Radial</span>
      </ToolButton>
    </div>

    <div className="pointer-events-auto flex overflow-hidden rounded-md border border-white/10 bg-black/40 backdrop-blur">
      <ToolButton onClick={onZoomOut} title="Zoom out">
        <Minus className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton onClick={onZoomIn} title="Zoom in">
        <Plus className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton onClick={onReset} title="Reset view">
        <RotateCcw className="h-3.5 w-3.5" />
      </ToolButton>
    </div>

    <div className="pointer-events-auto flex items-center gap-1.5 rounded-md border border-white/10 bg-black/40 px-2 py-1 backdrop-blur">
      <Search className="h-3.5 w-3.5 text-slate-500" />
      <input
        value={filter}
        onChange={(e) => onFilter(e.target.value)}
        placeholder="Filter taxa"
        className="w-32 bg-transparent text-[12px] text-slate-200 placeholder:text-slate-600 focus:outline-none"
      />
      {matchCount !== null && (
        <span className="meta-label whitespace-nowrap text-cyan-300/80">{matchCount}</span>
      )}
    </div>

    <div className="pointer-events-none ml-auto hidden rounded-md border border-white/5 bg-black/30 px-2 py-1 md:block">
      <span className="meta-label">{total} taxa</span>
    </div>
  </div>
);

const ToolButton: React.FC<{
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ active, onClick, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] transition ${
      active
        ? 'bg-cyan-400/15 text-cyan-200'
        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
    }`}
  >
    {children}
  </button>
);

// ---- legend and focus card --------------------------------------------------

const Legend: React.FC = () => (
  <div className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-md border border-white/10 bg-black/40 px-3 py-2 backdrop-blur">
    <div className="meta-label mb-1.5">Rank</div>
    <div className="flex flex-col gap-1">
      {RANK_ORDER.map((rank) => (
        <div key={rank} className="flex items-center gap-2 text-[11px] text-slate-400">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: RANK_COLOR[rank] }}
          />
          {RANK_LABEL[rank]}
        </div>
      ))}
    </div>
  </div>
);

const FocusCard: React.FC<{ node: PositionedNode; thumbUrl: string | null }> = ({
  node,
  thumbUrl,
}) => {
  const italic = node.rank === 'species' || node.rank === 'genus';
  return (
    <div className="pointer-events-none absolute bottom-3 right-3 z-10 w-56 overflow-hidden rounded-md border border-white/10 bg-black/50 backdrop-blur">
      {thumbUrl && (
        <img src={thumbUrl} alt={node.name} className="h-24 w-full bg-slate-900 object-cover" />
      )}
      <div className="px-3 py-2">
        <div
          className={`text-[13px] font-semibold text-slate-100 ${italic ? 'italic' : ''}`}
        >
          {node.name}
        </div>
        <div className="meta-label mt-0.5 text-cyan-300/80">{RANK_LABEL[node.rank]}</div>
        {node.common && (
          <div className="mt-1 text-[11px] text-slate-400">{node.common}</div>
        )}
        {node.ncbiTaxId !== undefined && (
          <div className="mt-1 font-mono text-[10px] text-slate-500">
            NCBI tax id {node.ncbiTaxId}
          </div>
        )}
      </div>
    </div>
  );
};

// ---- hooks and utils --------------------------------------------------------

/**
 * Lazily load a small Wikipedia thumbnail for a node title. Best effort: errors
 * and aborts are swallowed, and stale responses are ignored so rapid hovers do
 * not flicker. The Wikipedia client already caches summaries for a day.
 */
function useNodeThumbnail(title: string | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    setUrl(null);
    if (!title) return;
    let active = true;
    const controller = new AbortController();
    wikipedia
      .getSummary(title, { signal: controller.signal })
      .then((summary) => {
        if (active) setUrl(summary.thumbnailUrl ?? null);
      })
      .catch(() => {
        // best effort, swallow errors and aborts
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [title]);

  return url;
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
