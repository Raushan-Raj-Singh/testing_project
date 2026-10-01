"use client";

import React from "react";

export default function StatusBadge({ value }) {
  if (!value) return <span className="text-[var(--fg-subtle)] text-xs">—</span>;

  const config = {
    New: {
      color: "#818cf8",
      bg: "rgba(99, 102, 241, 0.15)",
      border: "rgba(99, 102, 241, 0.3)",
      dot: "#6366f1",
    },
    "Follow-up": {
      color: "#c084fc",
      bg: "rgba(168, 85, 247, 0.15)",
      border: "rgba(168, 85, 247, 0.3)",
      dot: "#a855f7",
    },
    Qualified: {
      color: "#34d399",
      bg: "rgba(16, 185, 129, 0.15)",
      border: "rgba(16, 185, 129, 0.3)",
      dot: "#10b981",
    },
    Closed: {
      color: "#94a3b8",
      bg: "rgba(100, 116, 139, 0.15)",
      border: "rgba(100, 116, 139, 0.3)",
      dot: "#64748b",
    },
    Lost: {
      color: "#fb7185",
      bg: "rgba(244, 63, 94, 0.15)",
      border: "rgba(244, 63, 94, 0.3)",
      dot: "#f43f5e",
    },
  };

  const style = config[value] || {
    color: "var(--fg-muted)",
    bg: "var(--surface-2)",
    border: "var(--border)",
    dot: "var(--fg-subtle)",
  };

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border transition-all"
      style={{
        color: style.color,
        backgroundColor: style.bg,
        borderColor: style.border,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: style.dot }}
      />
      {value}
    </span>
  );
}
