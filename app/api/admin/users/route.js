import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Row from "@/models/Row";
import Table from "@/models/Table";
import { requireAdmin } from "@/lib/auth";

export async function GET(req) {
  try {
    const { user: adminUser, errorResponse } = await requireAdmin(req);
    if (errorResponse) return errorResponse;

    await dbConnect();

    const users = await User.find({}).select("-password").sort({ createdAt: -1 }).lean();

    const formattedUsers = users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role || "user",
      status: u.status || "active",
      createdAt: u.createdAt,
    }));

    const totalUsers = formattedUsers.length;
    const activeUsers = formattedUsers.filter((u) => u.status === "active").length;
    const adminsCount = formattedUsers.filter((u) => u.role === "admin").length;

    // Get lead counts per user
    const tables = await Table.find({}).select("_id userId").lean();
    const userTableMap = {};
    tables.forEach((t) => {
      if (t.userId) {
        userTableMap[t._id.toString()] = t.userId.toString();
      }
    });

    const rows = await Row.find({}).select("tableId").lean();
    const leadCountPerUser = {};
    let totalLeads = 0;

    rows.forEach((r) => {
      const uId = userTableMap[r.tableId.toString()];
      if (uId) {
        leadCountPerUser[uId] = (leadCountPerUser[uId] || 0) + 1;
        totalLeads++;
      }
    });

    const userStats = formattedUsers.map((u) => ({
      ...u,
      leadCount: leadCountPerUser[u.id] || 0,
    }));

    return NextResponse.json(
      {
        success: true,
        stats: {
          totalUsers,
          activeUsers,
          adminsCount,
          totalLeads,
        },
        users: userStats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json(
      { success: false, message: `Failed to fetch users: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const { user: adminUser, errorResponse } = await requireAdmin(req);
    if (errorResponse) return errorResponse;

    await dbConnect();
    const body = await req.json();
    const { name, email, password, role = "user", status = "active" } = body || {};

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "Full name is required." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { success: false, message: "Email address is required." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const validRoles = ["user", "admin"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, message: "Invalid role specified." },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    const { hashPassword } = await import("@/lib/auth");
    const { getUserTable } = await import("@/lib/seed");
    const AuditLog = (await import("@/models/AuditLog")).default;

    const hashedPassword = await hashPassword(password);
    const newUserId = new (require("mongoose").Types.ObjectId)();

    const newUser = await User.create({
      _id: newUserId,
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
      status,
    });

    await getUserTable(newUser._id);

    await AuditLog.create({
      adminUserId: adminUser.id,
      targetUserId: newUser._id,
      action: "CREATE_USER",
      details: { role, status, email: normalizedEmail },
    });

    return NextResponse.json(
      {
        success: true,
        message: "User created successfully.",
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          status: newUser.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/users error:", error);
    return NextResponse.json(
      { success: false, message: `Failed to create user: ${error.message}` },
      { status: 500 }
    );
  }
}
