"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";

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
  const [options, setOptions] = useState(["Option 1", "Option 2"]);
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
        setOptions(editingColumn.options?.length ? [...editingColumn.options] : ["Option 1"]);
        setIsFollowup(editingColumn.special === "followup");
        setIsPriority(editingColumn.special === "priority");
      } else {
        setName("");
        setType("text");
        setOptions(["Option 1", "Option 2"]);
        setIsFollowup(false);
        setIsPriority(false);
      }
      setError("");
    });
  }, [editingColumn, isOpen]);

  if (!isOpen) return null;

  const handleAddOption = () => {
    setOptions([...options, `Option ${options.length + 1}`]);
  };

  const handleRemoveOption = (index) => {
    if (options.length <= 1) {
      setError("Dropdown must have at least one option.");
      return;
    }
    const updated = options.filter((_, i) => i !== index);
    setOptions(updated);
  };

  const handleOptionChange = (index, value) => {
    const updated = [...options];
    updated[index] = value;
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
      validOptions = options.map((opt) => opt.trim()).filter((opt) => opt.length > 0);
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
        isFollowup: type === "date" ? isFollowup : false,
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
              disabled={!!editingColumn}
              onChange={(e) => setType(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border bg-[var(--surface-2)] border-[var(--border)] focus:outline-hidden focus:border-[var(--accent)] transition-all disabled:opacity-60"
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
            <div className="flex flex-col gap-2 p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
                  Dropdown Options *
                </label>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-xs font-semibold flex items-center gap-1 text-[var(--accent)] hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Option
                </button>
              </div>

              <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                {options.map((option, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      value={option}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Option ${idx + 1}`}
                      className="flex-1 px-2.5 py-1.5 text-xs rounded-md border bg-[var(--surface)] border-[var(--border)] focus:outline-hidden focus:border-[var(--accent)]"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="p-1 rounded-md text-[var(--danger)] hover:bg-[var(--danger-bg)] transition-colors"
                      title="Remove Option"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Checkbox "Use as Follow-up Date" (if type === 'date') */}
          {type === "date" && (
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
