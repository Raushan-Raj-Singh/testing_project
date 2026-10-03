import React, { useState, useEffect } from "react";
import StatusBadge from "@/components/StatusBadge";
import PriorityBadge from "@/components/PriorityBadge";
import ThemeDatePicker from "@/components/ThemeDatePicker";
import {
  X,
  Edit2,
  Phone,
  Mail,
  Calendar,
  MoreVertical,
  CheckCircle2,
  Clock,
  Tag,
  CheckSquare,
  Hash,
  AlignLeft,
  Type,
} from "lucide-react";
import {
  normalizeOption,
  getContrastTextColor,
} from "@/utils/dropdownOptions";

export default function LeadDetailsDrawer({
  isOpen,
  onClose,
  leadRow,
  columns = [],
  onSaveLead,
}) {
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [activeDatePickerField, setActiveDatePickerField] = useState(null);

  // Sync formData whenever leadRow updates or changes
  useEffect(() => {
    React.startTransition(() => {
      if (leadRow) {
        setFormData({ ...(leadRow.data || leadRow) });
      } else {
        setFormData({});
      }
      setActiveDatePickerField(null);
    });
  }, [leadRow]);

  if (!isOpen || !leadRow) return null;

  const handleChange = (fieldId, val) => {
    setFormData((prev) => ({ ...prev, [fieldId]: val }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const rowId = leadRow._rowId || leadRow._id;
      await onSaveLead(rowId, formData);
      onClose();
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Derive title, avatar initials, and quick action contacts dynamically
  const nameCol = columns.find(
    (c) => c.id === "name" || c.name.toLowerCase() === "name"
  );
  const phoneCol = columns.find(
    (c) => c.type === "phone" || c.id === "phone" || c.name.toLowerCase() === "phone"
  );
  const emailCol = columns.find(
    (c) => c.id === "email" || c.name.toLowerCase() === "email"
  );
  const statusCol = columns.find(
    (c) =>
      c.special === "status" ||
      c.id === "status" ||
      (c.type === "dropdown" && c.name.toLowerCase() === "status")
  );

  const rawLeadId = leadRow._rowId || leadRow._id || "";
  const leadId = typeof rawLeadId === "string" ? rawLeadId : String(rawLeadId);
  const leadName = nameCol
    ? formData[nameCol.id] || "Unnamed Lead"
    : formData[columns[0]?.id] || "Unnamed Lead";
  const phoneVal = phoneCol ? formData[phoneCol.id] || "" : "";
  const emailVal = emailCol ? formData[emailCol.id] || "" : "";
  const statusVal = statusCol ? formData[statusCol.id] : null;

  const initials = String(leadName)
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "LD";

  const statusColor = statusCol?.options
    ?.map((opt, i) => normalizeOption(opt, i))
    ?.find((opt) => opt.label.toLowerCase() === String(statusVal || "").toLowerCase())?.color;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex items-end sm:items-stretch justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-full sm:max-w-md bg-[#111827] border-t sm:border-t-0 sm:border-l border-[var(--border)] h-[90vh] sm:h-full rounded-t-2xl sm:rounded-t-none flex flex-col justify-between shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-[var(--primary)]" />
            <h2 className="text-base font-bold text-[var(--fg)]">Lead Details</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)] transition-colors focus:outline-hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body Scroll Container */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
          {/* Lead Summary Header Card */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[var(--primary)] text-[#0b0f17] font-bold text-base flex items-center justify-center shadow-md shrink-0">
                {initials}
              </div>
              <div className="truncate">
                <h3 className="font-bold text-base text-[var(--fg)] truncate">{leadName}</h3>
                <p className="text-xs font-mono text-[var(--fg-muted)]">
                  Lead ID: {leadId.slice(-6).toUpperCase() || "RECORD"}
                </p>
              </div>
            </div>
            {statusVal && <StatusBadge value={statusVal} color={statusColor} />}
          </div>

          {/* Fully Dynamic Form Fields Generated from table.columns */}
          <div className="space-y-3.5 text-xs">
            {columns.map((column) => {
              const colId = column.id;
              const colName = column.name;
              const colType = column.type || "text";
              const rawVal = formData[colId];
              const val = rawVal === null || rawVal === undefined ? "" : rawVal;

              return (
                <div key={colId} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)]">
                      {colName}
                    </label>
                    <span className="text-[10px] text-[var(--fg-subtle)] font-mono">
                      {colType}
                    </span>
                  </div>

                  {/* Dynamic Render based on column.type */}
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
                            className="w-full px-3 py-2 rounded-lg border bg-[var(--surface)] border-[var(--border)] text-[var(--fg)] focus:outline-hidden focus:border-[var(--primary)] font-medium cursor-pointer"
                          >
                            <option value="">Select {colName}...</option>
                            {normalizedOpts.map((opt, idx) => (
                              <option key={`${opt.label}-${idx}`} value={opt.label}>
                                {opt.label}
                              </option>
                            ))}
                          </select>

                          {/* Selected Option Color Chip Preview */}
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
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)] transition-all">
                      <input
                        type="checkbox"
                        checked={Boolean(val)}
                        onChange={(e) => handleChange(colId, e.target.checked)}
                        className="w-4 h-4 accent-[var(--primary)] rounded-xs cursor-pointer"
                      />
                      <span className="text-xs font-medium text-[var(--fg)]">
                        {Boolean(val) ? "Checked (True)" : "Unchecked (False)"}
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
                        className="w-full px-3 py-2 rounded-lg border bg-[var(--surface)] border-[var(--border)] text-[var(--fg)] font-mono text-left text-xs flex items-center justify-between hover:border-[var(--primary)] transition-all cursor-pointer"
                      >
                        <span className={val ? "text-[var(--fg)]" : "text-[var(--fg-subtle)]"}>
                          {val || "Select date (YYYY-MM-DD)..."}
                        </span>
                        <Calendar className="w-4 h-4 text-[var(--primary)] shrink-0" />
                      </button>
                      {activeDatePickerField === colId && (
                        <div className="absolute top-full left-0 mt-1 z-50">
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
                        className="w-full px-3 py-2 rounded-lg border bg-[var(--surface)] border-[var(--border)] text-[var(--fg)] font-mono text-left text-xs flex items-center justify-between hover:border-[var(--primary)] transition-all cursor-pointer"
                      >
                        <span className={val ? "text-[var(--fg)]" : "text-[var(--fg-subtle)]"}>
                          {val || "Select date & time (YYYY-MM-DDTHH:mm)..."}
                        </span>
                        <Calendar className="w-4 h-4 text-[var(--primary)] shrink-0" />
                      </button>
                      {activeDatePickerField === colId && (
                        <div className="absolute top-full left-0 mt-1 z-50">
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
                      className="w-full px-3 py-2 rounded-lg border bg-[var(--surface)] border-[var(--border)] text-[var(--fg)] font-mono focus:outline-hidden focus:border-[var(--primary)]"
                    />
                  ) : colType === "phone" ? (
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => handleChange(colId, e.target.value)}
                      placeholder={`Enter phone number...`}
                      className="w-full px-3 py-2 rounded-lg border bg-[var(--surface)] border-[var(--border)] text-[var(--fg)] font-mono focus:outline-hidden focus:border-[var(--primary)]"
                    />
                  ) : colType === "longText" ? (
                    <textarea
                      rows={3}
                      value={val}
                      onChange={(e) => handleChange(colId, e.target.value)}
                      placeholder={`Enter ${colName.toLowerCase()}...`}
                      className="w-full px-3 py-2 rounded-lg border bg-[var(--surface)] border-[var(--border)] text-[var(--fg)] focus:outline-hidden focus:border-[var(--primary)] resize-none"
                    />
                  ) : (
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => handleChange(colId, e.target.value)}
                      placeholder={`Enter ${colName.toLowerCase()}...`}
                      className="w-full px-3 py-2 rounded-lg border bg-[var(--surface)] border-[var(--border)] text-[var(--fg)] focus:outline-hidden focus:border-[var(--primary)]"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Actions Grid */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)] mb-2">
              Quick Actions
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <a
                href={phoneVal ? `tel:${phoneVal}` : "#"}
                onClick={(e) => !phoneVal && e.preventDefault()}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border font-semibold text-xs transition-all ${
                  phoneVal
                    ? "border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.12)] text-[var(--green)] hover:bg-[rgba(16,185,129,0.25)]"
                    : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--fg-subtle)] opacity-40 cursor-not-allowed"
                }`}
              >
                <Phone className="w-4 h-4" />
                Call
              </a>

              <a
                href={emailVal ? `mailto:${emailVal}` : "#"}
                onClick={(e) => !emailVal && e.preventDefault()}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border font-semibold text-xs transition-all ${
                  emailVal
                    ? "border-[rgba(59,130,246,0.3)] bg-[rgba(59,130,246,0.12)] text-[var(--blue)] hover:bg-[rgba(59,130,246,0.25)]"
                    : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--fg-subtle)] opacity-40 cursor-not-allowed"
                }`}
              >
                <Mail className="w-4 h-4" />
                Email
              </a>

              <button
                type="button"
                onClick={() => {
                  const fCol = columns.find((c) => c.special === "followup");
                  if (fCol) setActiveDatePickerField(fCol.id);
                }}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-[rgba(168,85,247,0.3)] bg-[rgba(168,85,247,0.12)] text-[var(--purple)] font-semibold text-xs transition-all hover:bg-[rgba(168,85,247,0.25)] cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                Schedule
              </button>

              <button
                type="button"
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--fg-muted)] font-semibold text-xs transition-all hover:text-[var(--fg)]"
              >
                <MoreVertical className="w-4 h-4" />
                More
              </button>
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-[var(--border)] flex items-center justify-end gap-3 bg-[var(--surface)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-[var(--primary)] text-[#0b0f17] hover:bg-[var(--primary-hover)] transition-all flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
