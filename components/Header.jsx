"use client";

import React, { useState, useRef, useEffect } from "react";
import { Users, Bell, Settings, ChevronDown, LogOut, User as UserIcon } from "lucide-react";

export default function Header({
  activeView = "table",
  onViewChange,
  currentUser = null,
  onLogout,
}) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const userMenuRef = useRef(null);
  const notifMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userName = currentUser?.name || "User Account";
  const userEmail = currentUser?.email || "user@example.com";
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "CRM";

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-[var(--border)] mb-4 relative z-40 max-w-full min-w-0">
      {/* Left: Branding & Subtitle */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 max-w-full">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[rgba(245,158,11,0.15)] border border-[rgba(245,158,11,0.3)] flex items-center justify-center text-[var(--orange)] shadow-xs shrink-0">
          <Users className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-[var(--fg)] truncate">
              Lead Management
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] sm:text-[10px] font-mono font-semibold rounded-full bg-[rgba(16,185,129,0.12)] text-[var(--green)] border border-[rgba(16,185,129,0.25)] shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] animate-pulse" />
              Authenticated • Live CRM
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-[var(--fg-muted)] mt-0.5 truncate">
            Track, manage and follow up with your leads
          </p>
        </div>
      </div>

      {/* Right: View Switcher, Notification, User Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto sm:ml-0">
        {/* View Switcher toggle option if passed */}
        {onViewChange && (
          <div className="hidden sm:flex items-center p-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] mr-1">
            <button
              onClick={() => onViewChange("table")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all min-h-[34px] cursor-pointer ${
                activeView === "table"
                  ? "bg-[var(--primary)] text-[#0b0f17] shadow-xs"
                  : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => onViewChange("kanban")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all min-h-[34px] cursor-pointer ${
                activeView === "kanban"
                  ? "bg-[var(--primary)] text-[#0b0f17] shadow-xs"
                  : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
              }`}
            >
              Kanban View
            </button>
          </div>
        )}

        {/* User Profile Avatar & Account Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            aria-label="User Account Menu"
            className="flex items-center gap-2 p-1.5 pl-2 pr-2.5 sm:pr-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] transition-all focus:outline-hidden min-h-[38px] sm:min-h-[40px] cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-[var(--primary)] text-[#0b0f17] text-xs font-extrabold flex items-center justify-center shadow-xs shrink-0">
              {initials}
            </div>
            <span className="text-xs font-bold text-[var(--fg)] hidden md:inline truncate max-w-[120px]">
              {userName}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--fg-muted)] shrink-0" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-60 max-w-[calc(100vw-2rem)] p-2 rounded-xl bg-[#111827] border border-[var(--border-strong)] shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-[var(--border)] mb-1 min-w-0">
                <p className="text-xs font-bold text-[var(--fg)] truncate" title={userName}>{userName}</p>
                <p className="text-[11px] text-[var(--fg-subtle)] truncate font-mono" title={userEmail}>{userEmail}</p>
              </div>

              <div className="px-3 py-1 text-[10px] uppercase font-bold text-[var(--fg-muted)] tracking-wider">
                Account
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  if (onLogout) onLogout();
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-[var(--red)] hover:bg-[rgba(239,68,68,0.12)] rounded-lg flex items-center gap-2 transition-colors cursor-pointer min-h-[38px]"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                Sign Out / Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
