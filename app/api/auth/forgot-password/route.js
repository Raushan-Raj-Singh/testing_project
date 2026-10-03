import { NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { sendPasswordResetEmail } from "@/lib/email";

// Simple in-memory rate limiting map for forgot-password requests (cooldown: 60 seconds per email)
const requestCooldownMap = new Map();

export async function POST(req) {
  try {
    const body = await req.json();
    const { email } = body || {};

    // 1. Frontend & Backend Email Validation
    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { success: false, message: "Please enter your email address." },
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

    // Generic anti-enumeration response message
    const genericSuccessResponse = {
      success: true,
      message: "If an account exists for this email, we've sent a password reset link.",
    };

    // 2. Rate limiting check (cooldown per email)
    const now = Date.now();
    const lastRequestTime = requestCooldownMap.get(normalizedEmail);
    if (lastRequestTime && now - lastRequestTime < 60 * 1000) {
      // Cooldown active, return generic response without re-sending
      return NextResponse.json(genericSuccessResponse, { status: 200 });
    }

    await dbConnect();
    const user = await User.findOne({ email: normalizedEmail });

    // 3. Prevent Email Enumeration: if user not found, return generic success
    if (!user) {
      requestCooldownMap.set(normalizedEmail, now);
      return NextResponse.json(genericSuccessResponse, { status: 200 });
    }

    // 4. Generate cryptographically secure random token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(now + 60 * 60 * 1000); // 1 hour expiry

    user.resetPasswordTokenHash = hashedToken;
    user.resetPasswordExpiresAt = expiresAt;
    await user.save();

    // Track rate limit
    requestCooldownMap.set(normalizedEmail, now);

    // 5. Build reset URL
    const baseUrl =
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";
    const resetUrl = `${baseUrl.replace(/\/$/, "")}/reset-password?token=${rawToken}`;

    // 6. Send reset email
    const emailResult = await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
    });

    if (!emailResult.success) {
      console.error("Password reset email process finished with failure:", emailResult.error);
    }

    return NextResponse.json(genericSuccessResponse, { status: 200 });
  } catch (error) {
    console.error("POST /api/auth/forgot-password error:", error);
    // Even on internal server error, don't expose error trace or email existence
    return NextResponse.json(
      {
        success: true,
        message: "If an account exists for this email, we've sent a password reset link.",
      },
      { status: 200 }
    );
  }
}
