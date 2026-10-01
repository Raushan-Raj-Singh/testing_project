"use client";

import React, {
  useMemo,
  useCallback,
  useRef,
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import { AgGridReact, useGridCellEditor } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { getFollowupCategory } from "@/utils/followup";
import { Edit2, Trash2, Calendar, Plus, RotateCcw, AlertTriangle, FileX, Loader2 } from "lucide-react";

ModuleRegistry.registerModules([AllCommunityModule]);

/**
 * Custom Date Cell Editor - Opens Native Calendar Picker
 */
const DateCellEditor = forwardRef(({ value, onValueChange, stopEditing, api }, ref) => {
  const initialVal = value && value !== "No Date" ? value : "";
  const [val, setVal] = useState(initialVal);
  const inputRef = useRef(null);
  const valRef = useRef(initialVal);

  useGridCellEditor({
    getValue() {
      if (inputRef.current && inputRef.current.value !== undefined) {
        valRef.current = inputRef.current.value;
      }
      return valRef.current;
    },
    isCancelAfterEnd() {
      return false;
    },
  });

  useImperativeHandle(ref, () => ({
    getValue() {
      if (inputRef.current && inputRef.current.value !== undefined) {
        valRef.current = inputRef.current.value;
      }
      return valRef.current;
    },
    isCancelAfterEnd() {
      return false;
    },
  }));

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const updateValue = (newVal) => {
    const cleanVal = newVal && newVal !== "No Date" ? newVal : "";
    valRef.current = cleanVal;
    setVal(cleanVal);
    if (onValueChange) {
      onValueChange(cleanVal);
    }
  };

  const handleSave = () => {
    let finalVal = valRef.current;
    if (inputRef.current && inputRef.current.value !== undefined) {
      finalVal = inputRef.current.value;
      valRef.current = finalVal;
    }
    if (onValueChange) {
      onValueChange(finalVal);
    }
    setTimeout(() => {
      if (stopEditing) {
        stopEditing(false);
      } else if (api) {
        api.stopEditing(false);
      }
    }, 0);
  };

  const handleChange = (e) => {
    console.log("[DATE E2E] onChange event:", e.target.value);
    updateValue(e.target.value);
  };

  return (
    <div
      className="flex items-center gap-1.5 w-full h-full px-2 py-1 bg-[var(--surface)] border border-[var(--accent)] rounded-md shadow-lg"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        ref={inputRef}
        type="date"
        aria-label="Select Date"
        value={val}
        onChange={handleChange}
        onInput={handleChange}
        onBlur={(e) => {
          if (e.target.value !== undefined) {
            updateValue(e.target.value);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSave();
          }
          if (e.key === "Escape") {
            if (stopEditing) stopEditing(true);
            else if (api) api.stopEditing(true);
          }
        }}
        className="flex-1 h-8 bg-[var(--surface-2)] text-[var(--fg)] border border-[var(--border)] rounded px-2 font-mono text-xs focus:outline-hidden focus:border-[var(--accent)]"
        style={{ colorScheme: "dark" }}
      />
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.stopPropagation();
          handleSave();
        }}
        className="px-2.5 py-1 text-xs font-semibold rounded bg-[var(--accent)] text-[var(--accent-fg)] hover:opacity-90 shrink-0 cursor-pointer shadow-xs"
      >
        OK
      </button>
    </div>
  );
});
DateCellEditor.displayName = "DateCellEditor";

/**
 * Custom DateTime Cell Editor - Opens Native Calendar & Time Picker
 */
