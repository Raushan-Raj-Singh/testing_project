import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { getSessionUser } from "@/lib/auth";
import { getUserTable } from "@/lib/seed";

export async function POST(req) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 }
      );
    }

    await dbConnect();
    const table = await getUserTable(user.id);

    const body = await req.json();
    const { name, type, options = [], isFollowup, isPriority } = body || {};

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "Column name is required." },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    // Check unique column name (case-insensitive)
    const duplicate = table.columns.find(
      (c) => c.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) {
      return NextResponse.json(
        { success: false, message: `A column named "${trimmedName}" already exists.` },
        { status: 409 }
      );
    }

    const validTypes = [
      "text",
      "longText",
      "number",
      "date",
      "datetime",
      "dropdown",
      "checkbox",
      "phone",
    ];

    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, message: "Invalid column type specified." },
        { status: 400 }
      );
    }

    let finalOptions = [];
    if (type === "dropdown") {
      finalOptions = (options || [])
        .map((opt) => {
          if (typeof opt === "object" && opt !== null) {
            const label = typeof opt.label === "string" ? opt.label.trim() : "";
            const color = typeof opt.color === "string" && opt.color.trim() ? opt.color.trim() : "#3b82f6";
            return label ? { label, color } : null;
          }
          if (typeof opt === "string") {
            const label = opt.trim();
            return label ? { label, color: "#3b82f6" } : null;
          }
          return null;
        })
        .filter(Boolean);

      if (finalOptions.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Dropdown column must have at least one valid option.",
          },
          { status: 400 }
        );
      }
    }

    let special = "normal";
    if ((type === "date" || type === "datetime") && isFollowup) {
      special = "followup";
    } else if (type === "dropdown" && isPriority) {
      special = "priority";
    }

    // Handle single-active rules for followup and priority
    if (special === "followup") {
      table.columns.forEach((c) => {
        if (c.special === "followup") c.special = "normal";
      });
    } else if (special === "priority") {
      table.columns.forEach((c) => {
        if (c.special === "priority") c.special = "normal";
      });
    }

    // Generate collision-safe unique column id
    let baseSlug = trimmedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    if (!baseSlug) baseSlug = "col";

    let baseId = baseSlug.replace(/_([a-z0-9])/g, (_, g1) => g1.toUpperCase());

    let generatedId = baseId;
    let counter = 2;
    const existingColIds = new Set(table.columns.map((c) => c.id));
    while (existingColIds.has(generatedId)) {
      generatedId = `${baseId}_${counter}`;
      counter++;
    }

    const newColumn = {
      id: generatedId,
      name: trimmedName,
      type,
      options: finalOptions,
      special,
    };

    table.columns.push(newColumn);
    await table.save();

    const tableData = JSON.parse(JSON.stringify(table));
    return NextResponse.json({ success: true, data: tableData }, { status: 201 });
  } catch (error) {
    console.error("POST /api/table/column error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add column." },
      { status: 500 }
    );
  }
}
