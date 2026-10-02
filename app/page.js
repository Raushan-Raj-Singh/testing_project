"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Header from "@/components/Header";
import DashboardStats from "@/components/DashboardStats";
import LeadActivityChart from "@/components/LeadActivityChart";
import LeadStatusDonut from "@/components/LeadStatusDonut";
import Toolbar from "@/components/Toolbar";

import LeadTable from "@/components/LeadTable";
import KanbanBoard from "@/components/KanbanBoard";
import LeadDetailsDrawer from "@/components/LeadDetailsDrawer";

import AddColumnModal from "@/components/AddColumnModal";
import ImportModal from "@/components/ImportModal";
import BulkEditModal from "@/components/BulkEditModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { getFollowupCategory, sortRowsByFollowupAndPriority } from "@/utils/followup";
import { exportToCSV } from "@/utils/csvExport";

export default function Home() {

  const [table, setTable] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Navigation & View Mode State
  const [activeView, setActiveView] = useState("table");
  const [activeDrawerLead, setActiveDrawerLead] = useState(null);

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [followupFilter, setFollowupFilter] = useState("ALL");
  const [selectedRows, setSelectedRows] = useState([]);
  const [hiddenColumnIds, setHiddenColumnIds] = useState([]);
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);

  // Modals & Confirmation state
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState(null);
  const [deleteColTarget, setDeleteColTarget] = useState(null);
  const [deleteRowTarget, setDeleteRowTarget] = useState(null);
  const [isDeleteSelectedOpen, setIsDeleteSelectedOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);

  const tableRef = useRef(null);

  const showToast = useCallback((msg, isError = false) => {
    setToastMessage({ text: msg, isError });
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const handleSaveDrawerLead = useCallback(
    async (rowId, updatedFields) => {
      const res = await fetch(`/api/rows/${rowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: updatedFields }),
      });

      const result = await res.json();
      if (result.success) {
        setRows((prev) => {
          const updated = prev.map((r) => (r._id === rowId ? result.data : r));
          return sortRowsByFollowupAndPriority(updated, table?.columns || []);
        });
        showToast("Lead details updated successfully.");
      } else {
        showToast(result.message || "Failed to update lead.", true);
        throw new Error(result.message);
      }
    },
    [table, showToast]
  );



  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [tableRes, rowsRes] = await Promise.all([
        fetch("/api/table"),
        fetch("/api/rows"),
      ]);

      const tableData = await tableRes.json();
      const rowsData = await rowsRes.json();

      if (tableData.success && rowsData.success) {
        setTable(tableData.data);
        setRows(sortRowsByFollowupAndPriority(rowsData.data, tableData.data.columns || []));
      } else {
        if (tableData.success) setTable(tableData.data);
        else setError(tableData.message || "Failed to load table schema.");

        if (rowsData.success) setRows(rowsData.data);
        else setError(rowsData.message || "Failed to load row data.");
      }
    } catch (err) {
      console.error("Data loading error:", err);
      setError("Error connecting to database.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [tableRes, rowsRes] = await Promise.all([
          fetch("/api/table"),
          fetch("/api/rows"),
        ]);

        const tableData = await tableRes.json();
        const rowsData = await rowsRes.json();

        if (!ignore) {
          if (tableData.success && rowsData.success) {
            setTable(tableData.data);
            setRows(sortRowsByFollowupAndPriority(rowsData.data, tableData.data.columns || []));
          } else {
            if (tableData.success) {
              setTable(tableData.data);
            } else {
              setError(tableData.message || "Failed to load table schema.");
            }

            if (rowsData.success) {
              setRows(rowsData.data);
            } else {
              setError(rowsData.message || "Failed to load row data.");
            }
          }
        }
      } catch (err) {
        if (!ignore) setError("Error connecting to database.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadData();
    return () => {
      ignore = true;
    };
  }, []);

  const filteredRows = useMemo(() => {
    if (!rows || !rows.length) return [];

    const columns = table?.columns || [];
    const statusCol = columns.find(
      (c) => c.special === "status" || c.id === "status" || (c.type === "dropdown" && c.name.toLowerCase() === "status")
    );
    const priorityCol = columns.find((c) => c.special === "priority");
    const followupCol = columns.find((c) => c.special === "followup");

    const query = searchQuery.trim().toLowerCase();
    const today = new Date();

    return rows.filter((row) => {
      const data = row.data || {};

      if (query) {
        const matchesQuery = Object.values(data).some((val) => {
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(query);
        });
        if (!matchesQuery) return false;
      }

      if (statusFilter !== "ALL" && statusCol) {
        const val = data[statusCol.id];
        if (val !== statusFilter) return false;
      }

      if (priorityFilter !== "ALL" && priorityCol) {
        const val = data[priorityCol.id];
        if (val !== priorityFilter) return false;
      }

      if (followupFilter !== "ALL" && followupCol) {
        const val = data[followupCol.id];
        const category = getFollowupCategory(val, today);
        if (category !== followupFilter) return false;
      }

      return true;
    });
  }, [rows, table, searchQuery, statusFilter, priorityFilter, followupFilter]);

  const handleToggleColumnVisibility = useCallback((colId) => {
    setHiddenColumnIds((prev) =>
      prev.includes(colId) ? prev.filter((id) => id !== colId) : [...prev, colId]
    );
  }, []);

  const handleShowAllColumns = useCallback(() => {
    setHiddenColumnIds([]);
  }, []);

  const handleResetAllFilters = useCallback(() => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
    setFollowupFilter("ALL");
  }, []);

  const handleResetTableView = useCallback(() => {
    setHiddenColumnIds([]);
    setSearchQuery("");
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
    setFollowupFilter("ALL");
    if (tableRef.current?.resetColumnState) {
      tableRef.current.resetColumnState();
    }
    showToast("Table view restored to defaults.");
  }, [showToast]);

  const handleClearSelection = useCallback(() => {
    if (tableRef.current?.clearSelection) {
      tableRef.current.clearSelection();
    }
    setSelectedRows([]);
  }, []);

  const handleExportCurrentView = useCallback(() => {
    if (!filteredRows.length) {
      showToast("No records available to export.", true);
      return;
    }
    exportToCSV(filteredRows, table?.columns || [], "leads-current-view.csv");
    showToast(`Exported ${filteredRows.length} records to CSV.`);
  }, [filteredRows, table, showToast]);

  const handleExportAll = useCallback(() => {
    if (!rows.length) {
      showToast("No lead records available to export.", true);
      return;
    }
    exportToCSV(rows, table?.columns || [], "leads-all-data.csv");
    showToast(`Exported all ${rows.length} lead records to CSV.`);
  }, [rows, table, showToast]);

  const handleImportSuccess = useCallback(
    (newImportedRows, validCount) => {
      showToast(`Successfully imported ${validCount} lead records.`);
      fetchData();
    },
    [fetchData, showToast]
  );

  const handleConfirmBulkEdit = useCallback(
    async ({ columnId, value }) => {
      if (!selectedRows.length) return;

      const targetRowIds = selectedRows.map((r) => r._rowId || r._id);
      const updatePayload = { [columnId]: value };

      const res = await fetch("/api/rows/batch", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rowIds: targetRowIds,
          data: updatePayload,
        }),
      });

      const result = await res.json();
      if (result.success) {
        const updatedIdsSet = new Set(targetRowIds);
        setRows((prev) => {
          const updated = prev.map((r) => {
            if (updatedIdsSet.has(r._id)) {
              return {
                ...r,
                data: { ...(r.data || {}), ...updatePayload },
              };
            }
            return r;
          });
          return sortRowsByFollowupAndPriority(updated, table?.columns || []);
        });
        showToast(`Bulk updated ${selectedRows.length} selected records.`);
        handleClearSelection();
      } else {
        throw new Error(result.message || "Failed to bulk update rows.");
      }
    },
    [selectedRows, table, handleClearSelection, showToast]
  );

  const handleSaveColumn = async (colData) => {
    try {
      let res;
      if (editingColumn) {
        res = await fetch(`/api/table/column/${editingColumn.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(colData),
        });
      } else {
        res = await fetch("/api/table/column", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(colData),
        });
      }

      const result = await res.json();
      if (result.success) {
        setTable(result.data);
        showToast(
          editingColumn
            ? `Column "${colData.name}" updated successfully.`
            : `Column "${colData.name}" created successfully.`
        );
        await fetchData();
      } else {
        throw new Error(result.message || "Failed to save column.");
      }
    } catch (err) {
      showToast(err.message || "Column save failed.", true);
      throw err;
    }
  };

  const handleConfirmDeleteColumn = async () => {
    if (!deleteColTarget) return;

    try {
      const res = await fetch(`/api/table/column/${deleteColTarget.id}`, {
        method: "DELETE",
      });

      const result = await res.json();
      if (result.success) {
        setTable(result.data);
        if (deleteColTarget.special === "followup") {
          setFollowupFilter("ALL");
        }
        if (deleteColTarget.special === "priority") {
          setPriorityFilter("ALL");
        }
        showToast(`Column "${deleteColTarget.name}" deleted.`);
        setDeleteColTarget(null);
        fetchData();
      } else {
        showToast(result.message || "Failed to delete column.", true);
      }
    } catch (err) {
      showToast("Error deleting column.", true);
    }
  };

  const handleAddRow = async () => {
    try {
      const initialData = {};
      (table?.columns || []).forEach((col) => {
        if (col.type === "checkbox") {
          initialData[col.id] = false;
        } else {
          initialData[col.id] = "";
        }
      });

      const res = await fetch("/api/rows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: initialData }),
      });

      const result = await res.json();
      if (result.success) {
        setRows((prev) => {
          const updated = [result.data, ...prev];
          return sortRowsByFollowupAndPriority(updated, table?.columns || []);
        });
        setSearchQuery("");
        setStatusFilter("ALL");
        setPriorityFilter("ALL");
        setFollowupFilter("ALL");
        showToast("New row added.");
      } else {
        showToast(result.message || "Failed to add row.", true);
      }
    } catch (err) {
      showToast("Error adding new row.", true);
    }
  };

  const handleUpdateCell = async (rowId, updatedDataField, oldValue, fieldName) => {
    try {
      const res = await fetch(`/api/rows/${rowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: updatedDataField }),
      });

      const result = await res.json();
      if (result.success) {
        setRows((prev) => {
          const updated = prev.map((r) => (r._id === rowId ? result.data : r));
          const cols = table?.columns || [];
          const followupCol = cols.find((c) => c.special === "followup");
          const priorityCol = cols.find((c) => c.special === "priority");

          const updatedKeys = Object.keys(updatedDataField);
          const affectsSorting = updatedKeys.some(
            (k) => (followupCol && k === followupCol.id) || (priorityCol && k === priorityCol.id)
          );

          return affectsSorting ? sortRowsByFollowupAndPriority(updated, cols) : updated;
        });
        showToast("Cell updated.");
      } else {
        showToast(result.message || "Failed to update cell value.", true);
        throw new Error(result.message);
      }
    } catch (err) {
      showToast("Error saving cell update.", true);
      throw err;
    }
  };

  const handleConfirmDeleteRow = async () => {
    if (!deleteRowTarget) return;

    const rowId = deleteRowTarget._rowId || deleteRowTarget._id;
    try {
      const res = await fetch(`/api/rows/${rowId}`, {
        method: "DELETE",
      });

      const result = await res.json();
      if (result.success) {
        setRows((prev) => prev.filter((r) => r._id !== rowId));
        showToast("Row deleted.");
        setDeleteRowTarget(null);
      } else {
        showToast(result.message || "Failed to delete row.", true);
      }
    } catch (err) {
      showToast("Error deleting row.", true);
    }
  };

  const handleConfirmDeleteSelected = async () => {
    if (!selectedRows.length || isDeletingSelected) return;

    try {
      setIsDeletingSelected(true);
      const deletePromises = selectedRows.map((r) => {
        const id = r._rowId || r._id;
        return fetch(`/api/rows/${id}`, { method: "DELETE" });
      });

      await Promise.all(deletePromises);
      const deletedIds = selectedRows.map((r) => r._rowId || r._id);

      setRows((prev) => prev.filter((r) => !deletedIds.includes(r._id)));
      showToast(`Deleted ${selectedRows.length} selected records.`);
      handleClearSelection();
      setIsDeleteSelectedOpen(false);
    } catch (err) {
      showToast("Error performing bulk row deletion.", true);
    } finally {
      setIsDeletingSelected(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col p-4 md:p-6"
      style={{ backgroundColor: "var(--bg)", color: "var(--fg)" }}
    >
      {toastMessage && (
        <div
          className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-lg border text-xs font-semibold shadow-lg animate-in slide-in-from-bottom duration-200"
          style={{
            backgroundColor: toastMessage.isError
              ? "var(--danger-bg)"
              : "var(--surface-2)",
            borderColor: toastMessage.isError
              ? "var(--danger)"
              : "var(--accent)",
            color: toastMessage.isError ? "var(--danger)" : "var(--fg)",
          }}
        >
          {toastMessage.text}
        </div>
      )}

      {/* Top Header Bar */}
      <Header activeView={activeView} onViewChange={setActiveView} />


      {/* Main Layout Container */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto flex flex-col gap-4">
        {/* Top KPI Cards Grid */}
        <DashboardStats rows={rows} columns={table?.columns || []} />

        {/* Phase 5 & 6 Analytics Suite */}
        <div id="analytics-container" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <LeadActivityChart rows={rows} />
          <LeadStatusDonut rows={rows} columns={table?.columns || []} />
        </div>


        {/* Lead Toolbar */}
        <Toolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          columns={table?.columns || []}
          hiddenColumnIds={hiddenColumnIds}
          onToggleColumnVisibility={handleToggleColumnVisibility}
          onShowAllColumns={handleShowAllColumns}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={setPriorityFilter}
          followupFilter={followupFilter}
          onFollowupFilterChange={setFollowupFilter}
          onResetAllFilters={handleResetAllFilters}
          onResetTableView={handleResetTableView}
          selectedCount={selectedRows.length}
          isDeletingSelected={isDeletingSelected}
          onDeleteSelected={() => setIsDeleteSelectedOpen(true)}
          onClearSelection={handleClearSelection}
          onBulkEdit={() => setIsBulkEditOpen(true)}
          onOpenImport={() => setIsImportOpen(true)}
          onExportCurrentView={handleExportCurrentView}
          onExportAll={handleExportAll}
          filteredCount={filteredRows.length}
          totalRowsCount={rows.length}
          onAddColumn={() => {
            setEditingColumn(null);
            setIsAddColumnOpen(true);
          }}
          onAddRow={handleAddRow}
        />

        {/* Data View Section: AG Grid Table or Kanban Board */}
        <div className="flex-1 min-h-[450px] relative z-10">
          {activeView === "kanban" ? (
            <KanbanBoard
              rows={filteredRows}
              columns={table?.columns || []}
              onOpenDrawer={(row) => setActiveDrawerLead(row)}
              onRowUpdate={handleUpdateCell}
            />
          ) : (
            <LeadTable
              ref={tableRef}
              tableId={table?._id}
              columns={table?.columns || []}
              rows={filteredRows}
              totalRowsCount={rows.length}
              hiddenColumnIds={hiddenColumnIds}
              loading={loading}
              error={error}
              onRowUpdate={handleUpdateCell}
              onRowDelete={(row) => setDeleteRowTarget(row)}
              onEditColumn={(col) => {
                setEditingColumn(col);
                setIsAddColumnOpen(true);
              }}
              onDeleteColumn={(col) => setDeleteColTarget(col)}
              onSelectionChanged={setSelectedRows}
              onOpenDrawer={(row) => setActiveDrawerLead(row)}
              onAddRow={handleAddRow}
              onResetFilters={handleResetAllFilters}
              onRetryLoad={fetchData}
            />
          )}
        </div>

      </main>


      {/* Lead Details Slide-Over Drawer */}
      <LeadDetailsDrawer
        isOpen={!!activeDrawerLead}
        onClose={() => setActiveDrawerLead(null)}
        leadRow={
          activeDrawerLead
            ? rows.find((r) => r._id === (activeDrawerLead._rowId || activeDrawerLead._id)) || activeDrawerLead
            : null
        }
        columns={table?.columns || []}
        onSaveLead={handleSaveDrawerLead}
      />

      {/* Modals */}
      <AddColumnModal

        isOpen={isAddColumnOpen}
        onClose={() => {
          setIsAddColumnOpen(false);
          setEditingColumn(null);
        }}
        onSave={handleSaveColumn}
        existingColumns={table?.columns || []}
        editingColumn={editingColumn}
      />

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        columns={table?.columns || []}
        onImportSuccess={handleImportSuccess}
      />

      <BulkEditModal
        isOpen={isBulkEditOpen}
        onClose={() => setIsBulkEditOpen(false)}
        columns={table?.columns || []}
        selectedCount={selectedRows.length}
        onConfirmBulkEdit={handleConfirmBulkEdit}
      />

      <ConfirmDialog
        isOpen={!!deleteColTarget}
        title="Delete Column"
        message={
          deleteColTarget
            ? `Delete "${deleteColTarget.name}"? This removes the column and its data from every row.`
            : ""
        }
        confirmText="Delete Column"
        onConfirm={handleConfirmDeleteColumn}
        onCancel={() => setDeleteColTarget(null)}
      />

      <ConfirmDialog
        isOpen={!!deleteRowTarget}
        title="Delete Row"
        message="Delete this row?"
        confirmText="Delete Row"
        onConfirm={handleConfirmDeleteRow}
        onCancel={() => setDeleteRowTarget(null)}
      />

      <ConfirmDialog
        isOpen={isDeleteSelectedOpen}
        title="Delete Selected Records"
        message={`Delete ${selectedRows.length} selected records?`}
        confirmText="Delete Selected"
        loading={isDeletingSelected}
        onConfirm={handleConfirmDeleteSelected}
        onCancel={() => setIsDeleteSelectedOpen(false)}
      />
    </div>
  );
}
