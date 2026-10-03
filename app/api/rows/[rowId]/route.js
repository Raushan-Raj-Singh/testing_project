import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Row from "@/models/Row";
import { getSessionUser } from "@/lib/auth";
import { getUserTable } from "@/lib/seed";

export async function PATCH(req, { params }) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 }
      );
    }

    await dbConnect();
    const userTable = await getUserTable(user.id);
    const { rowId } = await params;
    const body = await req.json();
    const { data } = body || {};

    if (!data || typeof data !== "object") {
      return NextResponse.json(
        { success: false, message: "Invalid payload. 'data' object is required." },
        { status: 400 }
      );
    }

    // Verify row existence and table ownership
    const row = await Row.findById(rowId);
    if (!row || row.tableId.toString() !== userTable._id.toString()) {
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
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 }
      );
    }

    await dbConnect();
    const userTable = await getUserTable(user.id);
    const { rowId } = await params;

    // Verify row ownership before deletion
    const row = await Row.findById(rowId);
    if (!row || row.tableId.toString() !== userTable._id.toString()) {
      return NextResponse.json(
        { success: false, message: "Row not found." },
        { status: 404 }
      );
    }

    await Row.findByIdAndDelete(rowId);

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
