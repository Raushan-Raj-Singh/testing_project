import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Row from "@/models/Row";

export async function PATCH(req, { params }) {
  try {
    await dbConnect();
    const { rowId } = await params;
    const body = await req.json();
    const { data } = body;

    if (!data || typeof data !== "object") {
      return NextResponse.json(
        { success: false, message: "Invalid payload. 'data' object is required." },
        { status: 400 }
      );
    }

    const row = await Row.findById(rowId);
    if (!row) {
      return NextResponse.json(
        { success: false, message: "Row not found." },
        { status: 404 }
      );
    }

    // Merge updated data safely
    const sanitizedData = {};
    Object.entries(data).forEach(([k, v]) => {
      if (!k.startsWith("$") && !k.includes(".")) {
        sanitizedData[k] = v;
      }
    });

    row.data = { ...(row.data || {}), ...sanitizedData };
    row.markModified("data");
    await row.save();

    const cleanRow = JSON.parse(JSON.stringify(row));

    return NextResponse.json({ success: true, data: cleanRow }, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/rows/[rowId] error:", error);
    return NextResponse.json(
      { success: false, message: `Failed to update row: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const { rowId } = await params;

    const deletedRow = await Row.findByIdAndDelete(rowId);
    if (!deletedRow) {
      return NextResponse.json(
        { success: false, message: "Row not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Row deleted successfully.", data: { id: rowId } },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/rows/[rowId] error:", error);
    return NextResponse.json(
      { success: false, message: `Failed to delete row: ${error.message}` },
      { status: 500 }
    );
  }
}
