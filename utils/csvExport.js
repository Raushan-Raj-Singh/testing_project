/**
 * Helper to export row data to CSV file with dynamic columns
 */
export function exportToCSV(rowsData = [], columns = [], filename = null) {
  if (!rowsData || !rowsData.length) return;

  const validCols = columns || [];

  // Generate CSV Header: S.No, Column1, Column2, ...
  const headers = ["S.No", ...validCols.map((c) => c.name)];
  const csvRows = [headers.map(escapeCSVCell).join(",")];

  rowsData.forEach((row, idx) => {
    const rowObj = row.data || row;
    const rowCells = [
      String(idx + 1),
      ...validCols.map((c) => {
        const val = rowObj[c.id];
        if (val === null || val === undefined) return "";
        if (typeof val === "boolean") return val ? "true" : "false";
        if (typeof val === "number") return String(val);
        return String(val);
      }),
    ];
    csvRows.push(rowCells.map(escapeCSVCell).join(","));
  });

  const csvString = csvRows.join("\r\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });

  const dateStr = new Date().toISOString().split("T")[0];
  const finalFilename = filename || `leads-${dateStr}.csv`;

  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", finalFilename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function escapeCSVCell(cellStr) {
  let str = String(cellStr);
  // Formula injection prevention
  if (/^[=+\-@\t]/.test(str)) {
    str = `'${str}`;
  }
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
