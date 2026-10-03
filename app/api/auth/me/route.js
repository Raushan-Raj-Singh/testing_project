import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function GET(req) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthenticated.", user: null },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: true, user },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to resolve session." },
      { status: 500 }
    );
  }
}
