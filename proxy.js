import { NextResponse } from "next/server";
import * as jose from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "crm_secure_jwt_secret_key_antigravity_2026_x89f"
);
const COOKIE_NAME = "crm_session";

export async function proxy(req) {
  const { pathname } = req.nextUrl;

  // Skip static assets, _next internal files, health endpoint
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/api/health") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const tokenObj = req.cookies.get(COOKIE_NAME);
  const token = tokenObj?.value;

  let isValidSession = false;
  if (token) {
    try {
      const { payload } = await jose.jwtVerify(token, JWT_SECRET);
      if (payload && payload.userId) {
        isValidSession = true;
      }
    } catch (err) {
      isValidSession = false;
    }
  }

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";
  const isAuthApi = pathname.startsWith("/api/auth");

  // Allow auth APIs without redirect
  if (isAuthApi) {
    return NextResponse.next();
  }

  // If visiting auth pages while already authenticated, redirect to CRM dashboard
  if (isAuthPage && isValidSession) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // If visiting protected page (like /) while NOT authenticated, redirect to /login
  if (!isAuthPage && !isValidSession) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
