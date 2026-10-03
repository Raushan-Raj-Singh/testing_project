"use client";

import React, { useMemo } from "react";
import { TrendingUp } from "lucide-react";

export default function LeadActivityChart({ rows = [] }) {
  // Aggregate real lead rows by Day of Week based on createdAt timestamp
  const chartData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const counts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };

    rows.forEach((row) => {
      const date = row.createdAt ? new Date(row.createdAt) : new Date();
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
      if (counts[dayName] !== undefined) {
        counts[dayName] += 1;
      }
    });

    const dataPoints = days.map((d) => counts[d] || 0);
    const maxVal = Math.max(...dataPoints, 4);

    let peakDay = "Mon";
    let peakCount = 0;
    let totalWeekly = 0;
    days.forEach((d) => {
      totalWeekly += counts[d];
      if (counts[d] > peakCount) {
        peakCount = counts[d];
        peakDay = d;
      }
    });

    const avgDaily = (totalWeekly / 7).toFixed(1);

    return { days, dataPoints, maxVal, peakDay, peakCount, totalWeekly, avgDaily };
  }, [rows]);

  const { days, dataPoints, maxVal, peakDay, peakCount, totalWeekly, avgDaily } = chartData;

  // SVG coordinate dimensions (Enlarged)
  const svgWidth = 560;
  const svgHeight = 210;
  const paddingX = 42;
  const paddingY = 30;
  const chartW = svgWidth - paddingX * 2;
  const chartH = svgHeight - paddingY * 2;

  const points = dataPoints.map((val, idx) => {
    const x = paddingX + (idx / (days.length - 1)) * chartW;
    const y = svgHeight - paddingY - (val / maxVal) * chartH;
    return { x, y, val, day: days[idx] };
  });

  // Construct SVG path string for smooth curve
  const pathD = points.reduce((acc, pt, i, a) => {
    if (i === 0) return `M ${pt.x},${pt.y}`;
    const prev = a[i - 1];
    const cx = (prev.x + pt.x) / 2;
    return `${acc} C ${cx},${prev.y} ${cx},${pt.y} ${pt.x},${pt.y}`;
  }, "");

  // Closed area path string for gradient fill
  const areaD = `${pathD} L ${points[points.length - 1].x},${svgHeight - paddingY} L ${points[0].x},${svgHeight - paddingY} Z`;

  return (
    <div className="glass-panel p-5 flex flex-col justify-between shadow-xl h-full w-full min-h-[300px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[var(--orange)]/10 text-[var(--orange)]">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[var(--fg)] tracking-tight">
              Weekly Lead Activity
            </h2>
            <p className="text-[11px] text-[var(--fg-subtle)]">Activity trend across days</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] px-2.5 py-1 rounded-full font-medium bg-[var(--bg-subtle)] text-[var(--fg-muted)] border border-[var(--border)]">
            Peak: <strong className="text-[var(--fg)]">{peakDay} ({peakCount})</strong>
          </span>
        </div>
      </div>

      {/* SVG Chart Canvas */}
      <div className="relative w-full overflow-hidden flex-1 flex items-center justify-center py-2">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#f59e0b" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((gridVal) => {
            const calculatedVal = Math.round((gridVal / 4) * maxVal);
            const y = svgHeight - paddingY - (gridVal / 4) * chartH;
            return (
              <g key={gridVal}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={svgWidth - paddingX}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.07)"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 12}
                  y={y + 3.5}
                  fill="var(--fg-subtle)"
                  fontSize="11"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  {calculatedVal}
                </text>
              </g>
            );
          })}

          {/* Gradient Area Fill */}
          <path d={areaD} fill="url(#amberGradient)" />

          {/* Glowing Curve Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="3"
            strokeLinecap="round"
            filter="url(#glow)"
          />

          {/* Interactive Data Points */}
          {points.map((pt, idx) => (
            <g key={idx} className="group cursor-pointer">
              {/* Invisible Hit Target */}
              <circle cx={pt.x} cy={pt.y} r="18" fill="transparent" />

              {/* Outer Pulsing Ring on Hover */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r="7"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.5"
                className="opacity-0 group-hover:opacity-100 transition-all duration-200"
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
              />

              {/* Data Point Circle */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r="4.5"
                fill="var(--bg-card, #0b0f17)"
                stroke="#f59e0b"
                strokeWidth="2.5"
                className="transition-transform duration-200 ease-out group-hover:scale-125"
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
              />

              {/* Tooltip */}
              <g className="opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none transform group-hover:-translate-y-1">
                <rect
                  x={pt.x - 28}
                  y={pt.y - 32}
                  width="56"
                  height="22"
                  rx="5"
                  fill="#1e293b"
                  stroke="rgba(245, 158, 11, 0.5)"
                  strokeWidth="1"
                />
                <text
                  x={pt.x}
                  y={pt.y - 17}
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight="600"
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  {pt.val} {pt.val === 1 ? "lead" : "leads"}
                </text>
              </g>

              {/* Day Label */}
              <text
                x={pt.x}
                y={svgHeight - 8}
                fill="var(--fg-muted)"
                fontSize="11"
                fontWeight="500"
                textAnchor="middle"
                fontFamily="sans-serif"
              >
                {pt.day}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Footer Metrics Highlights */}
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[var(--border)]/60 text-center">
        <div className="p-1.5 rounded-lg bg-[var(--bg-subtle)]/40 border border-[var(--border)]/40">
          <p className="text-[10px] text-[var(--fg-subtle)] uppercase font-semibold">Total Weekly</p>
          <p className="text-xs font-mono font-bold text-[var(--fg)]">{totalWeekly}</p>
        </div>
        <div className="p-1.5 rounded-lg bg-[var(--bg-subtle)]/40 border border-[var(--border)]/40">
          <p className="text-[10px] text-[var(--fg-subtle)] uppercase font-semibold">Daily Avg</p>
          <p className="text-xs font-mono font-bold text-[var(--fg)]">{avgDaily}</p>
        </div>
        <div className="p-1.5 rounded-lg bg-[var(--bg-subtle)]/40 border border-[var(--border)]/40">
          <p className="text-[10px] text-[var(--fg-subtle)] uppercase font-semibold">Busiest Day</p>
          <p className="text-xs font-mono font-bold text-[var(--orange)]">{peakDay}</p>
        </div>
      </div>
    </div>
  );
}
