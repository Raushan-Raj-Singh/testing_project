"use client";

import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Check } from "lucide-react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/**
 * Premium Dark Calendar Date & Datetime Picker
 * @param {string} value - YYYY-MM-DD or YYYY-MM-DDTHH:mm
 * @param {function} onChange - callback with string
 * @param {boolean} showTime - whether to pick hours and minutes
 * @param {function} onConfirm - optional callback on confirm
 * @param {function} onCancel - optional callback on cancel
 */
export default function ThemeDatePicker({
  value = "",
  onChange,
  showTime = false,
  onConfirm,
  onCancel,
}) {
  // Parse incoming value safely
  const initialDate = useMemo(() => {
    if (!value) return new Date();
    try {
      const d = new Date(value.includes("T") ? value : `${value}T00:00:00`);
      return isNaN(d.getTime()) ? new Date() : d;
    } catch {
      return new Date();
    }
  }, [value]);

  const [currentYear, setCurrentYear] = useState(() => initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => initialDate.getMonth());
  
  // Selected values
  const [selectedYear, setSelectedYear] = useState(() => {
    return value ? initialDate.getFullYear() : null;
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return value ? initialDate.getMonth() : null;
  });
  const [selectedDay, setSelectedDay] = useState(() => {
    return value ? initialDate.getDate() : null;
  });

  // Time state (if showTime)
  const [hours, setHours] = useState(() => {
    if (value && value.includes("T")) {
      const timePart = value.split("T")[1];
      if (timePart) return timePart.split(":")[0] || "09";
    }
    return "09";
  });
  const [minutes, setMinutes] = useState(() => {
    if (value && value.includes("T")) {
      const timePart = value.split("T")[1];
      if (timePart) return timePart.split(":")[1]?.slice(0, 2) || "00";
    }
    return "00";
  });

  const [viewMode, setViewMode] = useState("days"); // 'days' | 'months' | 'years'

  // Navigation handlers
  const handlePrevMonth = (e) => {
    e?.stopPropagation();
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e) => {
    e?.stopPropagation();
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Build days grid
  const daysGrid = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        month: currentMonth === 0 ? 11 : currentMonth - 1,
        year: currentMonth === 0 ? currentYear - 1 : currentYear,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      days.push({
        day: i,
        month: currentMonth,
        year: currentYear,
        isCurrentMonth: true,
      });
    }

    // Next month padding (complete to 42 cells or multiple of 7)
    const totalCells = days.length <= 35 ? 35 : 42;
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        month: currentMonth === 11 ? 0 : currentMonth + 1,
        year: currentMonth === 11 ? currentYear + 1 : currentYear,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  const today = new Date();
  const isToday = (y, m, d) =>
    today.getFullYear() === y && today.getMonth() === m && today.getDate() === d;

  const isSelected = (y, m, d) =>
    selectedYear === y && selectedMonth === m && selectedDay === d;

  const handleSelectDay = (cell) => {
    setSelectedYear(cell.year);
    setSelectedMonth(cell.month);
    setSelectedDay(cell.day);
    setCurrentYear(cell.year);
    setCurrentMonth(cell.month);
  };

  const handleTimeChange = (newH, newM) => {
    setHours(newH);
    setMinutes(newM);
  };

  const handleQuickPreset = (preset) => {
    const d = new Date();
    if (preset === "today") {
      // today
    } else if (preset === "tomorrow") {
      d.setDate(d.getDate() + 1);
    } else if (preset === "nextWeek") {
      d.setDate(d.getDate() + 7);
    } else if (preset === "nextMonth") {
      d.setMonth(d.getMonth() + 1);
    }

    const y = d.getFullYear();
    const m = d.getMonth();
    const day = d.getDate();

    setSelectedYear(y);
    setSelectedMonth(m);
    setSelectedDay(day);
    setCurrentYear(y);
    setCurrentMonth(m);
  };

  const handleApply = (e) => {
    e?.stopPropagation();
    const y = selectedYear || currentYear;
    const m = selectedMonth !== null ? selectedMonth : currentMonth;
    const d = selectedDay || 1;
    const pad = (n) => String(n).padStart(2, "0");
    const dateStr = `${y}-${pad(m + 1)}-${pad(d)}`;
    const finalVal = showTime ? `${dateStr}T${pad(hours)}:${pad(minutes)}` : dateStr;
    if (onChange) onChange(finalVal);
    if (onConfirm) onConfirm(finalVal);
  };

  // Generate Year Range for year selector
  const yearRange = useMemo(() => {
    const start = Math.floor(currentYear / 12) * 12;
    const years = [];
    for (let i = 0; i < 12; i++) {
      years.push(start + i);
    }
    return years;
  }, [currentYear]);

  return (
    <div
      className="w-[300px] select-none rounded-xl border border-[var(--border)] bg-[#111827] shadow-2xl p-3 text-[var(--fg)] text-xs font-sans animate-in fade-in zoom-in-95 duration-150"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header controls: month/year title & arrow buttons */}
      <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-[var(--border)]">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setViewMode(viewMode === "months" ? "days" : "months")}
            className="px-2 py-1 rounded-lg font-bold text-sm text-[var(--fg)] hover:bg-[var(--surface-2)] hover:text-[var(--primary)] transition-colors cursor-pointer"
          >
            {MONTH_NAMES[currentMonth]}
          </button>
          <button
            type="button"
            onClick={() => setViewMode(viewMode === "years" ? "days" : "years")}
            className="px-2 py-1 rounded-lg font-mono text-xs font-semibold text-[var(--fg-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--primary)] transition-colors cursor-pointer"
          >
            {currentYear}
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={viewMode === "years" ? () => setCurrentYear((y) => y - 12) : handlePrevMonth}
            className="p-1 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
            title="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={viewMode === "years" ? () => setCurrentYear((y) => y + 12) : handleNextMonth}
            className="p-1 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
            title="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Presets */}
      {viewMode === "days" && (
        <div className="flex items-center gap-1 mb-2.5 overflow-x-auto pb-0.5 no-scrollbar">
          <button
            type="button"
            onClick={() => handleQuickPreset("today")}
            className="px-2 py-1 rounded-md text-[10px] font-semibold bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] text-[var(--fg-muted)] hover:text-[var(--primary)] transition-all cursor-pointer whitespace-nowrap"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset("tomorrow")}
            className="px-2 py-1 rounded-md text-[10px] font-semibold bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] text-[var(--fg-muted)] hover:text-[var(--primary)] transition-all cursor-pointer whitespace-nowrap"
          >
            Tomorrow
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset("nextWeek")}
            className="px-2 py-1 rounded-md text-[10px] font-semibold bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] text-[var(--fg-muted)] hover:text-[var(--primary)] transition-all cursor-pointer whitespace-nowrap"
          >
            +1 Week
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset("nextMonth")}
            className="px-2 py-1 rounded-md text-[10px] font-semibold bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] text-[var(--fg-muted)] hover:text-[var(--primary)] transition-all cursor-pointer whitespace-nowrap"
          >
            +1 Month
          </button>
        </div>
      )}

      {/* Months View Selector */}
      {viewMode === "months" && (
        <div className="grid grid-cols-3 gap-1.5 py-2">
          {MONTH_NAMES.map((mName, idx) => {
            const isCurr = idx === currentMonth;
            return (
              <button
                key={mName}
                type="button"
                onClick={() => {
                  setCurrentMonth(idx);
                  setViewMode("days");
                }}
                className={`py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isCurr
                    ? "bg-[var(--primary)] text-[#0b0f17] font-bold shadow-md"
                    : "text-[var(--fg)] hover:bg-[var(--surface-2)] hover:text-[var(--primary)]"
                }`}
              >
                {mName.slice(0, 3)}
              </button>
            );
          })}
        </div>
      )}

      {/* Years View Selector */}
      {viewMode === "years" && (
        <div className="grid grid-cols-3 gap-1.5 py-2">
          {yearRange.map((yr) => {
            const isCurr = yr === currentYear;
            return (
              <button
                key={yr}
                type="button"
                onClick={() => {
                  setCurrentYear(yr);
                  setViewMode("days");
                }}
                className={`py-2 rounded-lg font-mono text-xs font-semibold transition-all cursor-pointer ${
                  isCurr
                    ? "bg-[var(--primary)] text-[#0b0f17] font-bold shadow-md"
                    : "text-[var(--fg)] hover:bg-[var(--surface-2)] hover:text-[var(--primary)]"
                }`}
              >
                {yr}
              </button>
            );
          })}
        </div>
      )}

      {/* Days Grid View */}
      {viewMode === "days" && (
        <div>
          {/* Day column labels */}
          <div className="grid grid-cols-7 gap-1 mb-1 text-center font-mono text-[10px] font-semibold text-[var(--fg-subtle)]">
            {DAY_NAMES.map((d) => (
              <div key={d} className="py-0.5">
                {d}
              </div>
            ))}
          </div>

          {/* Day numbers */}
          <div className="grid grid-cols-7 gap-1">
            {daysGrid.map((cell, idx) => {
              const selected = isSelected(cell.year, cell.month, cell.day);
              const currentToday = isToday(cell.year, cell.month, cell.day);

              return (
                <button
                  key={`${cell.year}-${cell.month}-${cell.day}-${idx}`}
                  type="button"
                  onClick={() => handleSelectDay(cell)}
                  className={`h-8 rounded-lg flex items-center justify-center font-mono text-xs transition-all cursor-pointer relative ${
                    selected
                      ? "bg-[var(--primary)] text-[#0b0f17] font-bold shadow-md scale-105 z-10"
                      : cell.isCurrentMonth
                      ? "text-[var(--fg)] hover:bg-[var(--surface-2)] hover:text-[var(--primary)]"
                      : "text-[var(--fg-subtle)] opacity-40 hover:opacity-75 hover:bg-[var(--surface-2)]"
                  }`}
                >
                  {cell.day}
                  {currentToday && !selected && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[var(--primary)]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Time Picker Controls (for datetime columns) */}
      {showTime && viewMode === "days" && (
        <div className="mt-3 pt-2.5 border-t border-[var(--border)] flex items-center justify-between bg-[var(--surface-2)]/50 p-2 rounded-lg">
          <div className="flex items-center gap-1.5 text-xs text-[var(--fg-muted)]">
            <Clock className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span className="font-semibold text-[11px] uppercase tracking-wider">Time</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-xs">
            <select
              value={hours}
              onChange={(e) => handleTimeChange(e.target.value, minutes)}
              className="bg-[var(--surface)] text-[var(--fg)] border border-[var(--border)] rounded px-1.5 py-1 focus:border-[var(--primary)] focus:outline-hidden cursor-pointer"
            >
              {Array.from({ length: 24 }).map((_, i) => {
                const valStr = String(i).padStart(2, "0");
                return (
                  <option key={valStr} value={valStr}>
                    {valStr}
                  </option>
                );
              })}
            </select>
            <span className="text-[var(--fg-muted)] font-bold">:</span>
            <select
              value={minutes}
              onChange={(e) => handleTimeChange(hours, e.target.value)}
              className="bg-[var(--surface)] text-[var(--fg)] border border-[var(--border)] rounded px-1.5 py-1 focus:border-[var(--primary)] focus:outline-hidden cursor-pointer"
            >
              {["00", "15", "30", "45"].map((minStr) => (
                <option key={minStr} value={minStr}>
                  {minStr}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="mt-3 pt-2.5 border-t border-[var(--border)] flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            if (onChange) onChange("");
            if (onConfirm) onConfirm("");
          }}
          className="px-2.5 py-1.5 text-[11px] font-semibold text-[var(--fg-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-bg)] rounded-lg transition-colors cursor-pointer"
        >
          Clear
        </button>

        <div className="flex items-center gap-1.5">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-[11px] font-semibold text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)] rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleApply}
            className="px-3.5 py-1.5 text-[11px] font-bold rounded-lg bg-[var(--primary)] text-[#0b0f17] hover:bg-[var(--primary-hover)] transition-all flex items-center gap-1 shadow-md cursor-pointer"
          >
            <Check className="w-3 h-3 stroke-[3]" />
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
