"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Palette } from "lucide-react";
import {
  normalizeOption,
  getContrastTextColor,
  DEFAULT_OPTION_PALETTE,
} from "@/utils/dropdownOptions";

const COLUMN_TYPES = [
  { label: "Text", value: "text" },
  { label: "Long Text (Popup)", value: "longText" },
  { label: "Number", value: "number" },
  { label: "Date", value: "date" },
  { label: "Date & Time", value: "datetime" },
  { label: "Dropdown", value: "dropdown" },
  { label: "Checkbox", value: "checkbox" },
  { label: "Phone", value: "phone" },
];

export default function AddColumnModal({
  isOpen,
  onClose,
  onSave,
  existingColumns = [],
  editingColumn = null, // null for create mode, or column object for edit mode
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("text");
  // Array of { label: string, color: string }
  const [options, setOptions] = useState([
    { label: "Option 1", color: "#3b82f6" },
    { label: "Option 2", color: "#10b981" },
  ]);
  const [newOptionText, setNewOptionText] = useState("");
  const [newOptionColor, setNewOptionColor] = useState("#3b82f6");
  const [isFollowup, setIsFollowup] = useState(false);
  const [isPriority, setIsPriority] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    React.startTransition(() => {
      if (editingColumn) {
        setName(editingColumn.name || "");
        setType(editingColumn.type || "text");
        const rawOpts = editingColumn.options?.length ? editingColumn.options : ["Option 1"];
        setOptions(rawOpts.map((opt, i) => normalizeOption(opt, i)));
        setIsFollowup(editingColumn.special === "followup");
        setIsPriority(editingColumn.special === "priority");
      } else {
        setName("");
        setType("text");
        setOptions([
          { label: "Option 1", color: "#3b82f6" },
          { label: "Option 2", color: "#10b981" },
        ]);
        setIsFollowup(false);
        setIsPriority(false);
      }
      setNewOptionText("");
      setNewOptionColor(DEFAULT_OPTION_PALETTE[0]);
      setError("");
    });
  }, [editingColumn, isOpen]);

  if (!isOpen) return null;

  const handleAddOption = (e) => {
    if (e) e.preventDefault();
    setError("");

    const trimmed = newOptionText.trim();
    if (!trimmed) {
      setError("Option text cannot be empty.");
      return;
    }

    // Check duplicate option case-insensitively
    const exists = options.some(
      (opt) => opt.label.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setError(`Option "${trimmed}" already exists.`);
      return;
    }

    const nextColor = newOptionColor || DEFAULT_OPTION_PALETTE[options.length % DEFAULT_OPTION_PALETTE.length];
    setOptions([...options, { label: trimmed, color: nextColor }]);
    setNewOptionText("");
    // Cycle to next default color for convenience
    setNewOptionColor(
      DEFAULT_OPTION_PALETTE[(options.length + 1) % DEFAULT_OPTION_PALETTE.length]
    );
  };

  const handleRemoveOption = (index) => {
    if (options.length <= 1) {
      setError("Dropdown must have at least one option.");
      return;
    }
    setError("");
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionColorChange = (index, newColor) => {
    const updated = [...options];
    updated[index] = { ...updated[index], color: newColor };
    setOptions(updated);
  };

  const handleOptionLabelChange = (index, newLabel) => {
    const updated = [...options];
    updated[index] = { ...updated[index], label: newLabel };
    setOptions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Column name is required.");
      return;
    }

    // Check duplicate name (case insensitive, ignoring self if editing)
    const duplicate = existingColumns.find(
      (c) =>
        c.name.toLowerCase() === trimmedName.toLowerCase() &&
        (!editingColumn || c.id !== editingColumn.id)
    );
    if (duplicate) {
      setError(`A column named "${trimmedName}" already exists.`);
      return;
    }

    let validOptions = [];
    if (type === "dropdown") {
      // Validate options: no empty labels, no case-insensitive duplicates
      const seen = new Set();
      for (const opt of options) {
        const label = opt.label.trim();
        if (!label) continue;
        const lower = label.toLowerCase();
        if (seen.has(lower)) {
          setError(`Duplicate option detected: "${label}". Each option must be unique.`);
          return;
        }
        seen.add(lower);
        validOptions.push({
          label,
          color: opt.color || "#3b82f6",
        });
      }

      if (validOptions.length === 0) {
        setError("Please provide at least one valid non-empty dropdown option.");
        return;
      }
    }

    try {
      setSubmitting(true);
      await onSave({
        name: trimmedName,
        type,
        options: validOptions,
        isFollowup: (type === "date" || type === "datetime") ? isFollowup : false,
        isPriority: type === "dropdown" ? isPriority : false,
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save column.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-xl border shadow-xl flex flex-col p-6 gap-5 max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)",
          color: "var(--fg)",
        }}
      >
        <div className="flex items-center justify-between border-b pb-3 border-[var(--border)]">
          <h3 className="font-display text-xl font-semibold">
            {editingColumn ? `Edit Column "${editingColumn.name}"` : "+ Add New Column"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:opacity-70 transition-opacity"
            style={{ color: "var(--fg-muted)" }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div
            className="p-3 rounded-lg text-xs font-medium border"
            style={{
              backgroundColor: "var(--danger-bg)",
              borderColor: "var(--danger)",
              color: "var(--danger)",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Column Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
              Column Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Budget, Lead Source, City"
              className="px-3 py-2 text-sm rounded-lg border bg-[var(--surface-2)] border-[var(--border)] focus:outline-hidden focus:border-[var(--accent)] transition-all"
            />
          </div>

          {/* Column Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
              Column Type *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border bg-[var(--surface-2)] border-[var(--border)] focus:outline-hidden focus:border-[var(--accent)] transition-all cursor-pointer"
            >
              {COLUMN_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Options Editor (if type === 'dropdown') */}
          {type === "dropdown" && (
            <div className="flex flex-col gap-3 p-3.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
                  Dropdown Options & Colors *
                </label>
                <span className="text-[11px] text-[var(--fg-subtle)]">
                  {options.length} {options.length === 1 ? "option" : "options"}
                </span>
              </div>

              {/* Existing Chips View */}
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1 p-1">
                {options.map((option, idx) => {
                  const textColor = getContrastTextColor(option.color);
                  return (
                    <div
                      key={idx}
                      className="group inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-semibold shadow-xs border transition-all"
                      style={{
                        backgroundColor: option.color,
                        borderColor: "rgba(255, 255, 255, 0.2)",
                        color: textColor,
                      }}
                    >
                      {/* Color picker dot / input */}
                      <label
                        className="relative cursor-pointer flex items-center justify-center shrink-0 w-3.5 h-3.5 rounded-full border border-black/20 overflow-hidden hover:scale-110 transition-transform"
                        title="Change option color"
                      >
                        <input
                          type="color"
                          value={option.color}
                          onChange={(e) => handleOptionColorChange(idx, e.target.value)}
                          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                        />
                        <span
                          className="w-full h-full rounded-full"
                          style={{ backgroundColor: option.color }}
                        />
                      </label>

                      {/* Option label input */}
                      <input
                        type="text"
                        value={option.label}
                        onChange={(e) => handleOptionLabelChange(idx, e.target.value)}
                        placeholder="Option label"
                        className="bg-transparent border-none outline-hidden text-xs font-semibold w-20 sm:w-24 focus:w-28 transition-all px-0"
                        style={{ color: textColor }}
                      />

                      {/* Remove Option Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="p-0.5 rounded-full hover:bg-black/20 transition-colors ml-0.5"
                        style={{ color: textColor }}
                        title="Remove Option"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Add New Option Input & Color Picker */}
              <div className="pt-2 border-t border-[var(--border)] flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1 flex items-center">
                  <input
                    type="text"
                    value={newOptionText}
                    onChange={(e) => setNewOptionText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddOption();
                      }
                    }}
                    placeholder="Enter option label... (e.g. VIP, In Review)"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border bg-[var(--surface)] border-[var(--border)] focus:outline-hidden focus:border-[var(--accent)] text-[var(--fg)]"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                    <input
                      type="color"
                      id="new-option-color-input"
                      value={newOptionColor}
                      onChange={(e) => setNewOptionColor(e.target.value)}
                      className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                      title="Select background color"
                    />
                    <label
                      htmlFor="new-option-color-input"
                      className="text-[11px] font-mono uppercase text-[var(--fg-muted)] cursor-pointer"
                    >
                      {newOptionColor}
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                    style={{
                      backgroundColor: "var(--accent)",
                      color: "var(--accent-fg)",
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>

              {/* Live Preview if typing */}
              {newOptionText.trim() && (
                <div className="flex items-center gap-2 text-xs text-[var(--fg-muted)] pt-1">
                  <span className="text-[11px]">Preview:</span>
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-xs border"
                    style={{
                      backgroundColor: newOptionColor,
                      borderColor: "rgba(255, 255, 255, 0.2)",
                      color: getContrastTextColor(newOptionColor),
                    }}
                  >
                    {newOptionText.trim()}
                    <X className="w-3 h-3 opacity-60" />
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Checkbox "Use as Follow-up Date" (if type === 'date' || type === 'datetime') */}
          {(type === "date" || type === "datetime") && (
            <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]">
              <input
                type="checkbox"
                checked={isFollowup}
                onChange={(e) => setIsFollowup(e.target.checked)}
                className="w-4 h-4 accent-[var(--accent)] rounded-xs"
              />
              <span className="text-xs font-medium text-[var(--fg)]">
                Use as Follow-up Date (enables Follow-up categorization & badge styling)
              </span>
            </label>
          )}

          {/* Checkbox "Use as Priority" (if type === 'dropdown') */}
          {type === "dropdown" && (
            <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]">
              <input
                type="checkbox"
                checked={isPriority}
                onChange={(e) => setIsPriority(e.target.checked)}
                className="w-4 h-4 accent-[var(--accent)] rounded-xs"
              />
              <span className="text-xs font-medium text-[var(--fg)]">
                Use as Priority (enables row border dot & High/Medium/Low priority sorting)
              </span>
            </label>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)] mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold rounded-lg border transition-all"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface)",
                color: "var(--fg)",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold rounded-lg transition-all"
              style={{
                backgroundColor: "var(--accent)",
                color: "var(--accent-fg)",
              }}
            >
              {submitting
                ? "Saving..."
                : editingColumn
                ? "Save Changes"
                : "Create Column"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
