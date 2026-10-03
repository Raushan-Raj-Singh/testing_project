import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { comparePassword, signSessionToken, setSessionCookie } from "@/lib/auth";
import { getUserTable } from "@/lib/seed";

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { email, password } = body || {};

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { success: false, message: "Email address is required." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, message: "Password is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Ensure user table is ready
    await getUserTable(user._id);

    const token = await signSessionToken({
      userId: user._id.toString(),
      email: user.email,
      tokenVersion: user.tokenVersion || 0,
    });

    await setSessionCookie(token);

    return NextResponse.json(
      {
        success: true,
        message: "Logged in successfully.",
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json(
      { success: false, message: "Authentication failed due to a server error." },
      { status: 500 }
    );
  }
}
