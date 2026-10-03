import { NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { hashPassword } from "@/lib/auth";

export async function POST(req) {
  try {
    const body = await req.json();
    const { token, password } = body || {};

    if (!token || typeof token !== "string" || !token.trim()) {
      return NextResponse.json(
        { success: false, message: "Invalid or missing reset token." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    await dbConnect();

    // 1. Hash incoming token to match stored hash
    const hashedToken = crypto.createHash("sha256").update(token.trim()).digest("hex");

    // 2. Find user with matching token hash
    const user = await User.findOne({
      resetPasswordTokenHash: hashedToken,
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired password reset link." },
        { status: 400 }
      );
    }

    // 3. Check expiration time
    if (!user.resetPasswordExpiresAt || new Date(user.resetPasswordExpiresAt) < new Date()) {
      // Clear expired fields
      user.resetPasswordTokenHash = null;
      user.resetPasswordExpiresAt = null;
      await user.save();

      return NextResponse.json(
        { success: false, message: "This password reset link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // 4. Hash new password
    const newPasswordHash = await hashPassword(password);

    // 5. Update user password and clear token fields
    user.password = newPasswordHash;
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpiresAt = null;

    // 6. Increment tokenVersion to invalidate any existing active sessions
    user.tokenVersion = (user.tokenVersion || 0) + 1;

    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: "Password updated successfully. You can now log in with your new password.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/auth/reset-password error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to reset password due to a server error." },
      { status: 500 }
    );
  }
}
