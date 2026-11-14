"use client";

import type { DimensionScores } from "@/types/analog";

interface AsiRadarChartProps {
  dimensions: DimensionScores;
  weights: DimensionScores;
  isMars: boolean;
}

const AXES: { key: keyof DimensionScores; shortLabel: string }[] = [
  { key: "topography", shortLabel: "Topografía" },
  { key: "geology", shortLabel: "Geología" },
  { key: "thermal", shortLabel: "Térmico" },
  { key: "hydrology_ice", shortLabel: "Sequedad/Hielo" },
  { key: "subsurface_ops", shortLabel: "Subterráneo" },
];

export function AsiRadarChart({ dimensions, weights, isMars }: AsiRadarChartProps) {
  const size = 230;
  const cx = size / 2;
  const cy = size / 2 + 4;
  const maxR = 72;

  const strokeColor = isMars ? "#E07A5F" : "#06B6D4";
  const fillColor = isMars ? "rgba(224, 122, 95, 0.24)" : "rgba(6, 182, 212, 0.24)";

  const getPoint = (index: number, pct: number) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / AXES.length;
    const r = (Math.max(0, Math.min(100, pct)) / 100) * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const rings = [25, 50, 75, 100];

  const scorePoints = AXES.map((axis, i) =>
    getPoint(i, dimensions[axis.key] ?? 0)
  );
  const scorePolygon = scorePoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  // Target ideal envelope (100% on weighted priorities, scaled to show emphasis)
  const priorityPoints = AXES.map((axis, i) => {
    const w = weights[axis.key] ?? 0.2;
    const priorityScale = Math.min(100, 45 + w * 165);
    return getPoint(i, priorityScale);
  });
  const priorityPolygon = priorityPoints
    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="h-[205px] w-full max-w-[240px] select-none overflow-visible"
        role="img"
        aria-label="Gráfico radar pentagonal de dimensiones del Índice de Similitud Análoga"
      >
        {/* Concentric pentagon grid rings */}
        {rings.map((ringPct) => {
          const pts = AXES.map((_, i) => getPoint(i, ringPct))
            .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
            .join(" ");
          return (
            <polygon
              key={ringPct}
              points={pts}
              fill="none"
              stroke={ringPct === 100 ? "rgba(148, 163, 184, 0.32)" : "rgba(148, 163, 184, 0.14)"}
              strokeWidth={ringPct === 100 ? 1.1 : 0.8}
              strokeDasharray={ringPct === 50 ? "2,2" : undefined}
            />
          );
        })}

        {/* Axis spokes */}
        {AXES.map((axis, i) => {
          const outer = getPoint(i, 100);
          return (
            <line
              key={axis.key}
              x1={cx}
              y1={cy}
              x2={outer.x}
              y2={outer.y}
              stroke="rgba(148, 163, 184, 0.2)"
              strokeWidth="0.9"
            />
          );
        })}

        {/* Target mission weight envelope */}
        <polygon
          points={priorityPolygon}
          fill="rgba(212, 175, 55, 0.07)"
          stroke="#D4AF37"
          strokeWidth="1.2"
          strokeDasharray="3,2"
        />

        {/* Site ASI dimension score polygon */}
        <polygon
          points={scorePolygon}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth="2"
        />

        {/* Vertex dots and labels */}
        {AXES.map((axis, i) => {
          const pt = scorePoints[i];
          const labelPt = getPoint(i, 128);
          const val = dimensions[axis.key] ?? 0;
          return (
            <g key={axis.key}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r="3.2"
                fill={strokeColor}
                stroke="#060913"
                strokeWidth="1.2"
              />
              <text
                x={labelPt.x}
                y={labelPt.y - 4}
                textAnchor="middle"
                className="fill-slate-300 text-[9.5px] font-medium"
              >
                {axis.shortLabel}
              </text>
              <text
                x={labelPt.x}
                y={labelPt.y + 7}
                textAnchor="middle"
                className="fill-[#D4AF37] font-mono text-[9.5px] font-bold"
              >
                {val.toFixed(0)}%
              </text>
            </g>
          );
        })}
      </svg>

      <div className="mt-1 flex items-center justify-center gap-4 text-[10px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: strokeColor }}
          />
          Similitud Sitio (%)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-3 border-b border-dashed border-[#D4AF37]" />
          Énfasis Objetivo
        </span>
      </div>
    </div>
  );
}
