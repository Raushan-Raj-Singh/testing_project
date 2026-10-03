"use client";

import React, { useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import PriorityBadge from "@/components/PriorityBadge";
import { getFollowupCategory } from "@/utils/followup";
import { normalizeOption } from "@/utils/dropdownOptions";
import {
  MoreVertical,
  Phone,
  Mail,
  Edit3,
  Trash2,
  Calendar,
  User,
  Plus,
  RotateCcw,
  FileX,
  X,
  Eye,
} from "lucide-react";

export default function MobileLeadView({
  rows = [],
  columns = [],
  loading = false,
  error = null,
  selectedRows = [],
  onSelectionChanged,
  onOpenDrawer,
  onRowDelete,
  onAddRow,
  onResetFilters,
  onBulkEdit,
  onDeleteSelected,
  onClearSelection,
  isDeletingSelected = false,
}) {
  const [activeMenuRow, setActiveMenuRow] = useState(null);

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
  const priorityCol = columns.find((c) => c.special === "priority");
  const followupCol = columns.find((c) => c.special === "followup");

  // Secondary info columns (e.g. project, company, etc.)
  const secondaryCols = columns.filter(
    (c) =>
      c.id !== nameCol?.id &&
      c.id !== phoneCol?.id &&
      c.id !== emailCol?.id &&
      c.id !== statusCol?.id &&
      c.id !== priorityCol?.id &&
      c.id !== followupCol?.id
  );

  const isRowSelected = (rowId) => {
    return selectedRows.some((r) => (r._rowId || r._id) === rowId);
  };

  const handleToggleRowSelect = (row) => {
    const rowId = row._rowId || row._id;
    if (isRowSelected(rowId)) {
      const updated = selectedRows.filter((r) => (r._rowId || r._id) !== rowId);
      onSelectionChanged(updated);
    } else {
      const updated = [...selectedRows, row];
      onSelectionChanged(updated);
    }
  };

  // Follow-up Theme helper matching LeadTable
  const getFollowupTheme = (val) => {
    if (!val) return { text: "No Date", color: "var(--fg-muted)", bg: "var(--surface-2)" };
    const cat = getFollowupCategory(val);
    const themes = {
      Today: { text: "Today", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)", border: "rgba(245, 158, 11, 0.35)" },
      Overdue: { text: "Overdue", color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)", border: "rgba(239, 68, 68, 0.35)" },
      Tomorrow: { text: "Tomorrow", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.15)", border: "rgba(59, 130, 246, 0.35)" },
      Upcoming: { text: "Upcoming", color: "#a855f7", bg: "rgba(168, 85, 247, 0.15)", border: "rgba(168, 85, 247, 0.35)" },
      "No Date": { text: "No Date", color: "var(--fg-muted)", bg: "var(--surface-2)", border: "var(--border)" },
    };
    return themes[cat] || themes["No Date"];
  };

  // Status color lookup helper
  const getStatusColor = (val) => {
    if (!statusCol || !statusCol.options || !val) return null;
    const norm = statusCol.options.map((opt, i) => normalizeOption(opt, i));
    const matched = norm.find((opt) => opt.label.toLowerCase() === String(val).toLowerCase());
    return matched?.color;
  };

  // Priority color lookup helper
  const getPriorityColor = (val) => {
    if (!priorityCol || !priorityCol.options || !val) return null;
    const norm = priorityCol.options.map((opt, i) => normalizeOption(opt, i));
    const matched = norm.find((opt) => opt.label.toLowerCase() === String(val).toLowerCase());
    return matched?.color;
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-3 w-full animate-pulse p-1">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="p-4 rounded-xl bg-[#111827]/80 border border-[var(--border)] flex flex-col gap-3 shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded bg-gray-700/60" />
                <div className="w-32 h-4 rounded bg-gray-700/60" />
              </div>
              <div className="w-16 h-5 rounded-full bg-gray-700/60" />
            </div>
            <div className="w-48 h-3.5 rounded bg-gray-700/40" />
            <div className="flex items-center gap-2 pt-2">
              <div className="w-20 h-6 rounded-full bg-gray-700/50" />
              <div className="w-20 h-6 rounded-full bg-gray-700/50" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-[#111827] border border-[var(--border)] text-center flex flex-col items-center justify-center gap-3 my-2 shadow-xl">
        <div className="p-4 rounded-full bg-[var(--surface-2)] text-[var(--fg-muted)] border border-[var(--border)]">
          <FileX className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-[var(--fg)]">No leads found</h3>
        <p className="text-xs text-[var(--fg-muted)] max-w-xs">
          No records match your active search or filter criteria.
        </p>
        <div className="flex items-center gap-2 mt-2">
          {onResetFilters && (
            <button
              onClick={onResetFilters}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--primary)] flex items-center gap-1.5 min-h-[44px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}
          {onAddRow && (
            <button
              onClick={onAddRow}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-[var(--primary)] text-[#0b0f17] flex items-center gap-1.5 min-h-[44px]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Add Lead
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full relative pb-20">
      {/* Cards List */}
      {rows.map((row, idx) => {
        const rowData = row.data || row;
        const rowId = row._rowId || row._id;
        const selected = isRowSelected(rowId);

        const leadName = nameCol
          ? rowData[nameCol.id] || `Lead #${idx + 1}`
          : rowData[columns[0]?.id] || `Lead #${idx + 1}`;
        const phoneVal = phoneCol ? rowData[phoneCol.id] : "";
        const emailVal = emailCol ? rowData[emailCol.id] : "";
        const statusVal = statusCol ? rowData[statusCol.id] : null;
        const priorityVal = priorityCol ? rowData[priorityCol.id] : null;
        const followupVal = followupCol ? rowData[followupCol.id] : null;

        const followupTheme = getFollowupTheme(followupVal);
        const statusColor = getStatusColor(statusVal);
        const priorityColor = getPriorityColor(priorityVal);

        return (
          <div
            key={rowId}
            className={`p-4 rounded-xl border transition-all shadow-lg flex flex-col gap-3 relative ${
              selected
                ? "bg-[var(--surface-hover)] border-[var(--primary)] shadow-[var(--primary)]/10"
                : "bg-[#111827] border-[var(--border)] hover:border-[var(--border-strong)]"
            }`}
          >
            {/* Card Header Top Row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Checkbox Touch Target */}
                <label className="flex items-center justify-center min-w-[40px] min-h-[40px] cursor-pointer shrink-0 -ml-1">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => handleToggleRowSelect(row)}
                    className="w-5 h-5 accent-[var(--primary)] rounded-xs cursor-pointer"
                  />
                </label>

                {/* Lead Name & ID */}
                <div
                  className="truncate cursor-pointer flex-1"
                  onClick={() => onOpenDrawer && onOpenDrawer(row)}
                >
                  <h3 className="font-bold text-sm text-[var(--fg)] truncate flex items-center gap-2">
                    {leadName}
                  </h3>
                  <p className="text-[11px] font-mono text-[var(--fg-subtle)] truncate">
                    ID: {String(rowId).slice(-6).toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Action Menu Trigger Button */}
              <button
                type="button"
                onClick={() => setActiveMenuRow(activeMenuRow?._id === rowId ? null : row)}
                className="p-2 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Contact & Dynamic Secondary Attributes */}
            <div
              className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[var(--fg-muted)] cursor-pointer"
              onClick={() => onOpenDrawer && onOpenDrawer(row)}
            >
              {phoneVal && (
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--fg)]">
                  <Phone className="w-3.5 h-3.5 text-[var(--green)] shrink-0" />
                  <span>{phoneVal}</span>
                </div>
              )}
              {emailVal && (
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--fg-subtle)] truncate max-w-[200px]">
                  <Mail className="w-3.5 h-3.5 text-[var(--blue)] shrink-0" />
                  <span className="truncate">{emailVal}</span>
                </div>
              )}
              {secondaryCols.slice(0, 2).map((col) => {
                const v = rowData[col.id];
                if (!v) return null;
                return (
                  <div key={col.id} className="text-[11px] font-medium text-[var(--fg-subtle)]">
                    <span className="text-[var(--fg-muted)] font-semibold">{col.name}:</span> {String(v)}
                  </div>
                );
              })}
            </div>

            {/* Status, Priority & Follow-up Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[var(--border)]/60">
              {statusVal && <StatusBadge value={statusVal} color={statusColor} />}
              {priorityVal && <PriorityBadge value={priorityVal} color={priorityColor} />}
              {followupVal && (
                <span
                  className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full flex items-center gap-1 border shadow-xs"
                  style={{
                    color: followupTheme.color,
                    backgroundColor: followupTheme.bg,
                    borderColor: followupTheme.border || "rgba(255,255,255,0.1)",
                  }}
                >
                  <Calendar className="w-3 h-3" />
                  {followupTheme.text}: {followupVal}
                </span>
              )}
            </div>
          </div>
        );
      })}

      {/* Row Action Menu Bottom Sheet */}
      {activeMenuRow && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center p-0 animate-in fade-in duration-200">
          <div className="w-full bg-[#111827] border-t border-[var(--border)] rounded-t-2xl shadow-2xl p-4 flex flex-col gap-2 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h3 className="font-bold text-sm text-[var(--fg)]">
                {nameCol
                  ? (activeMenuRow.data || activeMenuRow)[nameCol.id] || "Lead Actions"
                  : "Lead Actions"}
              </h3>
              <button
                type="button"
                onClick={() => setActiveMenuRow(null)}
                className="p-1 text-[var(--fg-muted)] hover:text-[var(--fg)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                const target = activeMenuRow;
                setActiveMenuRow(null);
                if (onOpenDrawer) onOpenDrawer(target);
              }}
              className="w-full text-left px-4 py-3 rounded-xl hover:bg-[var(--surface-2)] text-xs font-semibold text-[var(--fg)] flex items-center gap-3 transition-colors min-h-[48px]"
            >
              <Eye className="w-4 h-4 text-[var(--primary)]" />
              View & Edit Lead Details
            </button>

            {phoneCol && (activeMenuRow.data || activeMenuRow)[phoneCol.id] && (
              <a
                href={`tel:${(activeMenuRow.data || activeMenuRow)[phoneCol.id]}`}
                onClick={() => setActiveMenuRow(null)}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-[var(--surface-2)] text-xs font-semibold text-[var(--green)] flex items-center gap-3 transition-colors min-h-[48px]"
              >
                <Phone className="w-4 h-4" />
                Call {(activeMenuRow.data || activeMenuRow)[phoneCol.id]}
              </a>
            )}

            {emailCol && (activeMenuRow.data || activeMenuRow)[emailCol.id] && (
              <a
                href={`mailto:${(activeMenuRow.data || activeMenuRow)[emailCol.id]}`}
                onClick={() => setActiveMenuRow(null)}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-[var(--surface-2)] text-xs font-semibold text-[var(--blue)] flex items-center gap-3 transition-colors min-h-[48px]"
              >
                <Mail className="w-4 h-4" />
                Email {(activeMenuRow.data || activeMenuRow)[emailCol.id]}
              </a>
            )}

            <button
              type="button"
              onClick={() => {
                const target = activeMenuRow;
                setActiveMenuRow(null);
                if (onRowDelete) onRowDelete(target);
              }}
              className="w-full text-left px-4 py-3 rounded-xl hover:bg-[var(--danger-bg)] text-xs font-semibold text-[var(--red)] flex items-center gap-3 transition-colors min-h-[48px]"
            >
              <Trash2 className="w-4 h-4" />
              Delete Lead
            </button>
          </div>
        </div>
      )}

      {/* Sticky Bottom Multi-Select Action Bar */}
      {selectedRows.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 p-3 rounded-2xl glass-panel border border-[var(--primary)] shadow-2xl flex items-center justify-between gap-2 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-[var(--primary)] text-[#0b0f17]">
              {selectedRows.length}
            </span>
            <span className="text-xs font-bold text-[var(--fg)] hidden sm:inline">Selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onBulkEdit}
              disabled={isDeletingSelected}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--fg)] hover:border-[var(--primary)] flex items-center gap-1.5 min-h-[44px]"
            >
              <Edit3 className="w-4 h-4 text-[var(--primary)]" />
              Bulk Edit
            </button>

            <button
              onClick={onClearSelection}
              disabled={isDeletingSelected}
              className="px-3 py-2 text-xs font-medium rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--fg-muted)] flex items-center gap-1 min-h-[44px]"
            >
              <X className="w-4 h-4" />
            </button>

            <button
              onClick={onDeleteSelected}
              disabled={isDeletingSelected}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[var(--red)] text-white hover:bg-[#dc2626] flex items-center gap-1.5 shadow-md disabled:opacity-50 min-h-[44px]"
            >
              <Trash2 className="w-4 h-4" />
              {isDeletingSelected ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
