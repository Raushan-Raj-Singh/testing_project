import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Table from "@/models/Table";
import Row from "@/models/Row";
import { getOrSeedDefaultTable } from "@/lib/seed";

export async function PATCH(req, { params }) {
  try {
    await dbConnect();
    const table = await getOrSeedDefaultTable();
    const { columnId } = await params;

    const colIndex = table.columns.findIndex((c) => c.id === columnId);
    if (colIndex === -1) {
      return NextResponse.json(
        { success: false, message: "Column not found." },
        { status: 404 }
      );
    }

    const targetCol = table.columns[colIndex];
    const body = await req.json();
    const { name, type, options, isFollowup, isPriority } = body;

    const VALID_TYPES = [
      "text",
      "longText",
      "number",
      "date",
      "datetime",
      "dropdown",
      "checkbox",
      "phone",
    ];

    if (type && VALID_TYPES.includes(type)) {
      targetCol.type = type;
    }

    if (name && typeof name === "string") {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return NextResponse.json(
          { success: false, message: "Column name cannot be empty." },
          { status: 400 }
        );
      }

      // Unique name check excluding self
      const duplicate = table.columns.find(
        (c) => c.id !== columnId && c.name.toLowerCase() === trimmedName.toLowerCase()
      );
      if (duplicate) {
        return NextResponse.json(
          { success: false, message: `A column named "${trimmedName}" already exists.` },
          { status: 409 }
        );
      }

      targetCol.name = trimmedName;
    }

    if (targetCol.type === "dropdown" && Array.isArray(options)) {
      const finalOptions = options
        .map((opt) => (typeof opt === "string" ? opt.trim() : ""))
        .filter((opt) => opt.length > 0);

      if (finalOptions.length === 0) {
        return NextResponse.json(
          { success: false, message: "Dropdown must have at least one valid option." },
          { status: 400 }
        );
      }

      targetCol.options = finalOptions;
    }

    // Special flag rules
    if ((targetCol.type === "date" || targetCol.type === "datetime") && typeof isFollowup === "boolean") {
      if (isFollowup) {
        table.columns.forEach((c) => {
          if (c.special === "followup") c.special = "normal";
        });
        targetCol.special = "followup";
      } else if (targetCol.special === "followup") {
        targetCol.special = "normal";
      }
    } else if (targetCol.type === "dropdown" && typeof isPriority === "boolean") {
      if (isPriority) {
        table.columns.forEach((c) => {
          if (c.special === "priority") c.special = "normal";
        });
        targetCol.special = "priority";
      } else if (targetCol.special === "priority") {
        targetCol.special = "normal";
      }
    } else {
      // If type changed to something other than date/datetime/dropdown, clear special flags if they were followup/priority
      if (targetCol.special === "followup" || targetCol.special === "priority") {
        targetCol.special = "normal";
      }
    }

    await table.save();

    return NextResponse.json({ success: true, data: table }, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/table/column/[columnId] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update column." },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const table = await getOrSeedDefaultTable();
    const { columnId } = await params;

    const colIndex = table.columns.findIndex((c) => c.id === columnId);
    if (colIndex === -1) {
      return NextResponse.json(
        { success: false, message: "Column not found." },
        { status: 404 }
      );
    }

    const removedCol = table.columns[colIndex];

    // Remove column definition from Table
    table.columns.splice(colIndex, 1);
    await table.save();

    // Unset column key from every Row data object in MongoDB
    const unsetField = `data.${columnId}`;
    await Row.updateMany(
      { tableId: table._id },
      { $unset: { [unsetField]: "" } }
    );

    return NextResponse.json(
      {
        success: true,
        message: `Column "${removedCol.name}" and its data deleted successfully.`,
        data: table,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/table/column/[columnId] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete column." },
      { status: 500 }
    );
  }
}