const DateTimeCellEditor = forwardRef(({ value, onValueChange, stopEditing, api }, ref) => {
  const initialVal = value && value !== "No Date" ? value : "";
  const [val, setVal] = useState(initialVal);
  const inputRef = useRef(null);
  const valRef = useRef(initialVal);

  useGridCellEditor({
    getValue() {
      if (inputRef.current && inputRef.current.value !== undefined) {
        valRef.current = inputRef.current.value;
      }
      return valRef.current;
    },
    isCancelAfterEnd() {
      return false;
    },
  });

  useImperativeHandle(ref, () => ({
    getValue() {
      if (inputRef.current && inputRef.current.value !== undefined) {
        valRef.current = inputRef.current.value;
      }
      return valRef.current;
    },
    isCancelAfterEnd() {
      return false;
    },
  }));

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const updateValue = (newVal) => {
    const cleanVal = newVal && newVal !== "No Date" ? newVal : "";
    valRef.current = cleanVal;
    setVal(cleanVal);
    if (onValueChange) {
      onValueChange(cleanVal);
    }
  };

  const handleSave = () => {
    if (inputRef.current && inputRef.current.value !== undefined) {
      valRef.current = inputRef.current.value;
      if (onValueChange) onValueChange(inputRef.current.value);
    }
    if (stopEditing) {
      stopEditing(false);
    } else if (api) {
      api.stopEditing(false);
    }
  };

  const handleChange = (e) => {
    updateValue(e.target.value);
  };

  return (
    <div
      className="flex items-center gap-1.5 w-full h-full px-2 py-1 bg-[var(--surface)] border border-[var(--accent)] rounded-md shadow-lg"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        ref={inputRef}
        type="datetime-local"
        aria-label="Select Date and Time"
        value={val}
        onChange={handleChange}
        onInput={handleChange}
        onBlur={(e) => {
          if (e.target.value !== undefined) {
            updateValue(e.target.value);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSave();
          }
          if (e.key === "Escape") {
            if (stopEditing) stopEditing(true);
            else if (api) api.stopEditing(true);
          }
        }}
        className="flex-1 h-8 bg-[var(--surface-2)] text-[var(--fg)] border border-[var(--border)] rounded px-2 font-mono text-xs focus:outline-hidden focus:border-[var(--accent)]"
        style={{ colorScheme: "dark" }}
      />
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.stopPropagation();
          handleSave();
        }}
        className="px-2.5 py-1 text-xs font-semibold rounded bg-[var(--accent)] text-[var(--accent-fg)] hover:opacity-90 shrink-0 cursor-pointer shadow-xs"
      >
        OK
      </button>
    </div>
  );
});
/**
 * Custom Sharp Dark Select Cell Editor
 */
