/**
 * Helpers for Dropdown Column Options & Contrast Calculation
 */

// Elegant default palette for options
export const DEFAULT_OPTION_PALETTE = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ef4444", // Rose/Red
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#64748b", // Slate
];

/**
 * Normalizes an option into { label: string, color: string }
 * Supports backward compatibility with string options like "High".
 */
export function normalizeOption(opt, index = 0) {
  if (opt === null || opt === undefined) {
    return { label: "", color: DEFAULT_OPTION_PALETTE[index % DEFAULT_OPTION_PALETTE.length] };
  }

  if (typeof opt === "object") {
    const label = opt.label !== undefined && opt.label !== null ? String(opt.label).trim() : "";
    const color = opt.color && typeof opt.color === "string" ? opt.color.trim() : DEFAULT_OPTION_PALETTE[index % DEFAULT_OPTION_PALETTE.length];
    return { label, color };
  }

  const label = String(opt).trim();
  // Safe default color based on index or simple hash
  const color = getDefaultColorForLabel(label, index);
  return { label, color };
}

/**
 * Helper to safely extract logical string label from an option (object or string)
 */
export function getOptionLabel(opt) {
  if (opt === null || opt === undefined) return "";
  if (typeof opt === "object") return opt.label ? String(opt.label).trim() : "";
  return String(opt).trim();
}

/**
 * Deterministic color generator for string labels if not specified
 */
export function getDefaultColorForLabel(label, fallbackIndex = 0) {
  if (!label) return DEFAULT_OPTION_PALETTE[fallbackIndex % DEFAULT_OPTION_PALETTE.length];

  // Specific common CRM keywords
  const lower = label.toLowerCase();
  if (lower === "high" || lower === "urgent" || lower === "lost" || lower === "critical") return "#ef4444";
  if (lower === "medium" || lower === "in progress" || lower === "pending" || lower === "warning") return "#f59e0b";
  if (lower === "low" || lower === "qualified" || lower === "active" || lower === "won" || lower === "success") return "#10b981";
  if (lower === "new" || lower === "lead") return "#3b82f6";
  if (lower === "follow-up" || lower === "contacted") return "#8b5cf6";
  if (lower === "closed") return "#64748b";

  // Simple string hash for consistent fallback
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = label.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % DEFAULT_OPTION_PALETTE.length;
  return DEFAULT_OPTION_PALETTE[idx];
}

/**
 * Calculates whether white or dark text offers better contrast against a hex background.
 * Returns either "#ffffff" or "#0b0f17".
 */
export function getContrastTextColor(hexColor) {
  if (!hexColor || typeof hexColor !== "string") return "#ffffff";

  let cleanHex = hexColor.replace("#", "").trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split("").map((c) => c + c).join("");
  }
  if (cleanHex.length !== 6) return "#ffffff";

  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) return "#ffffff";

  // ITU-R BT.709 relative luminance formula
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? "#0b0f17" : "#ffffff";
}
