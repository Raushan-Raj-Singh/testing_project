"use client";

import React from "react";
import { getFollowupCategory } from "@/utils/followup";
import { Users, Calendar, AlertTriangle, Star, MoreVertical, TrendingUp } from "lucide-react";

export default function DashboardStats({ rows = [], columns = [] }) {
  const followupCol = columns.find((c) => c.special === "followup");
  const priorityCol = columns.find((c) => c.special === "priority");

  const today = new Date();

  let totalLeads = rows.length;
  let todayCount = 0;
  let overdueCount = 0;
  let highPriorityCount = 0;

  rows.forEach((row) => {
    const data = row.data || {};

    if (followupCol) {
      const followVal = data[followupCol.id];
      const category = getFollowupCategory(followVal, today);
      if (category === "Today") todayCount++;
      if (category === "Overdue") overdueCount++;
    }

    if (priorityCol) {
      const prioVal = data[priorityCol.id];
      if (prioVal === "High") highPriorityCount++;
    }
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Leads */}
      <div className="glass-panel glass-panel-hover p-4.5 flex flex-col justify-between transition-all duration-200 shadow-lg relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-xl bg-[rgba(59,130,246,0.15)] border border-[rgba(59,130,246,0.3)] flex items-center justify-center text-[var(--blue)]">
            <Users className="w-5 h-5" />
          </div>
          <button
            aria-label="Options"
            className="p-1 rounded-lg text-[var(--fg-subtle)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)] transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)]">
            Total Leads
          </span>
          <div className="font-mono text-3xl font-bold tabular-nums text-[var(--fg)] mt-0.5">
            {totalLeads}
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-[var(--border)] text-[11px] text-[var(--green)]">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>+0 this week</span>
        </div>
      </div>

      {/* 2. Follow-ups */}
      <div className="glass-panel glass-panel-hover p-4.5 flex flex-col justify-between transition-all duration-200 shadow-lg relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-xl bg-[rgba(245,158,11,0.15)] border border-[rgba(245,158,11,0.3)] flex items-center justify-center text-[var(--orange)]">
            <Calendar className="w-5 h-5" />
          </div>
          <button
            aria-label="Options"
            className="p-1 rounded-lg text-[var(--fg-subtle)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)] transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)]">
            Follow-ups
          </span>
          <div className="font-mono text-3xl font-bold tabular-nums text-[var(--fg)] mt-0.5">
            {todayCount}
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-[var(--border)] text-[11px] text-[var(--orange)]">
          <Calendar className="w-3.5 h-3.5" />
          <span>{todayCount} due today</span>
        </div>
      </div>

      {/* 3. Overdue */}
      <div className="glass-panel glass-panel-hover p-4.5 flex flex-col justify-between transition-all duration-200 shadow-lg relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-xl bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.3)] flex items-center justify-center text-[var(--red)]">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <button
            aria-label="Options"
            className="p-1 rounded-lg text-[var(--fg-subtle)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)] transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)]">
            Overdue
          </span>
          <div className="font-mono text-3xl font-bold tabular-nums text-[var(--fg)] mt-0.5">
            {overdueCount}
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-[var(--border)] text-[11px] text-[var(--fg-muted)]">
          <span>{overdueCount > 0 ? `${overdueCount} leads need immediate action` : "No overdue leads"}</span>
        </div>
      </div>

      {/* 4. High Priority */}
      <div className="glass-panel glass-panel-hover p-4.5 flex flex-col justify-between transition-all duration-200 shadow-lg relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-xl bg-[rgba(168,85,247,0.15)] border border-[rgba(168,85,247,0.3)] flex items-center justify-center text-[var(--purple)]">
            <Star className="w-5 h-5" />
          </div>
          <button
            aria-label="Options"
            className="p-1 rounded-lg text-[var(--fg-subtle)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)] transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)]">
            High Priority
          </span>
          <div className="font-mono text-3xl font-bold tabular-nums text-[var(--fg)] mt-0.5">
            {highPriorityCount}
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-[var(--border)] text-[11px] text-[var(--fg-muted)]">
          <span>{highPriorityCount > 0 ? "High intent leads" : "Needs attention"}</span>
        </div>
      </div>
    </div>
  );
}
