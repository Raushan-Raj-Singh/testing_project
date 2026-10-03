"use client";

import React from "react";

function hexToRgba(hex, alpha = 0.2) {
  if (!hex || typeof hex !== "string") return null;
  let clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  if (clean.length !== 6) return null;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function PriorityBadge({ value, color }) {
  if (!value) return <span className="text-[var(--fg-subtle)] text-xs">—</span>;

  const config = {
    High: {
      color: "#f87171",
      bg: "rgba(239, 68, 68, 0.2)",
      border: "rgba(239, 68, 68, 0.4)",
      dot: "#ef4444",
    },
    Medium: {
      color: "#fbbf24",
      bg: "rgba(245, 158, 11, 0.2)",
      border: "rgba(245, 158, 11, 0.4)",
      dot: "#f59e0b",
    },
    Low: {
      color: "#34d399",
      bg: "rgba(16, 185, 129, 0.2)",
      border: "rgba(16, 185, 129, 0.4)",
      dot: "#10b981",
    },
  };

  const valLower = String(value).trim().toLowerCase();

  let textColor = null;
  let bgColor = null;
  let borderColor = null;
  let dotColor = null;

  if (color) {
    const bgRgba = hexToRgba(color, 0.2);
    const borderRgba = hexToRgba(color, 0.4);
    if (bgRgba && borderRgba) {
      textColor = color;
      bgColor = bgRgba;
      borderColor = borderRgba;
      dotColor = color;
    }
  }

  if (!bgColor) {
    const matchedKey = Object.keys(config).find((k) => k.toLowerCase() === valLower);
    const fallback = config[matchedKey] || {
      color: "#34d399",
      bg: "rgba(16, 185, 129, 0.2)",
      border: "rgba(16, 185, 129, 0.4)",
      dot: "#10b981",
    };

    textColor = fallback.color;
    bgColor = fallback.bg;
    borderColor = fallback.border;
    dotColor = fallback.dot;
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full border shadow-xs transition-all"
      style={{
        color: textColor,
        backgroundColor: bgColor,
        borderColor: borderColor,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: dotColor }}
      />
      {value}
    </span>
  );
}
