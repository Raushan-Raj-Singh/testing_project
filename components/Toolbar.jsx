"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Plus,
  Trash2,
  SlidersHorizontal,
  X,
  RotateCcw,
  Download,
  Upload,
  Edit3,
} from "lucide-react";

export default function Toolbar({
  searchQuery,
  onSearchChange,
  columns = [],
  hiddenColumnIds = [],
  onToggleColumnVisibility,
  onShowAllColumns,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  followupFilter,
  onFollowupFilterChange,
  onResetAllFilters,
  onResetTableView,
  selectedCount = 0,
  isDeletingSelected = false,
  onDeleteSelected,
  onClearSelection,
  onBulkEdit,
  onOpenImport,
  onExportCurrentView,
  onExportAll,
  filteredCount = 0,
  totalRowsCount = 0,
  onAddColumn,
  onAddRow,
  onOpenMobileFilter,
}) {
  const [localSearch, setLocalSearch] = useState(searchQuery || "");
  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);
  const [isColMenuOpen, setIsColMenuOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const colMenuRef = useRef(null);
  const exportMenuRef = useRef(null);

  if (searchQuery !== prevSearchQuery) {
    setPrevSearchQuery(searchQuery);
    setLocalSearch(searchQuery || "");
  }

  useEffect(() => {
    const handler = setTimeout(() => {
      onSearchChange(localSearch);
    }, 200);

    return () => clearTimeout(handler);
  }, [localSearch, onSearchChange]);

  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const mobileMoreRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (colMenuRef.current && !colMenuRef.current.contains(event.target)) {
        setIsColMenuOpen(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setIsExportMenuOpen(false);
      }
      if (mobileMoreRef.current && !mobileMoreRef.current.contains(event.target)) {
        setIsMobileMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const statusCol = columns.find(
    (c) => c.special === "status" || c.id === "status" || (c.type === "dropdown" && c.name.toLowerCase() === "status")
  );
  const priorityCol = columns.find((c) => c.special === "priority");
  const followupCol = columns.find((c) => c.special === "followup");

  const visibleCount = columns.length - hiddenColumnIds.length;
  const isFiltered =
    searchQuery ||
    statusFilter !== "ALL" ||
    priorityFilter !== "ALL" ||
    followupFilter !== "ALL";

  return (
    <div className="flex flex-col gap-2 my-1 relative z-30">
      {/* Bulk Action Bar */}
      {selectedCount > 0 && (
        <div className="flex items-center justify-between px-3 md:px-4 py-2 rounded-xl glass-panel border border-[var(--primary)] shadow-lg animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-md bg-[var(--primary)] text-[#0b0f17]">
              {selectedCount}
            </span>
            <span className="text-xs font-semibold text-[var(--fg)] hidden sm:inline">
              {selectedCount === 1 ? "record selected" : "records selected"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onBulkEdit}
              disabled={isDeletingSelected}
              aria-label="Bulk Edit Selected Rows"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--fg)] hover:border-[var(--primary)] transition-all flex items-center gap-1.5 focus:outline-hidden min-h-[38px]"
            >
              <Edit3 className="w-3.5 h-3.5 text-[var(--primary)]" />
              Bulk Edit ({selectedCount})
            </button>

            <button
              onClick={onClearSelection}
              disabled={isDeletingSelected}
              aria-label="Clear row selection"
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-all flex items-center gap-1 focus:outline-hidden disabled:opacity-50 min-h-[38px]"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>

            <button
              onClick={onDeleteSelected}
              disabled={isDeletingSelected}
              aria-label={`Delete ${selectedCount} selected records`}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--red)] text-white hover:bg-[#dc2626] transition-all flex items-center gap-1.5 shadow-xs focus:outline-hidden disabled:opacity-50 min-h-[38px]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isDeletingSelected ? "Deleting..." : `Delete (${selectedCount})`}
            </button>
          </div>
        </div>
      )}

      {/* Main Glass Pill Toolbar */}
      <div className="glass-panel p-2.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 shadow-lg relative z-30">
        {/* Search Bar Container */}
        <div className="flex items-center gap-2 w-full md:w-auto md:flex-1 max-w-full md:max-w-sm">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] pointer-events-none" />
            <input
              type="text"
              aria-label="Search leads by name, phone, project"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search leads..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border bg-[var(--surface-2)] border-[var(--border)] focus:outline-hidden focus:border-[var(--primary)] text-[var(--fg)] transition-all placeholder-[var(--fg-subtle)] min-h-[42px] md:min-h-[36px]"
            />
            {localSearch && (
              <button
                type="button"
                aria-label="Clear Search Input"
                onClick={() => setLocalSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] hover:text-[var(--fg)] p-1 rounded focus:outline-hidden min-h-[32px] min-w-[32px] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Toolbar Buttons Row (< md screens) */}
        <div className="flex md:hidden items-center justify-between gap-2 w-full pt-1 border-t border-[var(--border)]/50">
          <button
            type="button"
            onClick={onOpenMobileFilter}
            className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 min-h-[42px] transition-all ${
              isFiltered
                ? "bg-[rgba(245,158,11,0.15)] border-[var(--primary)] text-[var(--primary)] font-bold"
                : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--fg)]"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filter {isFiltered && "(Active)"}
          </button>

          <button
            type="button"
            onClick={() => onAddRow()}
            className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-[var(--primary)] text-[#0b0f17] flex items-center justify-center gap-1.5 min-h-[42px] shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Add Lead
          </button>

          {/* Mobile More Options Menu */}
          <div className="relative" ref={mobileMoreRef}>
            <button
              type="button"
              onClick={() => setIsMobileMoreOpen((prev) => !prev)}
              className="py-2 px-3 text-xs font-semibold rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--fg)] flex items-center justify-center gap-1 min-h-[42px] cursor-pointer"
            >
              More
            </button>

            {isMobileMoreOpen && (
              <div className="absolute right-0 top-full mt-2 z-[100] w-56 rounded-xl bg-[#111827] border border-[var(--border-strong)] shadow-2xl p-2 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMoreOpen(false);
                    onOpenImport();
                  }}
                  className="w-full text-left px-3 py-2.5 text-xs font-medium rounded-lg hover:bg-[var(--surface-2)] flex items-center gap-2 text-[var(--fg)] min-h-[42px]"
                >
                  <Upload className="w-4 h-4 text-[var(--primary)]" />
                  Import CSV
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMoreOpen(false);
                    if (onExportCurrentView) onExportCurrentView();
                  }}
                  className="w-full text-left px-3 py-2.5 text-xs font-medium rounded-lg hover:bg-[var(--surface-2)] flex items-center justify-between text-[var(--fg)] min-h-[42px]"
                >
                  <span className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-[var(--primary)]" />
                    Export Current View
                  </span>
                  <span className="font-mono text-[10px] text-[var(--primary)]">({filteredCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMoreOpen(false);
                    if (onExportAll) onExportAll();
                  }}
                  className="w-full text-left px-3 py-2.5 text-xs font-medium rounded-lg hover:bg-[var(--surface-2)] flex items-center justify-between text-[var(--fg)] min-h-[42px]"
                >
                  <span className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-[var(--fg-muted)]" />
                    Export All Data
                  </span>
                  <span className="font-mono text-[10px] text-[var(--fg-muted)]">({totalRowsCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMoreOpen(false);
                    onAddColumn();
                  }}
                  className="w-full text-left px-3 py-2.5 text-xs font-medium rounded-lg hover:bg-[var(--surface-2)] flex items-center gap-2 text-[var(--primary)] min-h-[42px]"
                >
                  <Plus className="w-4 h-4" />
                  Add Dynamic Column
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMoreOpen(false);
                    onResetTableView();
                  }}
                  className="w-full text-left px-3 py-2.5 text-xs font-medium rounded-lg hover:bg-[var(--surface-2)] flex items-center gap-2 text-[var(--fg-muted)] min-h-[42px]"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset View
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Filter Selects & Action Buttons (hidden on mobile, visible on md+) */}
        <div className="hidden md:flex flex-wrap items-center gap-2.5 flex-1">
          {/* Status Filter Dropdown */}
          <select
            value={statusFilter}
            aria-label="Filter by Status"
            disabled={!statusCol || !statusCol.options?.length}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border bg-[var(--surface-2)] border-[var(--border)] focus:outline-hidden focus:border-[var(--primary)] text-[var(--fg)] disabled:opacity-50 cursor-pointer font-medium"
          >
            <option value="ALL">Status: All</option>
            {statusCol?.options?.map((opt, idx) => {
              const label = typeof opt === "object" && opt !== null ? opt.label : String(opt);
              return (
                <option key={`${label}-${idx}`} value={label}>
                  Status: {label}
                </option>
              );
            })}
          </select>

          {/* Priority Filter Dropdown */}
          <select
            value={priorityFilter}
            aria-label="Filter by Priority"
            disabled={!priorityCol || !priorityCol.options?.length}
            onChange={(e) => onPriorityFilterChange(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border bg-[var(--surface-2)] border-[var(--border)] focus:outline-hidden focus:border-[var(--primary)] text-[var(--fg)] disabled:opacity-50 cursor-pointer font-medium"
          >
            <option value="ALL">Priority: All</option>
            {priorityCol?.options?.map((opt, idx) => {
              const label = typeof opt === "object" && opt !== null ? opt.label : String(opt);
              return (
                <option key={`${label}-${idx}`} value={label}>
                  Priority: {label}
                </option>
              );
            })}
          </select>

          {/* Follow-up Filter Dropdown */}
          <select
            value={followupFilter}
            aria-label="Filter by Follow-up Category"
            disabled={!followupCol}
            onChange={(e) => onFollowupFilterChange(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border bg-[var(--surface-2)] border-[var(--border)] focus:outline-hidden focus:border-[var(--primary)] text-[var(--fg)] disabled:opacity-50 cursor-pointer font-medium"
          >
            <option value="ALL">Follow-up: All</option>
            <option value="Today">Follow-up: Today</option>
            <option value="Overdue">Follow-up: Overdue</option>
            <option value="Tomorrow">Follow-up: Tomorrow</option>
            <option value="Upcoming">Follow-up: Upcoming</option>
            <option value="No Date">Follow-up: No Date</option>
          </select>

          {/* Reset Filters */}
          {isFiltered && (
            <button
              onClick={onResetAllFilters}
              aria-label="Reset Search and Active Filters"
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.12)] text-[var(--primary)] flex items-center gap-1 transition-all hover:bg-[rgba(245,158,11,0.2)] focus:outline-hidden"
              title="Reset Search and Filters"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}

          {/* Columns Visibility Trigger */}
          <div className="relative" ref={colMenuRef}>
            <button
              onClick={() => setIsColMenuOpen((prev) => !prev)}
              aria-label="Toggle Column Visibility"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--fg)] hover:border-[var(--border-strong)] flex items-center gap-1.5 transition-all focus:outline-hidden"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--primary)]" />
              Columns ({visibleCount}/{columns.length})
            </button>

            {isColMenuOpen && (
              <div className="absolute left-0 top-full mt-1.5 z-[100] w-64 rounded-xl bg-[#111827] border border-[var(--border-strong)] shadow-2xl p-3 flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between border-b pb-2 border-[var(--border)]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)]">
                    Visible Columns
                  </span>
                  <button
                    type="button"
                    onClick={onShowAllColumns}
                    className="text-[11px] font-semibold text-[var(--primary)] hover:underline focus:outline-hidden cursor-pointer"
                  >
                    Show All
                  </button>
                </div>

                <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                  {columns.map((col) => {
                    const isVisible = !hiddenColumnIds.includes(col.id);
                    return (
                      <label
                        key={col.id}
                        className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-[var(--surface-2)] cursor-pointer text-xs font-medium transition-colors"
                      >
                        <span className="truncate pr-2 text-[var(--fg)]">{col.name}</span>
                        <input
                          type="checkbox"
                          aria-label={`Toggle visibility of ${col.name}`}
                          checked={isVisible}
                          onChange={() => onToggleColumnVisibility(col.id)}
                          className="w-4 h-4 accent-[var(--primary)] rounded-xs cursor-pointer"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons Right Group (Desktop hidden on mobile, visible on md+) */}
        <div className="hidden md:flex items-center gap-2">
          {/* Import CSV */}
          <button
            onClick={onOpenImport}
            aria-label="Import Leads from CSV"
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--fg)] hover:border-[var(--border-strong)] flex items-center gap-1.5 transition-all focus:outline-hidden"
          >
            <Upload className="w-3.5 h-3.5 text-[var(--primary)]" />
            Import
          </button>

          {/* Export CSV Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setIsExportMenuOpen((prev) => !prev)}
              aria-label="Export Options Menu"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--fg)] hover:border-[var(--border-strong)] flex items-center gap-1.5 transition-all focus:outline-hidden"
            >
              <Download className="w-3.5 h-3.5 text-[var(--primary)]" />
              Export
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-[100] w-52 rounded-xl bg-[#111827] border border-[var(--border-strong)] shadow-2xl p-2 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    if (onExportCurrentView) onExportCurrentView();
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg hover:bg-[var(--surface-2)] transition-colors flex items-center justify-between text-[var(--fg)]"
                >
                  <span>Export Current View</span>
                  <span className="font-mono text-[10px] text-[var(--primary)]">({filteredCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    if (onExportAll) onExportAll();
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg hover:bg-[var(--surface-2)] transition-colors flex items-center justify-between text-[var(--fg)]"
                >
                  <span>Export All Data</span>
                  <span className="font-mono text-[10px] text-[var(--fg-muted)]">({totalRowsCount})</span>
                </button>
              </div>
            )}
          </div>

          {/* Dynamic Column Addition */}
          <button
            onClick={onAddColumn}
            aria-label="Add Dynamic Column"
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.12)] text-[var(--primary)] hover:bg-[rgba(245,158,11,0.2)] flex items-center gap-1.5 transition-all focus:outline-hidden"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Column
          </button>

          {/* Primary Action: + Add Lead */}
          <button
            onClick={() => onAddRow()}
            aria-label="Add New Lead Row"
            className="px-4 py-1.5 text-xs font-bold rounded-lg bg-[var(--primary)] text-[#0b0f17] hover:bg-[var(--primary-hover)] transition-all flex items-center gap-1.5 shadow-md focus:outline-hidden cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Add Lead
          </button>
        </div>
      </div>
    </div>
  );
}
