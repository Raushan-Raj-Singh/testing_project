"use client";

import React, { useMemo } from "react";
import StatusBadge from "@/components/StatusBadge";
import PriorityBadge from "@/components/PriorityBadge";
import { Phone, Mail, Calendar, Eye } from "lucide-react";

export default function KanbanBoard({
  rows = [],
  columns = [],
  onOpenDrawer,
  onRowUpdate,
}) {
  const statusCol = useMemo(
    () =>
      columns.find(
        (c) =>
          c.special === "status" ||
          c.id === "status" ||
          (c.type === "dropdown" && c.name.toLowerCase() === "status")
      ),
    [columns]
  );
  const priorityCol = useMemo(
    () => columns.find((c) => c.special === "priority"),
    [columns]
  );
  const followupCol = useMemo(
    () => columns.find((c) => c.special === "followup"),
    [columns]
  );

  const statusCategories = useMemo(
    () =>
      statusCol?.options?.length
        ? statusCol.options.map((opt) =>
            typeof opt === "object" && opt !== null ? opt.label : String(opt)
          )
        : ["New", "Follow-up", "Qualified", "Closed", "Lost"],
    [statusCol]
  );

  // Group rows by status category
  const columnsData = useMemo(() => {
    const grouped = {};
    statusCategories.forEach((st) => (grouped[st] = []));

    rows.forEach((row) => {
      const data = row.data || {};
      const statusVal = statusCol ? data[statusCol.id] : "New";
      if (grouped[statusVal]) {
        grouped[statusVal].push(row);
      } else {
        if (!grouped["New"]) grouped["New"] = [];
        grouped["New"].push(row);
      }
    });

    return grouped;
  }, [rows, statusCol, statusCategories]);

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-[1100px]">
        {statusCategories.map((st) => {
          const leadsInCol = columnsData[st] || [];
          const optColor = statusCol?.options
            ?.map((opt) => (typeof opt === "object" && opt !== null ? opt : { label: String(opt), color: undefined }))
            ?.find((opt) => opt.label.toLowerCase() === String(st || "").toLowerCase())?.color;

          return (
            <div
              key={st}
              className="flex-1 min-w-[240px] max-w-[320px] rounded-xl glass-panel p-3.5 flex flex-col gap-3 border border-[var(--border)]"
            >
              {/* Kanban Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <StatusBadge value={st} color={optColor} />
                </div>
                <span className="font-mono text-xs font-bold text-[var(--fg-muted)] px-2 py-0.5 rounded-md bg-[var(--surface-2)]">
                  {leadsInCol.length}
                </span>
              </div>

              {/* Lead Cards List */}
              <div className="flex flex-col gap-3 max-h-[580px] overflow-y-auto pr-1">
                {leadsInCol.length === 0 ? (
                  <div className="p-6 text-center text-xs text-white font-medium border border-dashed border-[var(--border)] rounded-xl">
                    No leads in {st}
                  </div>
                ) : (
                  leadsInCol.map((row) => {
                    const data = row.data || {};
                    const name = data.name || data.Name || data[columns[0]?.id] || "Unnamed Lead";
                    const project = data.project || data.Project || "N/A";
                    const phone = data.phone || data.Phone || "";
                    const email = data.email || data.Email || "";
                    const priorityVal = priorityCol ? data[priorityCol.id] : null;
                    const followupVal = followupCol ? data[followupCol.id] : null;

                    return (
                      <div
                        key={row._id}
                        className="p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--primary)] transition-all shadow-md flex flex-col gap-2.5 group cursor-pointer"
                        onClick={() => onOpenDrawer && onOpenDrawer(row)}
                      >
                        {/* Title & Priority */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-xs text-[var(--fg)] group-hover:text-[var(--primary)] transition-colors">
                              {name}
                            </h4>
                            <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">
                              {project}
                            </p>
                          </div>
                          {priorityVal && <PriorityBadge value={priorityVal} />}
                        </div>

                        {/* Contact & Date Details */}
                        <div className="flex flex-col gap-1 text-[11px] text-[var(--fg-subtle)] font-mono border-t pt-2 border-[var(--border)]">
                          {phone && (
                            <div className="flex items-center gap-1.5 truncate">
                              <Phone className="w-3 h-3 text-[var(--green)]" />
                              <span>{phone}</span>
                            </div>
                          )}
                          {email && (
                            <div className="flex items-center gap-1.5 truncate">
                              <Mail className="w-3 h-3 text-[var(--blue)]" />
                              <span className="truncate">{email}</span>
                            </div>
                          )}
                          {followupVal && (
                            <div className="flex items-center gap-1.5 text-[var(--orange)] mt-0.5">
                              <Calendar className="w-3 h-3" />
                              <span>{followupVal}</span>
                            </div>
                          )}
                        </div>

                        {/* Card Actions */}
                        <div className="flex items-center justify-between pt-1 text-[10px]">
                          <span className="font-mono text-[var(--fg-subtle)]">
                            ID: {row._id.slice(-5).toUpperCase()}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onOpenDrawer) onOpenDrawer(row);
                            }}
                            className="px-2 py-1 rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--fg-muted)] hover:text-[var(--primary)] flex items-center gap-1 font-semibold transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
