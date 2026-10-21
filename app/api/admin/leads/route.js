import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Row from "@/models/Row";
import Table from "@/models/Table";
import User from "@/models/User";
import { requireAdmin } from "@/lib/auth";
import { sortRowsByFollowupAndPriority } from "@/utils/followup";

export async function GET(req) {
  try {
    const { user: adminUser, errorResponse } = await requireAdmin(req);
    if (errorResponse) return errorResponse;

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const ownerIdFilter = searchParams.get("userId") || searchParams.get("ownerId");

    // Fetch all users to map ownership metadata and for owner filtering
    const users = await User.find({}).select("_id name email role").lean();
    const userMap = {};
    users.forEach((u) => {
      userMap[u._id.toString()] = {
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role || "user",
      };
    });

    let tableQuery = {};
    if (ownerIdFilter && ownerIdFilter !== "ALL") {
      tableQuery.userId = ownerIdFilter;
    }

    const tables = await Table.find(tableQuery).lean();
    if (!tables || tables.length === 0) {
      return NextResponse.json(
        {
          success: true,
          data: [],
          users: users.map((u) => ({ id: u._id.toString(), name: u.name, email: u.email })),
        },
        { status: 200 }
      );
    }

    const tableIds = tables.map((t) => t._id);
    const tableUserMap = {};
    tables.forEach((t) => {
      if (t.userId) {
        tableUserMap[t._id.toString()] = t.userId.toString();
      }
    });

    // Pick first table's schema (or default columns) for sorting context
    const masterColumns = tables[0]?.columns || [];

    const rawRows = await Row.find({ tableId: { $in: tableIds } }).lean();

    const cleanRows = rawRows.map((row) => {
      const uId = tableUserMap[row.tableId.toString()];
      const ownerInfo = uId ? userMap[uId] : null;

      return {
        ...JSON.parse(JSON.stringify(row)),
        ownerId: uId || null,
        ownerName: ownerInfo ? ownerInfo.name : "Unassigned",
        ownerEmail: ownerInfo ? ownerInfo.email : "",
      };
    });

    const sortedRows = sortRowsByFollowupAndPriority(cleanRows, masterColumns);

    return NextResponse.json(
      {
        success: true,
        data: sortedRows,
        users: users.map((u) => ({ id: u._id.toString(), name: u.name, email: u.email })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/admin/leads error:", error);
    return NextResponse.json(
      { success: false, message: `Failed to fetch team leads: ${error.message}` },
      { status: 500 }
    );
  }
}