const SelectCellEditor = forwardRef(({ value, options = [], colDef, column, stopEditing, api, node }, ref) => {
  const [val, setVal] = useState(value || "");
  const selectRef = useRef(null);

  // Fallback options list from column schema or defaults
  const availableOptions = useMemo(() => {
    if (Array.isArray(options) && options.length > 0) return options;
    if (column && Array.isArray(column.options) && column.options.length > 0) return column.options;
    if (colDef && colDef.cellEditorParams && Array.isArray(colDef.cellEditorParams.options)) {
      return colDef.cellEditorParams.options;
    }
    return ["New", "Follow-up", "Qualified", "Closed", "Lost"];
  }, [options, column, colDef]);

  useGridCellEditor({
    getValue() {
      return selectRef.current ? selectRef.current.value : val;
    },
    isCancelAfterEnd() {
      return false;
    },
  });

  useImperativeHandle(ref, () => ({
    getValue() {
      return selectRef.current ? selectRef.current.value : val;
    },
    isCancelAfterEnd() {
      return false;
    },
  }));

  useEffect(() => {
    if (selectRef.current) {
      selectRef.current.focus();
    }
  }, []);

  const handleChange = (e) => {
    const newVal = e.target.value;
    setVal(newVal);
    if (selectRef.current) {
      selectRef.current.value = newVal;
    }
    // Immediately stop editing so AG Grid triggers handleCellValueChanged
    if (stopEditing) {
      stopEditing(false);
    } else if (api) {
      api.stopEditing(false);
    }
  };

  return (
    <div
      className="flex items-center w-full h-full px-1 py-0.5 bg-[#111827] border-2 border-[#3b82f6] rounded-lg shadow-2xl z-50"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <select
        ref={selectRef}
        aria-label="Select Dropdown Option"
        value={val}
        onChange={handleChange}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === "Escape") {
            if (stopEditing) stopEditing(false);
            else if (api) api.stopEditing(false);
          }
        }}
        className="w-full h-8 px-2.5 bg-[#1f293d] text-[#f9fafb] text-xs font-semibold rounded-md border border-[rgba(255,255,255,0.15)] focus:outline-hidden cursor-pointer"
      >
        {availableOptions.map((opt) => (
          <option key={opt} value={opt} className="bg-[#111827] text-[#f9fafb] py-1.5 px-2">
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
});
SelectCellEditor.displayName = "SelectCellEditor";



function CheckboxCellRenderer({ value, node, colDef }) {

  const handleChange = (e) => {
    node.setDataValue(colDef.field, e.target.checked);
  };

  return (
    <div className="flex items-center justify-center h-full">
      <input
        type="checkbox"
        aria-label={`Toggle ${colDef.headerName || "checkbox"}`}
        checked={!!value}
        onChange={handleChange}
        className="w-4 h-4 cursor-pointer accent-[var(--accent)] rounded-xs"
      />
    </div>
  );
}

import StatusBadge from "@/components/StatusBadge";
import PriorityBadge from "@/components/PriorityBadge";
import { Phone, Mail, Calendar as CalendarIcon, MoreVertical } from "lucide-react";

function StatusCellRenderer({ value }) {
  return <StatusBadge value={value} />;
}

function PriorityCellRenderer({ value }) {
  return <PriorityBadge value={value} />;
}


function FollowupCellRenderer({ value }) {
  if (!value) {
    return (
      <span className="px-2 py-0.5 text-[10px] font-mono rounded text-[var(--fg-muted)] bg-[var(--surface-2)]">
        No Date
      </span>
    );
  }

  const category = getFollowupCategory(value);

  let badgeStyle = {
    backgroundColor: "var(--surface-2)",
    color: "var(--fg-muted)",
  };

  if (category === "Today") {
    badgeStyle = {
      backgroundColor: "var(--accent)",
      color: "var(--accent-fg)",
    };
  } else if (category === "Overdue") {
    badgeStyle = {
      backgroundColor: "var(--danger-bg)",
      color: "var(--danger)",
    };
  } else if (category === "Tomorrow" || category === "Upcoming") {
    badgeStyle = {
      backgroundColor: "var(--info-bg)",
      color: "var(--info)",
    };
  }

  return (
    <div className="flex items-center gap-2 font-mono text-xs h-full">
      <span>{value}</span>
      <span
        className="px-2 py-0.5 text-[10px] font-semibold rounded-full flex items-center gap-1 shrink-0"
        style={badgeStyle}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{
            backgroundColor:
              category === "Today" ? "var(--accent-fg)" : badgeStyle.color,
          }}
        />
        {category}
      </span>
    </div>
  );
}

