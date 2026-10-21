import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import AuditLog from "@/models/AuditLog";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(req, { params }) {
  try {
    const { user: adminUser, errorResponse } = await requireAdmin(req);
    if (errorResponse) return errorResponse;

    const { userId } = await params;
    const body = await req.json();
    const { role } = body || {};

    if (!role || !["user", "admin"].includes(role)) {
      return NextResponse.json(
        { success: false, message: "Invalid role. Role must be 'user' or 'admin'." },
        { status: 400 }
      );
    }

    await dbConnect();
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: "Target user not found." },
        { status: 404 }
      );
    }

    // Safety Rule: NEVER REMOVE THE LAST ADMIN
    if (targetUser.role === "admin" && role === "user") {
      const adminCount = await User.countDocuments({ role: "admin", status: "active" });
      if (adminCount <= 1) {
        return NextResponse.json(
          {
            success: false,
            message: "Action rejected. At least one active administrator must remain.",
          },
          { status: 400 }
        );
      }
    }

    const previousRole = targetUser.role;
    targetUser.role = role;
    await targetUser.save();

    await AuditLog.create({
      adminUserId: adminUser.id,
      targetUserId: targetUser._id,
      action: role === "admin" ? "PROMOTE_TO_ADMIN" : "DEMOTE_TO_USER",
      details: { previousRole, newRole: role },
    });

    return NextResponse.json(
      {
        success: true,
        message: `User ${targetUser.name} role updated to ${role}.`,
        user: {
          id: targetUser._id.toString(),
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role,
          status: targetUser.status,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/admin/users/[userId]/role error:", error);
    return NextResponse.json(
      { success: false, message: `Failed to update user role: ${error.message}` },
      { status: 500 }
    );
  }
}
