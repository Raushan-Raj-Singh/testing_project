"use client";

import React from "react";

export default function PriorityBadge({ value }) {
  if (!value) return <span className="text-[var(--fg-subtle)] text-xs">—</span>;

  const config = {
    High: {
      color: "#f87171",
      bg: "rgba(239, 68, 68, 0.15)",
      border: "rgba(239, 68, 68, 0.3)",
    },
    Medium: {
      color: "#fbbf24",
      bg: "rgba(245, 158, 11, 0.15)",
      border: "rgba(245, 158, 11, 0.3)",
    },
    Low: {
      color: "#94a3b8",
      bg: "rgba(100, 116, 139, 0.15)",
      border: "rgba(100, 116, 139, 0.3)",
    },
  };

  const style = config[value] || {
    color: "var(--fg-muted)",
    bg: "var(--surface-2)",
    border: "var(--border)",
  };

  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full border transition-all"
      style={{
        color: style.color,
        backgroundColor: style.bg,
        borderColor: style.border,
      }}
    >
      {value}
    </span>
  );
}
