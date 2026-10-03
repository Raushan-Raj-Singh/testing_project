import bcrypt from "bcryptjs";
import * as jose from "jose";
import { cookies } from "next/headers";
import dbConnect from "./mongodb";
import User from "@/models/User";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "crm_secure_jwt_secret_key_antigravity_2026_x89f"
);

const COOKIE_NAME = "crm_session";

/**
 * Password hashing and verification
 */
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

export async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * JWT token generation and verification
 */
export async function signSessionToken(payload) {
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token) {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Server-side Session User Resolution
 */
export async function getSessionUser(req) {
  try {
    let token = null;

    // 1. Try reading cookie from NextRequest if passed
    if (req && req.cookies && typeof req.cookies.get === "function") {
      const cookieObj = req.cookies.get(COOKIE_NAME);
      token = cookieObj?.value;
    }

    // 2. Try reading Authorization header if cookie not present
    if (!token && req && req.headers && typeof req.headers.get === "function") {
      const authHeader = req.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    // 3. Fall back to next/headers cookies()
    if (!token) {
      try {
        const cookieStore = await cookies();
        const cookieObj = cookieStore.get(COOKIE_NAME);
        token = cookieObj?.value;
      } catch (err) {
        // cookies() not available in some contexts
      }
    }

    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload || !payload.userId) return null;

    await dbConnect();
    const user = await User.findById(payload.userId).select("-password").lean();
    if (!user) return null;

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    };
  } catch (err) {
    console.error("getSessionUser error:", err);
    return null;
  }
}

/**
 * Cookie management helpers
 */
export async function setSessionCookie(token) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export { COOKIE_NAME };
