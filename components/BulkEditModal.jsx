"use client";

import React, { useState, useEffect } from "react";
import { X, Edit3, Loader2, Calendar } from "lucide-react";
import ThemeDatePicker from "@/components/ThemeDatePicker";

export default function BulkEditModal({
  isOpen,
  onClose,
  columns = [],
  selectedCount = 0,
  onConfirmBulkEdit,
}) {
  const [selectedColId, setSelectedColId] = useState("");
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    React.startTransition(() => {
      const initialCol = columns.length ? columns[0].id : "";
      setSelectedColId(initialCol);
      setValue("");
      setErrorMsg("");
      setSubmitting(false);
    });
  }, [isOpen, columns]);

  const targetCol = columns.find((c) => c.id === selectedColId);

  const handleSelectColumnChange = (newColId) => {
    setSelectedColId(newColId);
    const colObj = columns.find((c) => c.id === newColId);
    if (colObj) {
      if (colObj.type === "checkbox") {
        setValue(false);
      } else if (colObj.type === "dropdown" && colObj.options?.length) {
        const firstOpt = colObj.options[0];
        const label = typeof firstOpt === "object" && firstOpt !== null ? firstOpt.label : String(firstOpt);
        setValue(label || "");
      } else {
        setValue("");
      }
    }
  };

  if (!isOpen || !targetCol) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    let finalVal = value;
    if (targetCol.type === "number") {
      if (value !== "" && isNaN(Number(value))) {
        setErrorMsg("Please enter a valid number.");
        return;
      }
      finalVal = value !== "" ? Number(value) : "";
    } else if (targetCol.type === "checkbox") {
      finalVal = Boolean(value);
    }

    try {
      setSubmitting(true);
      await onConfirmBulkEdit({
        columnId: targetCol.id,
        value: finalVal,
      });
      onClose();
    } catch (err) {
      setErrorMsg(err.message || "Bulk update failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-xl border shadow-xl flex flex-col p-6 gap-5"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)",
          color: "var(--fg)",
        }}
      >
        <div className="flex items-center justify-between border-b pb-3 border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-[var(--accent)]" />
            <h3 className="font-display text-xl font-semibold">Bulk Edit Records</h3>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1 rounded-md hover:opacity-70 transition-opacity focus:outline-hidden"
            style={{ color: "var(--fg-muted)" }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div
            className="p-3 rounded-lg text-xs font-medium border"
            style={{
              backgroundColor: "var(--danger-bg)",
              borderColor: "var(--danger)",
              color: "var(--danger)",
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-xs font-medium flex items-center justify-between">
            <span className="text-[var(--fg-muted)]">Target Selected Rows:</span>
            <span className="font-mono font-bold text-[var(--accent)]">{selectedCount} rows</span>
          </div>

          {/* Select Column */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
              Choose Target Field *
            </label>
            <select
              value={selectedColId}
              onChange={(e) => handleSelectColumnChange(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border bg-[var(--surface-2)] border-[var(--border)] focus:outline-hidden focus:border-[var(--accent)] transition-all cursor-pointer"
            >
              {columns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Editor Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
              New Value for &quot;{targetCol.name}&quot; *
            </label>

            {targetCol.type === "longText" ? (
              <textarea
                rows={3}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={`Enter new ${targetCol.name}...`}
                className="px-3 py-2 text-sm rounded-lg border bg-[var(--surface-2)] border-[var(--border)] focus:outline-hidden focus:border-[var(--accent)] transition-all"
              />
            ) : targetCol.type === "number" ? (
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={`Enter new numeric value...`}
                className="px-3 py-2 text-sm rounded-lg border bg-[var(--surface-2)] border-[var(--border)] focus:outline-hidden focus:border-[var(--accent)] font-mono transition-all"
              />
            ) : targetCol.type === "date" ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="w-full px-3 py-2 text-sm rounded-lg border bg-[var(--surface-2)] border-[var(--border)] focus:outline-hidden focus:border-[var(--accent)] font-mono text-left flex items-center justify-between cursor-pointer"
                >
                  <span className={value ? "text-[var(--fg)]" : "text-[var(--fg-subtle)]"}>
                    {value || "Select date..."}
                  </span>
                  <Calendar className="w-4 h-4 text-[var(--accent)] shrink-0" />
                </button>
                {showDatePicker && (
                  <div className="absolute top-full left-0 mt-1 z-50">
                    <ThemeDatePicker
                      value={value}
                      onChange={(newVal) => setValue(newVal)}
                      showTime={false}
                      onConfirm={() => setShowDatePicker(false)}
                      onCancel={() => setShowDatePicker(false)}
                    />
                  </div>
                )}
              </div>
            ) : targetCol.type === "datetime" ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="w-full px-3 py-2 text-sm rounded-lg border bg-[var(--surface-2)] border-[var(--border)] focus:outline-hidden focus:border-[var(--accent)] font-mono text-left flex items-center justify-between cursor-pointer"
                >
                  <span className={value ? "text-[var(--fg)]" : "text-[var(--fg-subtle)]"}>
                    {value || "Select date & time..."}
                  </span>
                  <Calendar className="w-4 h-4 text-[var(--accent)] shrink-0" />
                </button>
                {showDatePicker && (
                  <div className="absolute top-full left-0 mt-1 z-50">
                    <ThemeDatePicker
                      value={value}
                      onChange={(newVal) => setValue(newVal)}
                      showTime={true}
                      onConfirm={() => setShowDatePicker(false)}
                      onCancel={() => setShowDatePicker(false)}
                    />
                  </div>
                )}
              </div>
            ) : targetCol.type === "dropdown" ? (
              <select
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border bg-[var(--surface-2)] border-[var(--border)] focus:outline-hidden focus:border-[var(--accent)] transition-all cursor-pointer"
              >
                {targetCol.options?.map((opt, idx) => {
                  const optLabel = typeof opt === "object" && opt !== null ? opt.label : String(opt);
                  return (
                    <option key={`${optLabel}-${idx}`} value={optLabel}>
                      {optLabel}
                    </option>
                  );
                })}
              </select>
            ) : targetCol.type === "checkbox" ? (
              <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]">
                <input
                  type="checkbox"
                  checked={!!value}
                  onChange={(e) => setValue(e.target.checked)}
                  className="w-4 h-4 accent-[var(--accent)] rounded-xs"
                />
                <span className="text-xs font-medium text-[var(--fg)]">
                  Set as Checked (True)
                </span>
              </label>
            ) : (
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={`Enter new ${targetCol.name}...`}
                className="px-3 py-2 text-sm rounded-lg border bg-[var(--surface-2)] border-[var(--border)] focus:outline-hidden focus:border-[var(--accent)] transition-all"
              />
            )}
          </div>

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
              className="px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
              style={{
                backgroundColor: "var(--accent)",
                color: "var(--accent-fg)",
              }}
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {submitting ? "Updating..." : `Update ${selectedCount} Rows`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
