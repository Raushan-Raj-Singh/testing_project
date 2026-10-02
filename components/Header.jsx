"use client";

import React, { useState } from "react";
import { Users, Bell, Settings, ChevronDown } from "lucide-react";

export default function Header({ activeView = "table", onViewChange }) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--border)] mb-4">
      {/* Left: Branding & Subtitle */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[rgba(245,158,11,0.15)] border border-[rgba(245,158,11,0.3)] flex items-center justify-center text-[var(--orange)] shadow-xs">
          <Users className="w-5 h-5" />
        </div>

        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--fg)]">
              Lead Management
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-[rgba(16,185,129,0.12)] text-[var(--green)] border border-[rgba(16,185,129,0.25)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] animate-pulse" />
              MongoDB • Live Data
            </span>
          </div>
          <p className="text-xs text-[var(--fg-muted)] mt-0.5">
            Track, manage and follow up with your leads
          </p>
        </div>
      </div>

      {/* Right: Notification, Settings, User Profile */}
      <div className="flex items-center gap-3">
        {/* View Switcher toggle option if passed */}
        {onViewChange && (
          <div className="hidden sm:flex items-center p-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] mr-2">
            <button
              onClick={() => onViewChange("table")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeView === "table"
                  ? "bg-[var(--primary)] text-[#0b0f17] shadow-xs"
                  : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => onViewChange("kanban")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeView === "kanban"
                  ? "bg-[var(--primary)] text-[#0b0f17] shadow-xs"
                  : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
              }`}
            >
              Kanban View
            </button>
          </div>
        )}

        {/* Notifications Button */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            aria-label="Notifications"
            className="relative p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-[var(--border-strong)] transition-all focus:outline-hidden"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--red)] text-white text-[9px] font-bold flex items-center justify-center border-2 border-[var(--bg)]">
              2
            </span>
          </button>

          {isNotificationOpen && (
            <div className="absolute right-0 mt-2 w-64 p-3 rounded-xl glass-panel shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="text-xs font-bold text-[var(--fg)] pb-2 border-b border-[var(--border)] flex justify-between items-center">
                Notifications
                <span className="text-[10px] text-[var(--primary)] font-normal">2 new</span>
              </div>
              <div className="py-2 space-y-2 text-xs text-[var(--fg-muted)]">
                <div className="p-1.5 rounded-lg hover:bg-[var(--surface-2)]">
                  <p className="text-[var(--fg)] font-medium">Overdue Follow-up</p>
                  <p className="text-[10px]">Lead &quot;Raj&quot; followup is overdue.</p>
                </div>
                <div className="p-1.5 rounded-lg hover:bg-[var(--surface-2)]">
                  <p className="text-[var(--fg)] font-medium">New Lead Assigned</p>
                  <p className="text-[10px]">Lead &quot;xzc&quot; added to pipeline.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Settings Icon */}
        <button
          aria-label="Settings"
          className="p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-[var(--border-strong)] transition-all focus:outline-hidden"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* User Profile Avatar Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] transition-all focus:outline-hidden"
          >
            <div className="w-7 h-7 rounded-lg bg-[var(--surface-2)] text-[var(--fg)] text-xs font-bold flex items-center justify-center border border-[var(--border)]">
              RS
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--fg-muted)]" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 p-2 rounded-xl glass-panel shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-2 py-1.5 border-b border-[var(--border)] mb-1">
                <p className="text-xs font-semibold text-[var(--fg)]">Rajesh Sharma</p>
                <p className="text-[10px] text-[var(--fg-muted)]">rajesh@company.com</p>
              </div>
              <button className="w-full text-left px-2 py-1.5 text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)] rounded-lg">
                Account Settings
              </button>
              <button className="w-full text-left px-2 py-1.5 text-xs text-[var(--danger)] hover:bg-[var(--danger-bg)] rounded-lg">
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
