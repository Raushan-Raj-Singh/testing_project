"use client";

import React, { useMemo } from "react";
import { PieChart } from "lucide-react";

// Status Colors & Tints Configuration matching reference screenshot
const STATUS_COLORS = {
  New: { color: "#3b82f6", bg: "rgba(59, 130, 246, 0.15)" },
  "Follow-up": { color: "#a855f7", bg: "rgba(168, 85, 247, 0.15)" },
  Qualified: { color: "#10b981", bg: "rgba(16, 185, 129, 0.15)" },
  Closed: { color: "#64748b", bg: "rgba(100, 116, 139, 0.15)" },
  Lost: { color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)" },
};

const DEFAULT_STATUSES = ["New", "Follow-up", "Qualified", "Closed", "Lost"];

export default function LeadStatusDonut({ rows = [], columns = [] }) {
  const statusCol = useMemo(
    () =>
      columns.find(
        (c) =>
          c.special === "status" ||
          c.id === "status" ||
          (c.type === "dropdown" && c.name.toLowerCase() === "status")
      ),
    [columns]
  );

  // SVG Donut calculations (Larger & Prominent)
  const radius = 72;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius;

  // Dynamically aggregate counts per status from MongoDB rows
  const { statusData, totalLeads, topStatus } = useMemo(() => {
    const counts = {};
    const availableStatuses = statusCol?.options?.length
      ? statusCol.options.map((opt) =>
          typeof opt === "object" && opt !== null ? opt.label : String(opt)
        )
      : DEFAULT_STATUSES;

    availableStatuses.forEach((st) => (counts[st] = 0));

    let total = 0;
    rows.forEach((row) => {
      const data = row.data || {};
      const val = statusCol ? data[statusCol.id] : null;
      if (val && counts[val] !== undefined) {
        counts[val] += 1;
        total += 1;
      } else if (val) {
        counts[val] = (counts[val] || 0) + 1;
        total += 1;
      }
    });

    let cumulative = 0;
    let maxCount = -1;
    let topSt = null;

    const items = Object.keys(counts).map((st) => {
      const count = counts[st];
      if (count > maxCount) {
        maxCount = count;
        topSt = st;
      }
      const percent = total > 0 ? Math.round((count / total) * 100) : 0;
      const theme = STATUS_COLORS[st] || { color: "#9ca3af", bg: "rgba(156,163,175,0.15)" };
      const offset = -((cumulative / 100) * circumference);
      cumulative += percent;
      return { name: st, count, percent, color: theme.color, bg: theme.bg, offset };
    });

    return { statusData: items, totalLeads: rows.length, topStatus: topSt };
  }, [rows, statusCol, circumference]);

  return (
    <div className="glass-panel p-5 flex flex-col justify-between shadow-xl h-full w-full min-h-[300px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[var(--fg)] tracking-tight">
              Lead Status Distribution
            </h2>
            <p className="text-[11px] text-[var(--fg-subtle)]">Real-time status metrics</p>
          </div>
        </div>
        {topStatus && (
          <span className="text-[11px] px-2.5 py-1 rounded-full font-medium bg-[var(--bg-subtle)] text-[var(--fg-muted)] border border-[var(--border)]">
            Top: <strong className="text-[var(--fg)]">{topStatus}</strong>
          </span>
        )}
      </div>

      {/* Main Donut Content & Legend Container - Scaled up */}
      <div className="flex-1 flex items-center justify-center py-4 w-full">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center w-full">
          {/* Donut Chart Canvas (Large 200x200) */}
          <div className="md:col-span-5 relative flex items-center justify-center py-2">
            <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90 drop-shadow-md">
              {/* Background ring */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="transparent"
                stroke="rgba(255, 255, 255, 0.06)"
                strokeWidth={strokeWidth}
              />

              {/* Segment arcs */}
              {statusData.map((item, idx) => {
                if (item.percent === 0) return null;
                const strokeDasharray = `${(item.percent / 100) * circumference} ${circumference}`;

                return (
                  <circle
                    key={idx}
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="transparent"
                    stroke={item.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={item.offset}
                    strokeLinecap="round"
                    className="transition-all duration-300 hover:scale-[1.03] hover:opacity-90 cursor-pointer"
                    style={{ transformBox: "fill-box", transformOrigin: "center" }}
                  />
                );
              })}
            </svg>

            {/* Donut Center Counter */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="font-mono text-3xl font-extrabold text-[var(--fg)] tracking-tight">
                {totalLeads}
              </span>
              <span className="text-[11px] text-[var(--fg-muted)] font-semibold tracking-wider uppercase">
                Total Leads
              </span>
            </div>
          </div>

          {/* Expanded Legend Breakdown with Progress Bars */}
          <div className="md:col-span-7 space-y-3 w-full">
            {statusData.map((item, idx) => (
              <div
                key={idx}
                className="group p-2 rounded-lg transition-colors hover:bg-[var(--bg-subtle)]/50"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shadow-sm shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-semibold text-[var(--fg)]">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-[var(--fg-subtle)] font-medium">{item.percent}%</span>
                    <span className="font-bold text-[var(--fg)] px-2 py-0.5 rounded bg-[var(--bg-subtle)] text-[11px] min-w-[28px] text-center border border-[var(--border)]">
                      {item.count}
                    </span>
                  </div>
                </div>

                {/* Progress bar line */}
                <div className="w-full h-2 rounded-full bg-[var(--border)]/40 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${Math.max(item.percent, item.count > 0 ? 4 : 0)}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
