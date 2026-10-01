import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Row from "@/models/Row";
import { getOrSeedDefaultTable } from "@/lib/seed";
import { sortRowsByFollowupAndPriority } from "@/utils/followup";

export async function GET() {
  try {
    await dbConnect();
    const table = await getOrSeedDefaultTable();
    const rawRows = await Row.find({ tableId: table._id }).lean();

    const cleanRows = JSON.parse(JSON.stringify(rawRows));
    const sortedRows = sortRowsByFollowupAndPriority(cleanRows, table.columns || []);

    return NextResponse.json(
      { success: true, data: sortedRows },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/rows error:", error);
    return NextResponse.json(
      { success: false, message: `Failed to fetch rows: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const table = await getOrSeedDefaultTable();

    let initialData = {};
    try {
      const body = await req.json();
      if (body && body.data) {
        initialData = body.data;
      }
    } catch {
      // Empty body is allowed for creating an empty row
    }

    const newRow = await Row.create({
      tableId: table._id,
      data: initialData,
    });

    const cleanRow = JSON.parse(JSON.stringify(newRow));

    return NextResponse.json({ success: true, data: cleanRow }, { status: 201 });
  } catch (error) {
    console.error("POST /api/rows error:", error);
    return NextResponse.json(
      { success: false, message: `Failed to create row: ${error.message}` },
      { status: 500 }
    );
  }
}
