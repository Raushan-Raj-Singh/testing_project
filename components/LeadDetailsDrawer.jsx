"use client";

import React, { useState, useEffect } from "react";
import StatusBadge from "@/components/StatusBadge";
import PriorityBadge from "@/components/PriorityBadge";
import {
  X,
  Edit2,
  Phone,
  Mail,
  Calendar,
  MoreVertical,
  Save,
  CheckCircle2,
} from "lucide-react";

export default function LeadDetailsDrawer({
  isOpen,
  onClose,
  leadRow,
  columns = [],
  onSaveLead,
}) {
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (leadRow) {
      setFormData({ ...(leadRow.data || leadRow) });
    } else {
      setFormData({});
    }
  }, [leadRow]);

  if (!isOpen || !leadRow) return null;

  const statusCol = columns.find(
    (c) =>
      c.special === "status" ||
      c.id === "status" ||
      (c.type === "dropdown" && c.name.toLowerCase() === "status")
  );
  const priorityCol = columns.find((c) => c.special === "priority");
  const followupCol = columns.find((c) => c.special === "followup");
  const notesCol = columns.find(
    (c) =>
      c.id === "notes" ||
      c.name.toLowerCase() === "notes" ||
      c.type === "longText"
  );

  // Field extractors
  const leadId = leadRow._rowId || leadRow._id || "L001";
  const leadName = formData.name || formData.Name || formData[columns[0]?.id] || "Unnamed Lead";
  const project = formData.project || formData.Project || "N/A";
  const phone = formData.phone || formData.Phone || "";
  const email = formData.email || formData.Email || "";
  const statusVal = statusCol ? formData[statusCol.id] : "New";
  const priorityVal = priorityCol ? formData[priorityCol.id] : "Low";
  const followupVal = followupCol ? formData[followupCol.id] : "";
  const notesVal = notesCol ? formData[notesCol.id] || "" : formData.notes || "";

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

  const initials = leadName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#111827] border-l border-[var(--border)] h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-[var(--primary)]" />
            <h2 className="text-base font-bold text-[var(--fg)]">Lead Details</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body Scroll Container */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Lead Summary Header Card */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[var(--primary)] text-[#0b0f17] font-bold text-base flex items-center justify-center shadow-md">
                {initials || "LD"}
              </div>
              <div>
                <h3 className="font-bold text-base text-[var(--fg)]">{leadName}</h3>
                <p className="text-xs font-mono text-[var(--fg-muted)]">
                  Lead ID: {leadId.slice(-6).toUpperCase()}
                </p>
              </div>
            </div>
            <StatusBadge value={statusVal} />
          </div>

          {/* Core Fields Form Grid */}
          <div className="space-y-3 text-xs">
            {/* Project */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)] mb-1">
                Project
              </label>
              <input
                type="text"
                value={project}
                onChange={(e) => handleChange("project", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-[var(--surface)] border-[var(--border)] text-[var(--fg)] focus:outline-hidden focus:border-[var(--primary)] font-medium"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)] mb-1">
                Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-[var(--surface)] border-[var(--border)] text-[var(--fg)] font-mono focus:outline-hidden focus:border-[var(--primary)]"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)] mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-[var(--surface)] border-[var(--border)] text-[var(--fg)] font-mono focus:outline-hidden focus:border-[var(--primary)]"
              />
            </div>

            {/* Follow-up Date */}
            {followupCol && (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)] mb-1">
                  Follow-up Date
                </label>
                <input
                  type="date"
                  value={followupVal}
                  onChange={(e) => handleChange(followupCol.id, e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-[var(--surface)] border-[var(--border)] text-[var(--fg)] font-mono focus:outline-hidden focus:border-[var(--primary)]"
                  style={{ colorScheme: "dark" }}
                />
              </div>
            )}

            {/* Status Dropdown */}
            {statusCol && (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)] mb-1">
                  Status
                </label>
                <select
                  value={statusVal}
                  onChange={(e) => handleChange(statusCol.id, e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-[var(--surface)] border-[var(--border)] text-[var(--fg)] focus:outline-hidden focus:border-[var(--primary)] font-medium cursor-pointer"
                >
                  {(statusCol.options || ["New", "Follow-up", "Qualified", "Closed", "Lost"]).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Priority Dropdown */}
            {priorityCol && (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)] mb-1">
                  Priority
                </label>
                <select
                  value={priorityVal}
                  onChange={(e) => handleChange(priorityCol.id, e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-[var(--surface)] border-[var(--border)] text-[var(--fg)] focus:outline-hidden focus:border-[var(--primary)] font-medium cursor-pointer"
                >
                  {(priorityCol.options || ["Low", "Medium", "High"]).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Notes Field */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)] mb-1">
                Notes & Remarks
              </label>
              <textarea
                rows="3"
                value={notesVal}
                onChange={(e) => handleChange(notesCol ? notesCol.id : "notes", e.target.value)}
                placeholder="No notes added yet..."
                className="w-full px-3 py-2 rounded-lg border bg-[var(--surface)] border-[var(--border)] text-[var(--fg)] focus:outline-hidden focus:border-[var(--primary)] resize-none"
              />
            </div>
          </div>

          {/* Quick Actions Grid matching Reference Image */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)] mb-2">
              Quick Actions
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <a
                href={phone ? `tel:${phone}` : "#"}
                onClick={(e) => !phone && e.preventDefault()}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.12)] text-[var(--green)] font-semibold text-xs transition-all hover:bg-[rgba(16,185,129,0.25)]"
              >
                <Phone className="w-4 h-4" />
                Call
              </a>

              <a
                href={email ? `mailto:${email}` : "#"}
                onClick={(e) => !email && e.preventDefault()}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-[rgba(59,130,246,0.3)] bg-[rgba(59,130,246,0.12)] text-[var(--blue)] font-semibold text-xs transition-all hover:bg-[rgba(59,130,246,0.25)]"
              >
                <Mail className="w-4 h-4" />
                Email
              </a>

              <button
                type="button"
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-[rgba(168,85,247,0.3)] bg-[rgba(168,85,247,0.12)] text-[var(--purple)] font-semibold text-xs transition-all hover:bg-[rgba(168,85,247,0.25)]"
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
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-[var(--primary)] text-[#0b0f17] hover:bg-[var(--primary-hover)] transition-all flex items-center gap-1.5 shadow-md disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