const LeadTable = forwardRef(function LeadTable(
  {
    tableId,
    columns = [],
    rows = [],
    totalRowsCount = 0,
    hiddenColumnIds = [],
    loading = false,
    error = null,
    onRowUpdate,
    onRowDelete,
    onEditColumn,
    onDeleteColumn,
    onSelectionChanged,
    onOpenDrawer,
    onAddRow,

    onResetFilters,
    onRetryLoad,
  },
  ref
) {
  const gridRef = useRef(null);

  useImperativeHandle(ref, () => ({
    clearSelection() {
      if (gridRef.current?.api) {
        gridRef.current.api.deselectAll();
      }
    },
    resetColumnState() {
      if (gridRef.current?.api) {
        gridRef.current.api.resetColumnState();
        if (tableId && typeof window !== "undefined") {
          try {
            localStorage.removeItem(`lead-table-state-${tableId}`);
          } catch {
            // Ignore storage errors
          }
        }
      }
    },
  }));

  // Session table state persistence (Column widths, order, visual state)
  const saveGridState = useCallback(() => {
    if (!tableId || !gridRef.current?.api || typeof window === "undefined") return;
    try {
      const state = gridRef.current.api.getColumnState();
      localStorage.setItem(`lead-table-state-${tableId}`, JSON.stringify(state));
    } catch {
      // Ignore storage errors
    }
  }, [tableId]);

  const onGridReady = useCallback(() => {
    if (!tableId || !gridRef.current?.api || typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(`lead-table-state-${tableId}`);
      if (saved) {
        const state = JSON.parse(saved);
        if (Array.isArray(state) && state.length) {
          const currentColumnIds = new Set(columns.map((c) => c.id));
          const validState = state.filter((s) => {
            if (!s.colId) return true;
            if (s.colId === "0" || s.colId === "1" || s.colId === "ag-Grid-AutoColumn") return true;
            return currentColumnIds.has(s.colId);
          });
          gridRef.current.api.applyColumnState({ state: validState, applyOrder: true });
        }
      }
    } catch {
      // Ignore corrupted stored state safely
    }
  }, [tableId, columns]);

  const CustomHeader = useCallback(
    ({ displayName, column }) => {
      const colId = column.getColId();
      const colDefObj = columns.find((c) => c.id === colId);

      const isFollowup = colDefObj?.special === "followup";
      const isPriority = colDefObj?.special === "priority";

      return (
        <div className="flex items-center justify-between w-full group py-1">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-semibold text-xs text-[var(--fg)]">
              {displayName}
            </span>
            {isFollowup && (
              <span
                className="px-1.5 py-0.2 text-[9px] font-bold rounded uppercase tracking-wider"
                style={{
                  backgroundColor: "var(--warning-bg)",
                  color: "var(--accent)",
                }}
              >
                FOLLOW-UP
              </span>
            )}
            {isPriority && (
              <span
                className="px-1.5 py-0.2 text-[9px] font-bold rounded uppercase tracking-wider"
                style={{
                  backgroundColor: "var(--warning-bg)",
                  color: "var(--accent)",
                }}
              >
                PRIORITY
              </span>
            )}
          </div>
          {colDefObj && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                aria-label={`Edit ${colDefObj.name} column`}
                onClick={(e) => {
                  e.stopPropagation();
                  onEditColumn(colDefObj);
                }}
                className="p-0.5 rounded hover:bg-[var(--surface-2)] text-[var(--fg-muted)] hover:text-[var(--accent)] focus:outline-hidden"
                title="Edit Column"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                type="button"
                aria-label={`Delete ${colDefObj.name} column`}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteColumn(colDefObj);
                }}
                className="p-0.5 rounded hover:bg-[var(--danger-bg)] text-[var(--fg-muted)] hover:text-[var(--danger)] focus:outline-hidden"
                title="Delete Column"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      );
    },
    [columns, onEditColumn, onDeleteColumn]
  );

  const columnDefs = useMemo(() => {
    const colDefs = [
      {
        headerName: "",
        checkboxSelection: true,
        headerCheckboxSelection: true,
        width: 40,
        pinned: "left",
        resizable: false,
        sortable: false,
        filter: false,
      },
      {
        headerName: "S.No",
        valueGetter: (params) => params.node.rowIndex + 1,
        width: 60,
        pinned: "left",
        resizable: false,
        sortable: false,
        filter: false,
        cellStyle: {
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          color: "var(--fg-muted)",
          display: "flex",
          alignItems: "center",
        },
      },
    ];

    columns.forEach((column) => {
      const colId = column.id;
      const isPriority = column.special === "priority";
      const isFollowup = column.special === "followup";
      const isHidden = hiddenColumnIds.includes(colId);

      const colDef = {
        field: colId,
        headerName: column.name,
        headerComponent: CustomHeader,
        editable: true,
        resizable: true,
        sortable: true,
        hide: isHidden,
        minWidth: 140,
      };

      switch (column.type) {
        case "longText":
          colDef.cellEditor = "agLargeTextCellEditor";
          colDef.cellEditorPopup = true;
          colDef.filter = "agTextColumnFilter";
          break;

        case "number":
          colDef.cellEditor = "agNumberCellEditor";
          colDef.cellStyle = { fontFamily: "var(--font-mono)" };
          colDef.filter = "agNumberColumnFilter";
          break;

        case "phone":
          colDef.cellStyle = { fontFamily: "var(--font-mono)" };
          colDef.filter = "agTextColumnFilter";
          break;

        case "date":
          colDef.cellEditor = "DateCellEditor";
          colDef.filter = "agDateColumnFilter";
          if (isFollowup) {
            colDef.cellRenderer = (params) => (
              <FollowupCellRenderer value={params.value} />
            );
          } else {
            colDef.cellStyle = { fontFamily: "var(--font-mono)" };
          }
          break;

        case "datetime":
          colDef.cellEditor = "DateTimeCellEditor";
          colDef.cellEditorPopup = true;
          colDef.cellEditorPopupPosition = "over";
          colDef.filter = "agDateColumnFilter";
          colDef.cellRenderer = (params) => (
            <div className="flex items-center gap-1.5 font-mono text-xs h-full">
              <span>{params.value || "-"}</span>
              {params.value && (
                <Calendar className="w-3.5 h-3.5 text-[var(--fg-muted)] shrink-0" />
              )}
            </div>
          );
          break;

        case "dropdown":
          colDef.cellEditor = "agSelectCellEditor";
          colDef.cellEditorParams = {
            values: column.options && column.options.length ? column.options : ["New", "Follow-up", "Qualified", "Closed", "Lost"],
          };
          colDef.filter = "agTextColumnFilter";
          if (isPriority) {
            colDef.cellRenderer = (params) => (
              <PriorityCellRenderer value={params.value} />
            );
          } else if (column.special === "status" || column.id === "status" || column.name.toLowerCase() === "status") {
            colDef.cellRenderer = (params) => (
              <StatusCellRenderer value={params.value} />
            );
          }
          break;



        case "checkbox":
          colDef.editable = false;
          colDef.cellRenderer = (params) => (
            <CheckboxCellRenderer {...params} />
          );
          colDef.width = 90;
          colDef.filter = false;
          break;

        default:
          colDef.filter = "agTextColumnFilter";
          break;
      }

      colDefs.push(colDef);
    });

    // Pinned Row Actions Column matching reference image (Call, Email, Schedule, Options)
    colDefs.push({
      headerName: "Actions",
      width: 140,
      pinned: "right",
      resizable: false,
      sortable: false,
      filter: false,
      cellRenderer: (params) => {
        const phone = params.data?.phone || params.data?.Phone || "";
        const email = params.data?.email || params.data?.Email || "";

        return (
          <div className="flex items-center gap-1 h-full">
            <a
              href={phone ? `tel:${phone}` : "#"}
              onClick={(e) => !phone && e.preventDefault()}
              className={`p-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] transition-all ${
                phone
                  ? "text-[var(--fg-muted)] hover:text-[var(--green)] hover:border-[var(--green)]"
                  : "text-[var(--fg-subtle)] opacity-40 cursor-not-allowed"
              }`}
              title={phone ? `Call ${phone}` : "No phone number"}
            >
              <Phone className="w-3.5 h-3.5" />
            </a>

            <a
              href={email ? `mailto:${email}` : "#"}
              onClick={(e) => !email && e.preventDefault()}
              className={`p-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] transition-all ${
                email
                  ? "text-[var(--fg-muted)] hover:text-[var(--blue)] hover:border-[var(--blue)]"
                  : "text-[var(--fg-subtle)] opacity-40 cursor-not-allowed"
              }`}
              title={email ? `Email ${email}` : "No email address"}
            >
              <Mail className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              onClick={() => {
                if (params.api) {
                  params.api.startEditingCell({
                    rowIndex: params.node.rowIndex,
                    colKey: columns.find((c) => c.special === "followup")?.id || "followup",
                  });
                }
              }}
              className="p-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--fg-muted)] hover:text-[var(--orange)] hover:border-[var(--orange)] transition-all"
              title="Schedule Follow-up"
            >
              <CalendarIcon className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (onOpenDrawer) onOpenDrawer(params.data);
              }}
              className="p-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--fg-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-all"
              title="View Lead Details Drawer"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

          </div>
        );
      },
    });


    return colDefs;
  }, [columns, hiddenColumnIds, CustomHeader, onRowDelete]);

  const rowData = useMemo(() => {
    return rows.map((row) => ({
      _rowId: row._id,
      ...(row.data || {}),
    }));
  }, [rows]);

  const priorityCol = columns.find((c) => c.special === "priority");

  const getRowStyle = useCallback(
    (params) => {
      if (!priorityCol || !params.data) return null;

      const prioVal = params.data[priorityCol.id];
      let leftBorderColor = "transparent";

      if (prioVal === "High") leftBorderColor = "var(--danger)";
      else if (prioVal === "Medium") leftBorderColor = "var(--warning)";
      else if (prioVal === "Low") leftBorderColor = "var(--success)";

      return {
        borderLeft: `4px solid ${leftBorderColor}`,
      };
    },
    [priorityCol]
  );

  const isRollingBackRef = useRef(false);

  const handleCellValueChanged = useCallback(
    async (event) => {
      if (isRollingBackRef.current) return;
      const { data, colDef, oldValue, newValue } = event;
      console.log("[DATE E2E] AG Grid handleCellValueChanged event:", {
        field: colDef.field,
        oldValue,
        newValue,
        data,
      });
      if (oldValue === newValue) return;

      const rowId = data._rowId;
      const field = colDef.field;
      const colObj = columns.find((c) => c.id === field);

      // Data hardening for numerical & boolean types
      let valueToSave = newValue;
      if (colObj?.type === "number" && typeof newValue === "string" && newValue.trim() !== "") {
        const num = Number(newValue);
        if (!isNaN(num)) valueToSave = num;
      } else if (colObj?.type === "checkbox") {
        valueToSave = Boolean(newValue);
      }

      try {
        await onRowUpdate(rowId, { [field]: valueToSave }, oldValue, field);
        saveGridState();
      } catch (err) {
        isRollingBackRef.current = true;
        event.node.setDataValue(field, oldValue);
        isRollingBackRef.current = false;
      }
    },
    [onRowUpdate, columns, saveGridState]
  );

  const handleSelectionChanged = useCallback(() => {
    if (gridRef.current && onSelectionChanged) {
      const selectedNodes = gridRef.current.api.getSelectedNodes();
      const selectedData = selectedNodes.map((node) => node.data);
      onSelectionChanged(selectedData);
    }
  }, [onSelectionChanged]);

  const gridComponents = useMemo(
    () => ({
      DateCellEditor,
      DateTimeCellEditor,
      SelectCellEditor,
    }),
    []
  );


  return (
    <div
      className="ag-theme-alpine w-full rounded-xl border border-[var(--border)] overflow-hidden shadow-2xl relative flex flex-col"
      style={{
        "--ag-background-color": "#0d131f",
        "--ag-foreground-color": "#f9fafb",
        "--ag-header-background-color": "#111827",
        "--ag-header-foreground-color": "#9ca3af",
        "--ag-border-color": "rgba(255, 255, 255, 0.08)",
        "--ag-row-hover-color": "#1a2436",
        "--ag-selected-row-background-color": "#1a2436",
        "--ag-cell-horizontal-border": "solid rgba(255, 255, 255, 0.05)",
        fontFamily: "var(--font-sans)",
        minHeight: "350px",
      }}
    >
      {/* Loading Skeleton Overlay */}
      {loading && (
        <div className="absolute inset-0 z-40 bg-[#0d131f]/90 backdrop-blur-xs flex flex-col items-center justify-center gap-3 animate-in fade-in duration-200">
          <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
          <p className="text-xs font-mono font-medium text-[var(--fg-muted)]">
            Loading leads database...
          </p>
        </div>
      )}

      {/* Error Overlay */}
      {!loading && error && (
        <div className="absolute inset-0 z-40 bg-[#0d131f] flex flex-col items-center justify-center p-6 text-center gap-3">
          <div className="p-3 rounded-full bg-[var(--danger-bg)] text-[var(--danger)]">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-[var(--fg)]">
            Unable to load leads database
          </h3>
          <p className="text-xs text-[var(--danger)] max-w-sm">{error}</p>
          {onRetryLoad && (
            <button
              onClick={onRetryLoad}
              className="mt-2 px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-xs focus:outline-hidden"
              style={{
                backgroundColor: "var(--primary)",
                color: "#0b0f17",
              }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retry Connection
            </button>
          )}
        </div>
      )}

      {/* Empty State Overlay */}
      {!loading && !error && rows.length === 0 && (
        <div className="absolute inset-0 z-30 bg-[#0d131f] flex flex-col items-center justify-center p-6 text-center gap-3">
          <div className="p-3.5 rounded-full bg-[var(--surface-2)] text-[var(--fg-muted)] border border-[var(--border)]">
            <FileX className="w-7 h-7" />
          </div>

          {totalRowsCount === 0 ? (
            <>
              <h3 className="text-sm font-semibold text-[var(--fg)]">
                No leads found
              </h3>
              <p className="text-xs text-[var(--fg-muted)] max-w-xs">
                Your lead database is currently empty. Click below to add your first lead record.
              </p>
              {onAddRow && (
                <button
                  onClick={onAddRow}
                  className="mt-2 px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-xs focus:outline-hidden bg-[var(--primary)] text-[#0b0f17]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add First Lead Row
                </button>
              )}
            </>
          ) : (
            <>
              <h3 className="text-sm font-semibold text-[var(--fg)]">
                No results match your search or filters
              </h3>
              <p className="text-xs text-[var(--fg-muted)] max-w-xs">
                Try adjusting your search terms, status, priority, or follow-up filters.
              </p>
              {onResetFilters && (
                <button
                  onClick={onResetFilters}
                  className="mt-2 px-4 py-2 text-xs font-semibold rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--primary)] flex items-center gap-1.5 transition-all focus:outline-hidden"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Filters
                </button>
              )}
            </>
          )}
        </div>
      )}

      <AgGridReact
        ref={gridRef}
        components={gridComponents}
        columnDefs={columnDefs}
        rowData={rowData}
        getRowStyle={getRowStyle}
        onGridReady={onGridReady}
        onColumnResized={saveGridState}
        onColumnMoved={saveGridState}
        onCellValueChanged={handleCellValueChanged}
        onSelectionChanged={handleSelectionChanged}
        rowSelection="multiple"
        suppressRowClickSelection={true}
        animateRows={true}
        suppressCellFocus={false}
        rowHeight={54}
        headerHeight={48}
        domLayout="autoHeight"
        pagination={false}
        defaultColDef={{
          resizable: true,
          sortable: true,
          filter: true,
          cellStyle: {
            display: "flex",
            alignItems: "center",
            fontSize: "13px",
            fontWeight: "500",
            color: "#f9fafb",
          },
        }}
      />

    </div>

  );
});

export default LeadTable;
