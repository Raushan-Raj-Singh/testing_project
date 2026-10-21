"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import LeadTable from "@/components/LeadTable";
import LeadDetailsDrawer from "@/components/LeadDetailsDrawer";
import ConfirmDialog from "@/components/ConfirmDialog";
import { exportToCSV } from "@/utils/csvExport";
import { sortRowsByFollowupAndPriority } from "@/utils/followup";
import {
  Users,
  ShieldCheck,
  UserCheck,
  UserPlus,
  ArrowRightLeft,
  UserX,
  Database,
  Filter,
  Search,
  Download,
  AlertCircle,
  Plus,
  RefreshCw,
  CheckCircle2,
  Lock,
} from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();

  // User & Authorization State
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // Active Tab: "overview" | "users" | "leads"
  const [activeTab, setActiveTab] = useState("overview");

  // Users Data & Stats
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    adminsCount: 0,
    totalLeads: 0,
  });
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Team Leads Data
  const [teamLeads, setTeamLeads] = useState([]);
  const [masterColumns, setMasterColumns] = useState([]);
  const [selectedOwnerFilter, setSelectedOwnerFilter] = useState("ALL");
  const [loadingLeads, setLoadingLeads] = useState(false);

  // UI State & Filters
  const [toastMessage, setToastMessage] = useState(null);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [leadSearchQuery, setLeadSearchQuery] = useState("");
  const [leadStatusFilter, setLeadStatusFilter] = useState("ALL");
  const [leadPriorityFilter, setLeadPriorityFilter] = useState("ALL");
  const [leadFollowupFilter, setLeadFollowupFilter] = useState("ALL");
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [activeDrawerLead, setActiveDrawerLead] = useState(null);

  // Action Modals State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [addUserError, setAddUserError] = useState("");

  const [confirmActionModal, setConfirmActionModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    actionType: "", // "PROMOTE" | "DEMOTE" | "DEACTIVATE" | "ACTIVATE" | "DELETE_LEAD"
    targetUser: null,
    targetLeadId: null,
  });

  const showToast = useCallback((msg, isError = false) => {
    setToastMessage({ text: msg, isError });
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Check Current Session User on Mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success && data.user) {
          setCurrentUser(data.user);
          if (data.user.role !== "admin") {
            setAccessDenied(true);
          }
        } else {
          router.push("/login");
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        router.push("/login");
      } finally {
        setAuthLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  // Fetch Users & Overview Stats
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
        if (data.stats) {
          setStats(data.stats);
        }
      } else {
        showToast(data.message || "Failed to load users.", true);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      showToast("Server error while loading users.", true);
    } finally {
      setLoadingUsers(false);
    }
  }, [showToast]);

  // Fetch Team Leads
  const fetchTeamLeads = useCallback(async () => {
    setLoadingLeads(true);
    try {
      const queryParam = selectedOwnerFilter !== "ALL" ? `?userId=${selectedOwnerFilter}` : "";
      const res = await fetch(`/api/admin/leads${queryParam}`);
      const data = await res.json();
      console.log("[ADMIN UI][API RESPONSE]", data);
      if (data.success) {
        const rowsData = data.data || [];
        console.log("[ADMIN UI][FIRST LEAD]", {
          firstLead: rowsData[0] || null,
        });
        console.log(
          "[ADMIN UI][ROWS BEFORE GRID]",
          rowsData.slice(0, 5).map((row) => ({
            rowId: row._rowId || row._id || row.id,
            ownerId: row.ownerId,
            ownerName: row.ownerName,
            owner: row.owner,
            dataOwner: row.data?.owner,
            allKeys: Object.keys(row),
          }))
        );
        setTeamLeads(rowsData);
      } else {
        showToast(data.message || "Failed to load team leads.", true);
      }
    } catch (err) {
      console.error("Error fetching team leads:", err);
      showToast("Server error while loading team leads.", true);
    } finally {
      setLoadingLeads(false);
    }
  }, [selectedOwnerFilter, showToast]);

  // Fetch default master table structure for admin grid view with persistent column order
  const fetchMasterTableSchema = useCallback(async () => {
    try {
      const res = await fetch("/api/table");
      const data = await res.json();
      if (data.success && data.data?.columns) {
        // Ensure Owner column is present in admin view schema
        let cols = [...data.data.columns];
        if (!cols.some((c) => c.id === "ownerName")) {
          cols.splice(1, 0, {
            id: "ownerName",
            name: "Owner",
            type: "text",
            options: [],
            special: "normal",
          });
        }

        // Apply persistent Admin column order from localStorage if saved
        const savedOrderStr = localStorage.getItem("admin_column_order");
        if (savedOrderStr) {
          try {
            const savedOrder = JSON.parse(savedOrderStr);
            if (Array.isArray(savedOrder) && savedOrder.length > 0) {
              const colMap = new Map(cols.map((c) => [c.id, c]));
              const reordered = [];
              savedOrder.forEach((id) => {
                if (colMap.has(id)) {
                  reordered.push(colMap.get(id));
                  colMap.delete(id);
                }
              });
              colMap.forEach((c) => reordered.push(c));
              cols = reordered;
            }
          } catch (e) {
            console.error("Failed to parse saved admin_column_order", e);
          }
        }

        console.log(
          "[ADMIN UI][COLUMN DEFINITIONS]",
          cols.map((column) => ({
            field: column.id,
            headerName: column.name,
            type: column.type,
          }))
        );
        console.log("[ADMIN UI][OWNER COLUMN]", {
          ownerColumn: cols.find(
            (column) =>
              column.id === "owner" ||
              column.id === "ownerName" ||
              column.name === "Owner"
          ),
        });

        setMasterColumns(cols);
      }
    } catch (err) {
      console.error("Error fetching table schema:", err);
    }
  }, []);

  useEffect(() => {
    let active = true;
    if (currentUser && currentUser.role === "admin") {
      (async () => {
        if (!active) return;
        await fetchUsers();
        await fetchMasterTableSchema();
      })();
    }
    return () => {
      active = false;
    };
  }, [currentUser, fetchUsers, fetchMasterTableSchema]);

  useEffect(() => {
    let active = true;
    if (currentUser && currentUser.role === "admin" && (activeTab === "leads" || activeTab === "overview")) {
      (async () => {
        if (!active) return;
        await fetchTeamLeads();
      })();
    }
    return () => {
      active = false;
    };
  }, [currentUser, activeTab, fetchTeamLeads]);

  // Action Handlers
  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
    }
  }, [router]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchUsers();
      } else {
        showToast(data.message || "Failed to update role.", true);
      }
    } catch (err) {
      console.error("Role update error:", err);
      showToast("Server error during role change.", true);
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchUsers();
      } else {
        showToast(data.message || "Failed to update user status.", true);
      }
    } catch (err) {
      console.error("Status update error:", err);
      showToast("Server error during status update.", true);
    }
  };

  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    setAddUserError("");
    setIsSubmittingUser(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUserForm),
      });
      const data = await res.json();
      if (data.success) {
        showToast("New user created successfully!");
        setIsAddUserModalOpen(false);
        setNewUserForm({ name: "", email: "", password: "", role: "user" });
        fetchUsers();
      } else {
        setAddUserError(data.message || "Failed to create user.");
      }
    } catch (err) {
      console.error("Create user error:", err);
      setAddUserError("Server connection failed.");
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleSaveDrawerLead = async (rowId, updatedFields) => {
    try {
      const res = await fetch(`/api/rows/${rowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: updatedFields }),
      });
      const result = await res.json();
      if (result.success) {
        setTeamLeads((prev) => {
          const updated = prev.map((r) =>
            r._id === rowId
              ? { ...r, data: { ...(r.data || {}), ...updatedFields } }
              : r
          );
          return sortRowsByFollowupAndPriority(updated, masterColumns);
        });
        showToast("Lead updated successfully.");
      } else {
        showToast(result.message || "Failed to update lead.", true);
      }
    } catch (err) {
      console.error("Error saving lead:", err);
      showToast("Failed to save lead changes.", true);
    }
  };

  const handleDeleteLead = async (rowId) => {
    try {
      const res = await fetch(`/api/rows/${rowId}`, { method: "DELETE" });
      const result = await res.json();
      if (result.success) {
        setTeamLeads((prev) => prev.filter((r) => r._id !== rowId));
        setSelectedLeadIds((prev) => prev.filter((id) => id !== rowId));
        showToast("Lead deleted successfully.");
      } else {
        showToast(result.message || "Failed to delete lead.", true);
      }
    } catch (err) {
      console.error("Error deleting lead:", err);
      showToast("Server error deleting lead.", true);
    }
  };

  const handleBulkDeleteLeads = async () => {
    if (!selectedLeadIds.length) return;
    const targetIds = [...selectedLeadIds];

    try {
      // Process batch deletion for selected team lead IDs
      const deletePromises = targetIds.map((id) =>
        fetch(`/api/rows/${id}`, { method: "DELETE" }).then((r) => r.json())
      );
      const results = await Promise.all(deletePromises);
      const successCount = results.filter((r) => r.success).length;

      setTeamLeads((prev) => prev.filter((r) => !targetIds.includes(r._id)));
      setSelectedLeadIds([]);
      showToast(`Successfully deleted ${successCount} team lead record(s).`);
    } catch (err) {
      console.error("Error performing bulk delete:", err);
      showToast("Error during bulk delete operation.", true);
    }
  };

  const handleReorderAdminColumns = useCallback((newColumnOrder) => {
    setMasterColumns((prev) => {
      if (!prev) return prev;
      const colMap = new Map(prev.map((c) => [c.id, c]));
      const reordered = [];
      newColumnOrder.forEach((id) => {
        if (colMap.has(id)) {
          reordered.push(colMap.get(id));
          colMap.delete(id);
        }
      });
      colMap.forEach((col) => reordered.push(col));
      return reordered;
    });

    try {
      localStorage.setItem("admin_column_order", JSON.stringify(newColumnOrder));
      showToast("Column order updated for Admin View.");
    } catch (e) {
      console.error("Failed to save column order to localStorage", e);
    }
  }, [showToast]);

  const handleDeleteAdminColumn = async (colTarget) => {
    if (!colTarget || !colTarget.id) return;
    try {
      const res = await fetch(`/api/table/column/${colTarget.id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (result.success) {
        setMasterColumns((prev) => prev.filter((c) => c.id !== colTarget.id));
        setTeamLeads((prev) =>
          prev.map((r) => {
            const copy = { ...r.data };
            delete copy[colTarget.id];
            return { ...r, data: copy };
          })
        );
        showToast(`Column "${colTarget.name}" deleted successfully.`);
      } else {
        showToast(result.message || "Failed to delete column.", true);
      }
    } catch (err) {
      console.error("Error deleting column:", err);
      showToast("Server error during column deletion.", true);
    }
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return users;
    const q = userSearchQuery.toLowerCase();
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, userSearchQuery]);

  // Filtered & Sorted Team Leads List for Admin Grid View
  const filteredTeamLeads = useMemo(() => {
    return teamLeads.filter((row) => {
      // 1. Search Query filter across all text fields & owner
      if (leadSearchQuery.trim()) {
        const query = leadSearchQuery.toLowerCase();
        const rowDataValues = Object.values(row.data || {}).map((v) => String(v).toLowerCase());
        const ownerMatch = (row.ownerName || "").toLowerCase().includes(query) || (row.ownerEmail || "").toLowerCase().includes(query);
        const matchesData = rowDataValues.some((val) => val.includes(query));
        if (!matchesData && !ownerMatch) return false;
      }

      // 2. Status Filter
      if (leadStatusFilter !== "ALL") {
        const statusCol = masterColumns.find((c) => c.special === "status");
        if (statusCol) {
          const val = row.data?.[statusCol.id];
          if (val !== leadStatusFilter) return false;
        }
      }

      // 3. Priority Filter
      if (leadPriorityFilter !== "ALL") {
        const priorityCol = masterColumns.find((c) => c.special === "priority");
        if (priorityCol) {
          const val = row.data?.[priorityCol.id];
          if (val !== leadPriorityFilter) return false;
        }
      }

      return true;
    });
  }, [teamLeads, leadSearchQuery, leadStatusFilter, leadPriorityFilter, masterColumns]);

  // Export CSV Handler for Admin
  const handleExportCSV = () => {
    if (filteredTeamLeads.length === 0) {
      showToast("No lead data to export.", true);
      return;
    }
    const colsToExport = masterColumns.length > 0 ? masterColumns : [
      { id: "leadId", name: "Lead ID" },
      { id: "ownerName", name: "Owner" },
      { id: "name", name: "Name" },
      { id: "project", name: "Project" },
      { id: "phone", name: "Phone" },
      { id: "status", name: "Status" },
      { id: "priority", name: "Priority" },
    ];
    exportToCSV(colsToExport, filteredTeamLeads, "Admin_Team_Leads_Report.csv");
    showToast("Exported team leads to CSV successfully.");
  };

  // Render Loading Guard
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] flex items-center justify-center p-4">
        <div className="flex items-center gap-3 bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xl">
          <RefreshCw className="w-6 h-6 text-[var(--primary)] animate-spin" />
          <span className="text-sm font-semibold">Verifying authorization...</span>
        </div>
      </div>
    );
  }

  // Render Access Denied Guard
  if (accessDenied || (currentUser && currentUser.role !== "admin")) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-[var(--surface)] p-8 rounded-2xl border border-[var(--red)] shadow-2xl text-center">
          <div className="w-16 h-16 rounded-full bg-[rgba(239,68,68,0.12)] text-[var(--red)] flex items-center justify-center mx-auto mb-4 border border-[rgba(239,68,68,0.3)]">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-[var(--fg)]">403 - Forbidden</h2>
          <p className="text-sm text-[var(--fg-muted)] mb-6">
            Access denied. You do not have administrator privileges required to access the Admin Area.
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full py-3 px-4 rounded-xl font-bold bg-[var(--primary)] text-[#0b0f17] hover:brightness-110 transition-all cursor-pointer shadow-lg"
          >
            Return to User Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] flex flex-col">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl border text-xs sm:text-sm font-semibold shadow-2xl flex items-center gap-2 max-w-md animate-in fade-in slide-in-from-top-2 duration-200 ${
            toastMessage.isError
              ? "bg-[#1f1315] text-[#f87171] border-[#7f1d1d]"
              : "bg-[#062016] text-[#34d399] border-[#065f46]"
          }`}
        >
          {toastMessage.isError ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 w-full max-w-[1700px] mx-auto p-3 sm:p-5 md:p-6 flex flex-col">
        {/* Header */}
        <Header currentUser={currentUser} onLogout={handleLogout} />

        {/* Admin Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-[var(--surface)] p-2.5 rounded-2xl border border-[var(--border)] shadow-xs">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 min-h-[38px] ${
                activeTab === "overview"
                  ? "bg-[var(--primary)] text-[#0b0f17] shadow-sm"
                  : "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)]"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Overview
            </button>

            <button
              onClick={() => setActiveTab("users")}
              className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 min-h-[38px] ${
                activeTab === "users"
                  ? "bg-[var(--primary)] text-[#0b0f17] shadow-sm"
                  : "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)]"
              }`}
            >
              <Users className="w-4 h-4" />
              Team Members ({users.length})
            </button>

            <button
              onClick={() => setActiveTab("leads")}
              className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 min-h-[38px] ${
                activeTab === "leads"
                  ? "bg-[var(--primary)] text-[#0b0f17] shadow-sm"
                  : "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)]"
              }`}
            >
              <Database className="w-4 h-4" />
              Team Leads Data
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/")}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] transition-all cursor-pointer flex items-center gap-1.5"
            >
              My Personal CRM
            </button>

            <button
              onClick={() => setIsAddUserModalOpen(true)}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[var(--green)] text-[#0b0f17] hover:brightness-110 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              Add Team Member
            </button>
          </div>
        </div>

        {/* TAB 1: OVERVIEW & METRICS */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Top Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[rgba(59,130,246,0.15)] text-[#60a5fa] border border-[rgba(59,130,246,0.3)] flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--fg-muted)]">Total Users</p>
                  <h3 className="text-2xl font-extrabold text-[var(--fg)] mt-0.5">{stats.totalUsers}</h3>
                </div>
              </div>

              <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[rgba(16,185,129,0.15)] text-[var(--green)] border border-[rgba(16,185,129,0.3)] flex items-center justify-center shrink-0">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--fg-muted)]">Active Users</p>
                  <h3 className="text-2xl font-extrabold text-[var(--fg)] mt-0.5">{stats.activeUsers}</h3>
                </div>
              </div>

              <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[rgba(245,158,11,0.15)] text-[var(--orange)] border border-[rgba(245,158,11,0.3)] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--fg-muted)]">Administrators</p>
                  <h3 className="text-2xl font-extrabold text-[var(--fg)] mt-0.5">{stats.adminsCount}</h3>
                </div>
              </div>

              <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[rgba(139,92,246,0.15)] text-[#a78bfa] border border-[rgba(139,92,246,0.3)] flex items-center justify-center shrink-0">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--fg-muted)]">Total Team Leads</p>
                  <h3 className="text-2xl font-extrabold text-[var(--fg)] mt-0.5">{stats.totalLeads}</h3>
                </div>
              </div>
            </div>

            {/* Leads Breakdown by User */}
            <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border)]">
                <div>
                  <h3 className="text-base font-bold text-[var(--fg)]">Leads Distribution by Team Member</h3>
                  <p className="text-xs text-[var(--fg-muted)] mt-0.5">Overview of leads owned by each account</p>
                </div>
                <button
                  onClick={fetchUsers}
                  className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-2)] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-all cursor-pointer"
                  title="Refresh statistics"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingUsers ? "animate-spin" : ""}`} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-[var(--fg)] truncate">{u.name}</p>
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-full ${
                            u.role === "admin"
                              ? "bg-[rgba(245,158,11,0.15)] text-[var(--orange)] border border-[rgba(245,158,11,0.3)]"
                              : "bg-[rgba(59,130,246,0.15)] text-[#60a5fa] border border-[rgba(59,130,246,0.3)]"
                          }`}
                        >
                          {u.role.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--fg-muted)] truncate mt-0.5">{u.email}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xl font-extrabold text-[var(--fg)]">{u.leadCount || 0}</span>
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--fg-muted)]">Leads</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TEAM MEMBERS MANAGEMENT */}
        {activeTab === "users" && (
          <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xs">
            {/* Toolbar Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-lg font-bold text-[var(--fg)]">Team Members Directory</h3>
                <p className="text-xs text-[var(--fg-muted)] mt-0.5">Manage user roles, status, and account privileges</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-64 max-w-full">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Search member by name or email..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[var(--bg)] border border-[var(--border)] focus:border-[var(--primary)] focus:outline-hidden text-[var(--fg)]"
                  />
                </div>

                <button
                  onClick={() => setIsAddUserModalOpen(true)}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-[var(--green)] text-[#0b0f17] hover:brightness-110 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 min-h-[38px]"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Member
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--surface-2)] text-[var(--fg-muted)] uppercase text-[10px] tracking-wider font-mono border-b border-[var(--border)]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">User</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Leads Owned</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-[var(--fg-muted)]">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[var(--primary)]" />
                        Loading team members...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-[var(--fg-muted)]">
                        No team members found.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-[var(--surface-2)] transition-colors">
                        <td className="px-4 py-3 font-bold text-[var(--fg)] flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-[#0b0f17] font-extrabold flex items-center justify-center text-xs shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{u.name}</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[var(--fg-muted)]">{u.email}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono font-bold rounded-full ${
                              u.role === "admin"
                                ? "bg-[rgba(245,158,11,0.15)] text-[var(--orange)] border border-[rgba(245,158,11,0.3)]"
                                : "bg-[rgba(59,130,246,0.15)] text-[#60a5fa] border border-[rgba(59,130,246,0.3)]"
                            }`}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {u.role === "admin" ? "Admin" : "User"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono font-bold rounded-full ${
                              u.status === "active"
                                ? "bg-[rgba(16,185,129,0.15)] text-[var(--green)] border border-[rgba(16,185,129,0.3)]"
                                : "bg-[rgba(239,68,68,0.15)] text-[var(--red)] border border-[rgba(239,68,68,0.3)]"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                u.status === "active" ? "bg-[var(--green)] animate-pulse" : "bg-[var(--red)]"
                              }`}
                            />
                            {u.status === "active" ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-[var(--fg)]">{u.leadCount || 0}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Role Toggle Action */}
                            {u.role === "user" ? (
                              <button
                                onClick={() =>
                                  setConfirmActionModal({
                                    isOpen: true,
                                    title: "Promote User to Admin",
                                    message: `Are you sure you want to promote ${u.name} (${u.email}) to Administrator?`,
                                    actionType: "PROMOTE",
                                    targetUser: u,
                                  })
                                }
                                className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-[rgba(245,158,11,0.15)] text-[var(--orange)] border border-[rgba(245,158,11,0.3)] hover:bg-[rgba(245,158,11,0.25)] transition-all cursor-pointer flex items-center gap-1"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Promote to Admin
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  setConfirmActionModal({
                                    isOpen: true,
                                    title: "Demote Admin to Normal User",
                                    message: `Are you sure you want to demote ${u.name} (${u.email}) to normal User?`,
                                    actionType: "DEMOTE",
                                    targetUser: u,
                                  })
                                }
                                className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-[rgba(59,130,246,0.15)] text-[#60a5fa] border border-[rgba(59,130,246,0.3)] hover:bg-[rgba(59,130,246,0.25)] transition-all cursor-pointer flex items-center gap-1"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                                Demote to User
                              </button>
                            )}

                            {/* Status Deactivate/Activate Action */}
                            {u.status === "active" ? (
                              <button
                                onClick={() =>
                                  setConfirmActionModal({
                                    isOpen: true,
                                    title: "Deactivate User Account",
                                    message: `Deactivating ${u.name} will invalidate their active session and prevent login. Their lead data will remain safely preserved. Continue?`,
                                    actionType: "DEACTIVATE",
                                    targetUser: u,
                                  })
                                }
                                className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-[rgba(239,68,68,0.15)] text-[var(--red)] border border-[rgba(239,68,68,0.3)] hover:bg-[rgba(239,68,68,0.25)] transition-all cursor-pointer flex items-center gap-1"
                              >
                                <UserX className="w-3.5 h-3.5" />
                                Deactivate
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  setConfirmActionModal({
                                    isOpen: true,
                                    title: "Re-activate User Account",
                                    message: `Allow ${u.name} to log in and manage CRM data again?`,
                                    actionType: "ACTIVATE",
                                    targetUser: u,
                                  })
                                }
                                className="px-2.5 py-1.5 text-[11px] font-semibold rounded-lg bg-[rgba(16,185,129,0.15)] text-[var(--green)] border border-[rgba(16,185,129,0.3)] hover:bg-[rgba(16,185,129,0.25)] transition-all cursor-pointer flex items-center gap-1"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                Activate
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: TEAM LEADS VIEW & SERVER-SIDE FILTERING */}
        {activeTab === "leads" && (
          <div className="space-y-4 flex-1 flex flex-col">
            {/* Owner Filter & Search Header */}
            <div className="bg-[var(--surface)] p-4 rounded-2xl border border-[var(--border)] shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 min-w-0">
                {/* Server-Side Owner Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--fg-muted)] flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5 text-[var(--primary)]" />
                    Filter by Owner:
                  </span>
                  <select
                    value={selectedOwnerFilter}
                    onChange={(e) => setSelectedOwnerFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl bg-[var(--bg)] border border-[var(--border-strong)] text-[var(--fg)] focus:outline-hidden cursor-pointer shadow-xs min-h-[36px]"
                  >
                    <option value="ALL">All Team Members ({teamLeads.length} leads)</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Lead Search Input */}
                <div className="relative w-64 max-w-full">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]" />
                  <input
                    type="text"
                    value={leadSearchQuery}
                    onChange={(e) => setLeadSearchQuery(e.target.value)}
                    placeholder="Search lead name, phone, project..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] focus:outline-hidden min-h-[36px]"
                  />
                </div>
              </div>

              {/* CSV Export & Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] transition-all cursor-pointer flex items-center gap-1.5 min-h-[36px]"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Team CSV
                </button>
              </div>
            </div>

            {/* Bulk Action Bar for Selected Team Leads */}
            {selectedLeadIds.length > 0 && (
              <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--primary)] shadow-lg animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-md bg-[var(--primary)] text-[#0b0f17]">
                    {selectedLeadIds.length}
                  </span>
                  <span className="text-xs font-semibold text-[var(--fg)]">
                    {selectedLeadIds.length === 1 ? "record selected" : "records selected"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedLeadIds([])}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-all cursor-pointer flex items-center gap-1 min-h-[36px]"
                  >
                    Clear
                  </button>

                  <button
                    onClick={() =>
                      setConfirmActionModal({
                        isOpen: true,
                        title: "Bulk Delete Selected Leads",
                        message: `Are you sure you want to delete ${selectedLeadIds.length} selected lead record(s)? This action cannot be undone.`,
                        actionType: "BULK_DELETE_LEADS",
                      })
                    }
                    className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[var(--red)] text-white hover:bg-[#dc2626] transition-all cursor-pointer flex items-center gap-1.5 shadow-sm min-h-[36px]"
                  >
                    Delete ({selectedLeadIds.length})
                  </button>
                </div>
              </div>
            )}

            {/* Reused LeadTable Component with Admin Data */}
            {loadingLeads ? (
              <div className="bg-[var(--surface)] p-12 rounded-2xl border border-[var(--border)] text-center text-[var(--fg-muted)]">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[var(--primary)]" />
                Loading team lead records...
              </div>
            ) : (
              <LeadTable
                tableId="admin_team_leads"
                columns={masterColumns}
                rows={filteredTeamLeads}
                selectedRowIds={selectedLeadIds}
                onSelectRows={setSelectedLeadIds}
                onSelectionChanged={(selectedData) => {
                  const ids = selectedData.map((d) => d._rowId || d._id).filter(Boolean);
                  setSelectedLeadIds(ids);
                }}
                onRowUpdate={async (rowId, updatedDataField, oldValue, fieldName) => {
                  try {
                    const res = await fetch(`/api/rows/${rowId}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ data: updatedDataField }),
                    });
                    const result = await res.json();
                    if (result.success) {
                      setTeamLeads((prev) => {
                        const updated = prev.map((r) =>
                          r._id === rowId
                            ? {
                                ...r,
                                data: { ...(r.data || {}), ...updatedDataField },
                              }
                            : r
                        );
                        return sortRowsByFollowupAndPriority(updated, masterColumns);
                      });
                      showToast("Lead updated successfully.");
                    } else {
                      showToast(result.message || "Failed to update lead.", true);
                      throw new Error(result.message);
                    }
                  } catch (err) {
                    showToast("Error updating lead.", true);
                    throw err;
                  }
                }}
                onOpenDrawer={(row) => setActiveDrawerLead(row)}
                onDeleteRow={(rowId) => {
                  setConfirmActionModal({
                    isOpen: true,
                    title: "Delete Lead",
                    message: "Are you sure you want to delete this lead record?",
                    actionType: "DELETE_LEAD",
                    targetLeadId: rowId,
                  });
                }}
                onReorderColumns={handleReorderAdminColumns}
                onDeleteColumn={(col) => {
                  setConfirmActionModal({
                    isOpen: true,
                    title: "Delete Column",
                    message: `Are you sure you want to delete column "${col.name}"? Column values across team leads will be removed.`,
                    actionType: "DELETE_COLUMN",
                    targetColumn: col,
                  });
                }}
              />
            )}
          </div>
        )}
      </main>

      {/* Drawer Component for Viewing/Editing Lead Details */}
      <LeadDetailsDrawer
        isOpen={!!activeDrawerLead}
        leadRow={activeDrawerLead}
        columns={masterColumns}
        onClose={() => setActiveDrawerLead(null)}
        onSaveLead={handleSaveDrawerLead}
      />

      {/* MODAL: ADD USER */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#111827] border border-[var(--border-strong)] rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-base font-bold text-[var(--fg)] flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[var(--green)]" />
                Add New Team Member
              </h3>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-[var(--fg-muted)] hover:text-[var(--fg)] p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {addUserError && (
              <div className="p-3 rounded-xl bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.3)] text-[var(--red)] text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addUserError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUserSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[var(--fg-muted)] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  placeholder="e.g. Amit Sharma"
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] focus:border-[var(--primary)] text-[var(--fg)] outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-[var(--fg-muted)] mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  placeholder="e.g. amit@company.com"
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] focus:border-[var(--primary)] text-[var(--fg)] outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-[var(--fg-muted)] mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  placeholder="At least 8 characters"
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] focus:border-[var(--primary)] text-[var(--fg)] outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-[var(--fg-muted)] mb-1">Assigned Role</label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] focus:border-[var(--primary)] text-[var(--fg)] outline-hidden cursor-pointer font-bold"
                >
                  <option value="user">Normal User (Accesses own data only)</option>
                  <option value="admin">Administrator (Full team access)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold border border-[var(--border)] text-[var(--fg-muted)] hover:bg-[var(--surface-2)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUser}
                  className="px-4 py-2 rounded-xl font-bold bg-[var(--green)] text-[#0b0f17] hover:brightness-110 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmittingUser && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={confirmActionModal.isOpen}
        title={confirmActionModal.title}
        message={confirmActionModal.message}
        confirmText="Confirm Action"
        onClose={() => setConfirmActionModal({ ...confirmActionModal, isOpen: false })}
        onConfirm={async () => {
          const { actionType, targetUser, targetLeadId, targetColumn } = confirmActionModal;
          setConfirmActionModal({ ...confirmActionModal, isOpen: false });

          if (actionType === "PROMOTE" && targetUser) {
            await handleRoleChange(targetUser.id, "admin");
          } else if (actionType === "DEMOTE" && targetUser) {
            await handleRoleChange(targetUser.id, "user");
          } else if (actionType === "DEACTIVATE" && targetUser) {
            await handleStatusChange(targetUser.id, "inactive");
          } else if (actionType === "ACTIVATE" && targetUser) {
            await handleStatusChange(targetUser.id, "active");
          } else if (actionType === "DELETE_LEAD" && targetLeadId) {
            await handleDeleteLead(targetLeadId);
          } else if (actionType === "BULK_DELETE_LEADS") {
            await handleBulkDeleteLeads();
          } else if (actionType === "DELETE_COLUMN" && targetColumn) {
            await handleDeleteAdminColumn(targetColumn);
          }
        }}
      />
    </div>
  );
}
