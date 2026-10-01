"use client";

import React, { useMemo } from "react";
import { PieChart } from "lucide-react";

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

  // Status Colors & Tints Configuration matching reference screenshot
  const statusColors = {
    New: { color: "#3b82f6", bg: "rgba(59, 130, 246, 0.15)" },
    "Follow-up": { color: "#a855f7", bg: "rgba(168, 85, 247, 0.15)" },
    Qualified: { color: "#10b981", bg: "rgba(16, 185, 129, 0.15)" },
    Closed: { color: "#64748b", bg: "rgba(100, 116, 139, 0.15)" },
    Lost: { color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)" },
  };

  const defaultStatuses = ["New", "Follow-up", "Qualified", "Closed", "Lost"];

  // Dynamically aggregate counts per status from MongoDB rows
  const { statusData, totalLeads } = useMemo(() => {
    const counts = {};
    const availableStatuses = statusCol?.options?.length
      ? statusCol.options
      : defaultStatuses;

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

    const items = Object.keys(counts).map((st) => {
      const count = counts[st];
      const percent = total > 0 ? Math.round((count / total) * 100) : 0;
      const theme = statusColors[st] || { color: "#9ca3af", bg: "rgba(156,163,175,0.15)" };
      return { name: st, count, percent, color: theme.color };
    });

    return { statusData: items, totalLeads: rows.length };
  }, [rows, statusCol]);

  // SVG Donut calculations
  const radius = 55;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="glass-panel p-4.5 flex flex-col justify-between shadow-lg h-full">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)]">
        <PieChart className="w-4 h-4 text-[var(--accent)]" />
        <h2 className="text-sm font-bold text-[var(--fg)] tracking-tight">
          Lead Status
        </h2>
      </div>

      {/* Main Donut Content & Legend */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center mt-3">
        {/* Donut Chart Canvas */}
        <div className="relative flex items-center justify-center">
          <svg width="150" height="150" viewBox="0 0 150 150" className="transform -rotate-90">
            {/* Background ring */}
            <circle
              cx="75"
              cy="75"
              r={radius}
              fill="transparent"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth={strokeWidth}
            />

            {/* Segment arcs */}
            {statusData.map((item, idx) => {
              if (item.percent === 0) return null;
              const strokeDasharray = `${(item.percent / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
              accumulatedPercent += item.percent;

              return (
                <circle
                  key={idx}
                  cx="75"
                  cy="75"
                  r={radius}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-500 hover:opacity-85 cursor-pointer"
                />
              );
            })}
          </svg>

          {/* Donut Center Counter */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="font-mono text-2xl font-bold text-[var(--fg)]">
              {totalLeads}
            </span>
            <span className="text-[10px] text-[var(--fg-muted)] font-medium">
              Total Leads
            </span>
          </div>
        </div>

        {/* Legend Breakdown List */}
        <div className="space-y-2 text-xs">
          {statusData.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between gap-2 py-0.5">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium text-[var(--fg-muted)]">{item.name}</span>
              </div>
              <div className="flex items-center gap-3 font-mono">
                <span className="text-[var(--fg-subtle)] text-[11px]">{item.percent}%</span>
                <span className="font-bold text-[var(--fg)] w-4 text-right">{item.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
