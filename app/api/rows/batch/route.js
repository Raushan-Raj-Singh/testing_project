import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Row from "@/models/Row";
import { getSessionUser } from "@/lib/auth";
import { getUserTable } from "@/lib/seed";

const MAX_BATCH_SIZE = 1000;

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

    const { rowsData } = body || {};
    if (!Array.isArray(rowsData) || rowsData.length === 0) {
      return NextResponse.json(
        { success: false, message: "Invalid payload. 'rowsData' array is required." },
        { status: 400 }
      );
    }

    if (rowsData.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { success: false, message: `Batch size exceeds maximum limit of ${MAX_BATCH_SIZE} rows.` },
        { status: 400 }
      );
    }

    // Allowed columns check / sanitization
    const validColumnKeys = new Set((table.columns || []).map((col) => col.id));

    const docsToInsert = rowsData.map((rawObj) => {
      const sanitizedData = {};
      if (rawObj && typeof rawObj === "object") {
        Object.entries(rawObj).forEach(([k, v]) => {
          if (!k.startsWith("$") && !k.includes(".") && (validColumnKeys.size === 0 || validColumnKeys.has(k))) {
            sanitizedData[k] = v;
          }
        });
      }
      return {
        tableId: table._id,
        data: sanitizedData,
      };
    });

    const insertedRows = await Row.insertMany(docsToInsert);
    const cleanRows = JSON.parse(JSON.stringify(insertedRows));

    return NextResponse.json(
      {
        success: true,
        message: `Successfully imported ${cleanRows.length} rows.`,
        data: cleanRows,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/rows/batch error:", error);
    return NextResponse.json(
      { success: false, message: "Batch import failed due to a server error." },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
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
    const { rowIds, data } = body || {};

    if (!Array.isArray(rowIds) || rowIds.length === 0 || !data || typeof data !== "object") {
      return NextResponse.json(
        { success: false, message: "Invalid payload. 'rowIds' array and 'data' object are required." },
        { status: 400 }
      );
    }

    if (rowIds.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { success: false, message: `Batch update exceeds maximum limit of ${MAX_BATCH_SIZE} rows.` },
        { status: 400 }
      );
    }

    const validColumnKeys = new Set((table.columns || []).map((col) => col.id));

    // Construct mongo update fields: data.<columnId> = newValue with key validation
    const updateFields = {};
    Object.entries(data).forEach(([key, val]) => {
      if (!key.startsWith("$") && !key.includes(".") && (validColumnKeys.size === 0 || validColumnKeys.has(key))) {
        updateFields[`data.${key}`] = val;
      }
    });

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid column updates provided." },
        { status: 400 }
      );
    }

    // Only update rows belonging to this user's table!
    await Row.updateMany(
      { _id: { $in: rowIds }, tableId: table._id },
      { $set: updateFields }
    );

    // Fetch updated rows owned by this user
    const updatedRows = await Row.find({ _id: { $in: rowIds }, tableId: table._id }).lean();
    const cleanRows = JSON.parse(JSON.stringify(updatedRows));

    return NextResponse.json(
      {
        success: true,
        message: `Successfully updated ${cleanRows.length} rows.`,
        data: cleanRows,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/rows/batch error:", error);
    return NextResponse.json(
      { success: false, message: "Batch update failed due to a server error." },
      { status: 500 }
    );
  }
}
