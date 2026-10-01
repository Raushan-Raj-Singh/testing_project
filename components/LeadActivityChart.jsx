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

    // Fallback baseline for clean display if initial sample data is small
    const dataPoints = days.map((d) => counts[d] || 0);
    const maxVal = Math.max(...dataPoints, 4);

    return { days, dataPoints, maxVal };
  }, [rows]);

  const { days, dataPoints, maxVal } = chartData;

  // SVG coordinate dimensions
  const svgWidth = 500;
  const svgHeight = 180;
  const paddingX = 40;
  const paddingY = 25;
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
    <div className="glass-panel p-4.5 flex flex-col justify-between shadow-lg h-full">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)]">
        <TrendingUp className="w-4 h-4 text-[var(--orange)]" />
        <h2 className="text-sm font-bold text-[var(--fg)] tracking-tight">
          Lead Activity
        </h2>
      </div>

      {/* SVG Chart Container */}
      <div className="relative w-full overflow-hidden mt-3">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="amberGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((gridVal) => {
            const y = svgHeight - paddingY - (gridVal / maxVal) * chartH;
            return (
              <g key={gridVal}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={svgWidth - paddingX}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.06)"
                  strokeDasharray="3 3"
                />
                <text
                  x={paddingX - 12}
                  y={y + 4}
                  fill="var(--fg-subtle)"
                  fontSize="10"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  {gridVal}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={areaD} fill="url(#amberGradient)" />

          {/* Smooth Line */}
          <path d={pathD} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />

          {/* Data Points */}
          {points.map((pt, idx) => (
            <g key={idx} className="group cursor-pointer">
              <circle
                cx={pt.x}
                cy={pt.y}
                r="4"
                fill="#0b0f17"
                stroke="#f59e0b"
                strokeWidth="2.5"
                className="transition-transform group-hover:scale-150"
              />
              <text
                x={pt.x}
                y={svgHeight - 6}
                fill="var(--fg-muted)"
                fontSize="10"
                textAnchor="middle"
                fontFamily="sans-serif"
              >
                {pt.day}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
