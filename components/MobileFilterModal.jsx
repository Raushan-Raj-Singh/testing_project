"use client";

import React from "react";
import { X, Filter, RotateCcw, Check } from "lucide-react";

export default function MobileFilterModal({
  isOpen,
  onClose,
  columns = [],
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  followupFilter,
  onFollowupFilterChange,
  onResetFilters,
}) {
  if (!isOpen) return null;

  const statusCol = columns.find(
    (c) => c.special === "status" || c.id === "status" || (c.type === "dropdown" && c.name.toLowerCase() === "status")
  );
  const priorityCol = columns.find((c) => c.special === "priority");
  const followupCol = columns.find((c) => c.special === "followup");

  const isFiltered =
    statusFilter !== "ALL" ||
    priorityFilter !== "ALL" ||
    followupFilter !== "ALL";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#111827] border-t sm:border border-[var(--border)] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-2)]/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
              <Filter className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-[var(--fg)]">Filter Leads</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Body */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Status Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[var(--fg-muted)] uppercase tracking-wider">
              Lead Status
            </label>
            <select
              value={statusFilter}
              disabled={!statusCol || !statusCol.options?.length}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2.5 text-xs rounded-xl border bg-[var(--surface-2)] border-[var(--border)] text-[var(--fg)] focus:outline-hidden focus:border-[var(--primary)] cursor-pointer font-medium disabled:opacity-50"
            >
              <option value="ALL">All Statuses</option>
              {statusCol?.options?.map((opt, idx) => {
                const label = typeof opt === "object" && opt !== null ? opt.label : String(opt);
                return (
                  <option key={`${label}-${idx}`} value={label}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[var(--fg-muted)] uppercase tracking-wider">
              Lead Priority
            </label>
            <select
              value={priorityFilter}
              disabled={!priorityCol || !priorityCol.options?.length}
              onChange={(e) => onPriorityFilterChange(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2.5 text-xs rounded-xl border bg-[var(--surface-2)] border-[var(--border)] text-[var(--fg)] focus:outline-hidden focus:border-[var(--primary)] cursor-pointer font-medium disabled:opacity-50"
            >
              <option value="ALL">All Priorities</option>
              {priorityCol?.options?.map((opt, idx) => {
                const label = typeof opt === "object" && opt !== null ? opt.label : String(opt);
                return (
                  <option key={`${label}-${idx}`} value={label}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Follow-up Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[var(--fg-muted)] uppercase tracking-wider">
              Follow-up Category
            </label>
            <select
              value={followupFilter}
              disabled={!followupCol}
              onChange={(e) => onFollowupFilterChange(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2.5 text-xs rounded-xl border bg-[var(--surface-2)] border-[var(--border)] text-[var(--fg)] focus:outline-hidden focus:border-[var(--primary)] cursor-pointer font-medium disabled:opacity-50"
            >
              <option value="ALL">All Follow-ups</option>
              <option value="Today">Today</option>
              <option value="Overdue">Overdue</option>
              <option value="Tomorrow">Tomorrow</option>
              <option value="Upcoming">Upcoming</option>
              <option value="No Date">No Date</option>
            </select>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[var(--border)] flex items-center justify-between gap-3 bg-[var(--surface-2)]/50">
          <button
            type="button"
            onClick={() => {
              if (onResetFilters) onResetFilters();
            }}
            disabled={!isFiltered}
            className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.12)] text-[var(--primary)] flex items-center gap-1.5 transition-all disabled:opacity-40 min-h-[44px] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear Filters
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-xs font-bold rounded-xl bg-[var(--primary)] text-[#0b0f17] flex items-center gap-1.5 shadow-md min-h-[44px] cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
