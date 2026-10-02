"use client";

import React, { useState, useEffect } from "react";
import { X, Upload, FileText, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

function parseCSV(text) {
  const lines = text.split(/\r\n|\n/);
  const result = [];
  for (let line of lines) {
    if (!line.trim()) continue;
    const row = [];
    let insideQuote = false;
    let entry = "";
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (insideQuote && line[i + 1] === '"') {
          entry += '"';
          i++;
        } else {
          insideQuote = !insideQuote;
        }
      } else if (char === "," && !insideQuote) {
        row.push(entry.trim());
        entry = "";
      } else {
        entry += char;
      }
    }
    row.push(entry.trim());
    result.push(row);
  }
  return result;
}

export default function ImportModal({
  isOpen,
  onClose,
  columns = [],
  onImportSuccess,
}) {
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!isOpen) {
      React.startTransition(() => {
        setFile(null);
        setParsing(false);
        setSubmitting(false);
        setValidationResult(null);
        setErrorMsg("");
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    if (!selected.name.toLowerCase().endsWith(".csv")) {
      setErrorMsg("Please upload a valid .csv file.");
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setErrorMsg("File size exceeds 5MB limit.");
      return;
    }

    setErrorMsg("");
    setFile(selected);
    processFile(selected);
  };

  const processFile = (fileToProcess) => {
    setParsing(true);
    setValidationResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target.result;
        const rows = parseCSV(content);

        if (!rows || rows.length < 2) {
          setErrorMsg("CSV file must contain a header row and at least one data row.");
          setParsing(false);
          return;
        }

        const headers = rows[0].map((h) => h.toLowerCase().trim());
        const dataRows = rows.slice(1);

        // Map CSV header columns to schema columns deterministically
        const colMap = {}; // index in CSV -> column definition object
        const unknownHeaders = [];
        const mappingErrors = [];

        headers.forEach((h, idx) => {
          if (h === "s.no" || h === "sno" || h === "id" || h === "_id") return;

          // 1. Exact ID match
          let matchedCols = columns.filter((c) => c.id === rows[0][idx]);
          // 2. Exact Name match
          if (matchedCols.length === 0) {
            matchedCols = columns.filter((c) => c.name === rows[0][idx]);
          }
          // 3. Case-insensitive ID match
          if (matchedCols.length === 0) {
            matchedCols = columns.filter((c) => c.id.toLowerCase() === h);
          }
          // 4. Case-insensitive Name match
          if (matchedCols.length === 0) {
            matchedCols = columns.filter((c) => c.name.toLowerCase() === h);
          }

          if (matchedCols.length === 1) {
            colMap[idx] = matchedCols[0];
          } else if (matchedCols.length > 1) {
            mappingErrors.push(`Ambiguous header "${rows[0][idx]}": matches multiple columns (${matchedCols.map((c) => c.name).join(", ")}).`);
          } else {
            unknownHeaders.push(rows[0][idx]);
          }
        });

        if (mappingErrors.length > 0) {
          setErrorMsg(mappingErrors.join(" "));
          setParsing(false);
          return;
        }

        const parsedResults = [];
        let validCount = 0;
        let invalidCount = 0;

        dataRows.forEach((rowCells, rIdx) => {
          const rowNum = rIdx + 2; // 1-indexed including header
          const rowData = {};
          const rowErrors = [];

          // Initialize default empty values for all schema columns
          columns.forEach((col) => {
            rowData[col.id] = col.type === "checkbox" ? false : "";
          });

          // Process mapped cells
          Object.entries(colMap).forEach(([cIdxStr, colDef]) => {
            const cIdx = parseInt(cIdxStr, 10);
            const rawVal = rowCells[cIdx] || "";

            if (!rawVal) {
              rowData[colDef.id] = colDef.type === "checkbox" ? false : "";
              return;
            }

            switch (colDef.type) {
              case "number": {
                const num = Number(rawVal);
                if (isNaN(num)) {
                  rowErrors.push(`Column "${colDef.name}": Expected numeric value, got "${rawVal}".`);
                } else {
                  rowData[colDef.id] = num;
                }
                break;
              }
              case "checkbox": {
                const lower = rawVal.toLowerCase();
                if (["true", "yes", "1"].includes(lower)) {
                  rowData[colDef.id] = true;
                } else if (["false", "no", "0"].includes(lower)) {
                  rowData[colDef.id] = false;
                } else {
                  rowErrors.push(`Column "${colDef.name}": Expected true/false boolean value.`);
                }
                break;
              }
              case "dropdown": {
                if (colDef.options?.length) {
                  const matchedOpt = colDef.options.find((opt) => {
                    const label = typeof opt === "object" && opt !== null ? opt.label : String(opt);
                    return label.toLowerCase() === rawVal.toLowerCase();
                  });
                  if (matchedOpt) {
                    const finalLabel = typeof matchedOpt === "object" && matchedOpt !== null ? matchedOpt.label : String(matchedOpt);
                    rowData[colDef.id] = finalLabel;
                  } else {
                    rowErrors.push(
                      `Column "${colDef.name}": "${rawVal}" is not a configured dropdown option.`
                    );
                  }
                } else {
                  rowData[colDef.id] = rawVal;
                }
                break;
              }
              default:
                rowData[colDef.id] = rawVal;
                break;
            }
          });

          const isValid = rowErrors.length === 0;
          if (isValid) validCount++;
          else invalidCount++;

          parsedResults.push({
            rowNum,
            data: rowData,
            rawCells: rowCells,
            isValid,
            errors: rowErrors,
          });
        });

        setValidationResult({
          totalDetected: dataRows.length,
          validCount,
          invalidCount,
          unknownHeaders,
          rows: parsedResults,
        });
      } catch (err) {
        setErrorMsg("Failed to parse CSV file content.");
      } finally {
        setParsing(false);
      }
    };
    reader.onerror = () => {
      setErrorMsg("Error reading file.");
      setParsing(false);
    };
    reader.readAsText(fileToProcess);
  };

  const handleConfirmImport = async () => {
    if (!validationResult || validationResult.validCount === 0 || submitting) return;

    try {
      setSubmitting(true);
      const validRowsData = validationResult.rows
        .filter((r) => r.isValid)
        .map((r) => r.data);

      const res = await fetch("/api/rows/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rowsData: validRowsData }),
      });

      const result = await res.json();
      if (result.success) {
        onImportSuccess(result.data, validationResult.validCount);
        onClose();
      } else {
        throw new Error(result.message || "Failed to import rows.");
      }
    } catch (err) {
      setErrorMsg(err.message || "Import operation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl rounded-xl border shadow-xl flex flex-col p-6 gap-5 max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)",
          color: "var(--fg)",
        }}
      >
        <div className="flex items-center justify-between border-b pb-3 border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-[var(--accent)]" />
            <h3 className="font-display text-xl font-semibold">Import Leads from CSV</h3>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1 rounded-md hover:opacity-70 transition-opacity focus:outline-hidden"
            style={{ color: "var(--fg-muted)" }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div
            className="p-3 rounded-lg text-xs font-medium border flex items-center gap-2"
            style={{
              backgroundColor: "var(--danger-bg)",
              borderColor: "var(--danger)",
              color: "var(--danger)",
            }}
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* File Uploader Step */}
        {!validationResult && !parsing && (
          <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 border-[var(--border)] bg-[var(--surface-2)]/50 gap-3">
            <FileText className="w-10 h-10 text-[var(--fg-muted)]" />
            <div className="text-center">
              <p className="text-sm font-semibold">Upload CSV File</p>
              <p className="text-xs text-[var(--fg-muted)] mt-1">
                Headers should match schema columns ({columns.map((c) => c.name).join(", ")})
              </p>
            </div>
            <label
              className="mt-2 px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-all shadow-xs"
              style={{
                backgroundColor: "var(--accent)",
                color: "var(--accent-fg)",
              }}
            >
              Browse CSV File
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        )}

        {parsing && (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
            <p className="text-xs font-mono text-[var(--fg-muted)]">Parsing & validating CSV rows...</p>
          </div>
        )}

        {/* Validation & Preview Step */}
        {validationResult && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] flex flex-col">
                <span className="text-[10px] font-semibold uppercase text-[var(--fg-muted)]">Detected</span>
                <span className="font-mono text-xl font-bold">{validationResult.totalDetected}</span>
              </div>
              <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] flex flex-col">
                <span className="text-[10px] font-semibold uppercase text-[var(--success)]">Valid Rows</span>
                <span className="font-mono text-xl font-bold text-[var(--success)]">{validationResult.validCount}</span>
              </div>
              <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] flex flex-col">
                <span className="text-[10px] font-semibold uppercase text-[var(--danger)]">Errors</span>
                <span className="font-mono text-xl font-bold text-[var(--danger)]">{validationResult.invalidCount}</span>
              </div>
            </div>

            {validationResult.unknownHeaders.length > 0 && (
              <div className="p-2.5 rounded-lg text-xs border border-[var(--border)] bg-[var(--surface-2)] text-[var(--fg-muted)]">
                <span className="font-semibold text-[var(--fg)]">Ignored unknown columns: </span>
                {validationResult.unknownHeaders.join(", ")}
              </div>
            )}

            {/* Preview Table */}
            <div className="border border-[var(--border)] rounded-lg overflow-hidden max-h-56 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[var(--surface-2)] font-mono text-[11px] text-[var(--fg-muted)] border-b border-[var(--border)] sticky top-0">
                  <tr>
                    <th className="p-2">Row</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Details / Errors</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] font-mono text-xs">
                  {validationResult.rows.map((r) => (
                    <tr key={r.rowNum} className={r.isValid ? "bg-[var(--surface)]" : "bg-[var(--danger-bg)]/20"}>
                      <td className="p-2 text-[var(--fg-muted)]">#{r.rowNum}</td>
                      <td className="p-2">
                        {r.isValid ? (
                          <span className="inline-flex items-center gap-1 text-[var(--success)] font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[var(--danger)] font-semibold">
                            <AlertTriangle className="w-3.5 h-3.5" /> Error
                          </span>
                        )}
                      </td>
                      <td className="p-2 text-[var(--fg-muted)]">
                        {r.isValid ? (
                          <span className="text-[var(--fg)] truncate max-w-xs block">
                            {Object.values(r.data).filter(Boolean).slice(0, 3).join(" · ")}
                          </span>
                        ) : (
                          <ul className="list-disc list-inside text-[var(--danger)]">
                            {r.errors.map((err, idx) => (
                              <li key={idx}>{err}</li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[var(--border)] mt-2">
              <button
                type="button"
                onClick={() => setValidationResult(null)}
                disabled={submitting}
                className="text-xs text-[var(--fg-muted)] hover:underline"
              >
                Choose different file
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--surface)",
                    color: "var(--fg)",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={validationResult.validCount === 0 || submitting}
                  className="px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--accent)",
                    color: "var(--accent-fg)",
                  }}
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {submitting ? "Importing..." : `Import ${validationResult.validCount} Valid Rows`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
