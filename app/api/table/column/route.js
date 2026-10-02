import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Table from "@/models/Table";
import { getOrSeedDefaultTable } from "@/lib/seed";

export async function POST(req) {
  try {
    await dbConnect();
    const table = await getOrSeedDefaultTable();

    const body = await req.json();
    const { name, type, options = [], isFollowup, isPriority } = body;

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
        .map((opt) => (typeof opt === "string" ? opt.trim() : ""))
        .filter((opt) => opt.length > 0);

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

    // Convert camel/snake format, e.g., "sales_lead" -> "salesLead" or keep clean camelCase
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

    return NextResponse.json({ success: true, data: table }, { status: 201 });
  } catch (error) {
    console.error("POST /api/table/column error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add column." },
      { status: 500 }
    );
  }
}
