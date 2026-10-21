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
    const { status } = body || {};

    if (!status || !["active", "inactive"].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status. Status must be 'active' or 'inactive'." },
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

    // Safety Rule: NEVER DEACTIVATE THE LAST ACTIVE ADMIN
    if (targetUser.role === "admin" && status === "inactive") {
      const activeAdminCount = await User.countDocuments({ role: "admin", status: "active" });
      if (activeAdminCount <= 1) {
        return NextResponse.json(
          {
            success: false,
            message: "Action rejected. At least one active administrator must remain.",
          },
          { status: 400 }
        );
      }
    }

    const previousStatus = targetUser.status;
    targetUser.status = status;
    // Invalidate user session tokens if deactivated
    if (status === "inactive") {
      targetUser.tokenVersion = (targetUser.tokenVersion || 0) + 1;
    }

    await targetUser.save();

    await AuditLog.create({
      adminUserId: adminUser.id,
      targetUserId: targetUser._id,
      action: status === "active" ? "ACTIVATE_USER" : "DEACTIVATE_USER",
      details: { previousStatus, newStatus: status },
    });

    return NextResponse.json(
      {
        success: true,
        message: `User ${targetUser.name} status updated to ${status}.`,
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
    console.error("PATCH /api/admin/users/[userId]/status error:", error);
    return NextResponse.json(
      { success: false, message: `Failed to update user status: ${error.message}` },
      { status: 500 }
    );
  }
}
