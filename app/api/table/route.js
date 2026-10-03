import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Table from "@/models/Table";
import { getSessionUser } from "@/lib/auth";
import { getUserTable } from "@/lib/seed";

export async function GET(req) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required to access CRM table." },
        { status: 401 }
      );
    }

    await dbConnect();
    const table = await getUserTable(user.id);
    const tableData = JSON.parse(JSON.stringify(table));
    return NextResponse.json({ success: true, data: tableData }, { status: 200 });
  } catch (error) {
    console.error("GET /api/table error:", error);
    return NextResponse.json(
      { success: false, message: `Failed to fetch table details: ${error.message}` },
      { status: 500 }
    );
  }
}

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
    const body = await req.json();
    const { name, columns } = body || {};

    const existing = await Table.findOne({ userId: user.id });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "User table already exists." },
        { status: 409 }
      );
    }

    const newTable = await Table.create({
      userId: user.id,
      name: name || "Lead Management",
      columns: columns || [],
    });

    const tableData = JSON.parse(JSON.stringify(newTable));
    return NextResponse.json({ success: true, data: tableData }, { status: 201 });
  } catch (error) {
    console.error("POST /api/table error:", error);
    return NextResponse.json(
      { success: false, message: `Failed to create table: ${error.message}` },
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
    const body = await req.json();
    const { name } = body || {};

    const table = await getUserTable(user.id);
    if (!table) {
      return NextResponse.json(
        { success: false, message: "Table not found." },
        { status: 404 }
      );
    }

    if (name) table.name = name;
    await table.save();

    const tableData = JSON.parse(JSON.stringify(table));
    return NextResponse.json({ success: true, data: tableData }, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/table error:", error);
    return NextResponse.json(
      { success: false, message: `Failed to update table: ${error.message}` },
      { status: 500 }
    );
  }
}
