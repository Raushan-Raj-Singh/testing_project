"use client";

import React, { useState } from "react";
import { X, Plus, Calendar, CheckCircle2 } from "lucide-react";
import ThemeDatePicker from "@/components/ThemeDatePicker";
import { normalizeOption, getContrastTextColor } from "@/utils/dropdownOptions";

export default function MobileAddLeadModal({
  isOpen,
  onClose,
  columns = [],
  onAddLead,
}) {
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeDatePickerField, setActiveDatePickerField] = useState(null);

  if (!isOpen) return null;

  const handleChange = (fieldId, value) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      // Construct full data object with defaults for missing fields
      const finalData = {};
      columns.forEach((col) => {
        const val = formData[col.id];
        if (col.type === "checkbox") {
          finalData[col.id] = Boolean(val);
        } else {
          finalData[col.id] = val === undefined || val === null ? "" : val;
        }
      });

      await onAddLead(finalData);
      setFormData({});
      onClose();
    } catch (err) {
      console.error("Add Lead error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#111827] border-t sm:border border-[var(--border)] rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--surface-2)]/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
              <Plus className="w-4 h-4 stroke-[3]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--fg)]">Add New Lead</h2>
              <p className="text-[11px] text-[var(--fg-subtle)]">Enter details for the new lead record</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
          {columns.map((column) => {
            const colId = column.id;
            const colName = column.name;
            const colType = column.type || "text";
            const val = formData[colId] === undefined || formData[colId] === null ? "" : formData[colId];

            return (
              <div key={colId} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[var(--fg)] flex items-center gap-1">
                    {colName}
                    {column.special && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--primary)]/15 text-[var(--primary)] uppercase font-mono">
                        {column.special}
                      </span>
                    )}
                  </label>
                  <span className="text-[10px] text-[var(--fg-subtle)] font-mono">
                    {colType}
                  </span>
                </div>

                {/* Dynamic Editor by Column Type */}
                {colType === "dropdown" ? (
                  (() => {
                    const normalizedOpts = (column.options || []).map((opt, i) =>
                      normalizeOption(opt, i)
                    );
                    const currentSelected = normalizedOpts.find(
                      (opt) => opt.label.toLowerCase() === String(val).toLowerCase()
                    );

                    return (
                      <div className="flex flex-col gap-1.5">
                        <select
                          value={val}
                          onChange={(e) => handleChange(colId, e.target.value)}
                          className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border bg-[var(--surface-2)] border-[var(--border)] text-[var(--fg)] text-xs font-medium focus:outline-hidden focus:border-[var(--primary)] cursor-pointer"
                        >
                          <option value="">Select {colName}...</option>
                          {normalizedOpts.map((opt, idx) => (
                            <option key={`${opt.label}-${idx}`} value={opt.label}>
                              {opt.label}
                            </option>
                          ))}
                        </select>

                        {currentSelected && (
                          <div className="flex items-center gap-2 pt-0.5">
                            <span
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-xs border"
                              style={{
                                backgroundColor: currentSelected.color,
                                borderColor: "rgba(255, 255, 255, 0.2)",
                                color: getContrastTextColor(currentSelected.color),
                              }}
                            >
                              {currentSelected.label}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : colType === "checkbox" ? (
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--primary)] transition-all min-h-[44px]">
                    <input
                      type="checkbox"
                      checked={Boolean(val)}
                      onChange={(e) => handleChange(colId, e.target.checked)}
                      className="w-5 h-5 accent-[var(--primary)] rounded-xs cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-[var(--fg)]">
                      {Boolean(val) ? "Yes / Checked" : "No / Unchecked"}
                    </span>
                  </label>
                ) : colType === "date" ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveDatePickerField(
                          activeDatePickerField === colId ? null : colId
                        )
                      }
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border bg-[var(--surface-2)] border-[var(--border)] text-[var(--fg)] font-mono text-left text-xs flex items-center justify-between hover:border-[var(--primary)] transition-all cursor-pointer"
                    >
                      <span className={val ? "text-[var(--fg)]" : "text-[var(--fg-subtle)]"}>
                        {val || "Select date (YYYY-MM-DD)..."}
                      </span>
                      <Calendar className="w-4 h-4 text-[var(--primary)] shrink-0" />
                    </button>
                    {activeDatePickerField === colId && (
                      <div className="absolute top-full left-0 mt-1 z-50 w-full">
                        <ThemeDatePicker
                          value={String(val)}
                          onChange={(newVal) => handleChange(colId, newVal)}
                          showTime={false}
                          onConfirm={() => setActiveDatePickerField(null)}
                          onCancel={() => setActiveDatePickerField(null)}
                        />
                      </div>
                    )}
                  </div>
                ) : colType === "datetime" ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveDatePickerField(
                          activeDatePickerField === colId ? null : colId
                        )
                      }
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border bg-[var(--surface-2)] border-[var(--border)] text-[var(--fg)] font-mono text-left text-xs flex items-center justify-between hover:border-[var(--primary)] transition-all cursor-pointer"
                    >
                      <span className={val ? "text-[var(--fg)]" : "text-[var(--fg-subtle)]"}>
                        {val || "Select date & time (YYYY-MM-DDTHH:mm)..."}
                      </span>
                      <Calendar className="w-4 h-4 text-[var(--primary)] shrink-0" />
                    </button>
                    {activeDatePickerField === colId && (
                      <div className="absolute top-full left-0 mt-1 z-50 w-full">
                        <ThemeDatePicker
                          value={String(val)}
                          onChange={(newVal) => handleChange(colId, newVal)}
                          showTime={true}
                          onConfirm={() => setActiveDatePickerField(null)}
                          onCancel={() => setActiveDatePickerField(null)}
                        />
                      </div>
                    )}
                  </div>
                ) : colType === "number" ? (
                  <input
                    type="number"
                    value={val}
                    onChange={(e) => handleChange(colId, e.target.value)}
                    placeholder={`Enter ${colName.toLowerCase()}...`}
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border bg-[var(--surface-2)] border-[var(--border)] text-[var(--fg)] text-xs font-mono focus:outline-hidden focus:border-[var(--primary)]"
                  />
                ) : colType === "phone" ? (
                  <input
                    type="tel"
                    value={val}
                    onChange={(e) => handleChange(colId, e.target.value)}
                    placeholder={`Enter phone number...`}
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border bg-[var(--surface-2)] border-[var(--border)] text-[var(--fg)] text-xs font-mono focus:outline-hidden focus:border-[var(--primary)]"
                  />
                ) : colType === "longText" ? (
                  <textarea
                    rows={3}
                    value={val}
                    onChange={(e) => handleChange(colId, e.target.value)}
                    placeholder={`Enter ${colName.toLowerCase()}...`}
                    className="w-full px-3.5 py-2.5 rounded-xl border bg-[var(--surface-2)] border-[var(--border)] text-[var(--fg)] text-xs focus:outline-hidden focus:border-[var(--primary)] resize-none"
                  />
                ) : (
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => handleChange(colId, e.target.value)}
                    placeholder={`Enter ${colName.toLowerCase()}...`}
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border bg-[var(--surface-2)] border-[var(--border)] text-[var(--fg)] text-xs focus:outline-hidden focus:border-[var(--primary)]"
                  />
                )}
              </div>
            );
          })}

          {/* Footer Submit Buttons */}
          <div className="pt-4 border-t border-[var(--border)] flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-all min-h-[44px] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-xs font-bold rounded-xl bg-[var(--primary)] text-[#0b0f17] hover:bg-[var(--primary-hover)] transition-all flex items-center gap-2 shadow-md disabled:opacity-50 min-h-[44px] cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? "Creating Lead..." : "Save Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
