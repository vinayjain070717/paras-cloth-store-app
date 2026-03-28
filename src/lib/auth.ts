import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { AUTH_CONFIG } from "@/config/auth.config";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-me"
);

export async function createSession(adminId: string) {
  const token = await new SignJWT({ adminId })
    .setProtectedHeader({ alg: AUTH_CONFIG.jwtAlgorithm })
    .setExpirationTime(AUTH_CONFIG.session.durationLabel)
    .setIssuedAt()
    .sign(SECRET);

  const cookieStore = await cookies();
  cookieStore.set(AUTH_CONFIG.session.cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: AUTH_CONFIG.session.durationMs / 1000,
    path: "/",
  });

  return token;
}

export async function verifySession(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_CONFIG.session.cookieName)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload.adminId as string;
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_CONFIG.session.cookieName);
}

export function needsOtp(lastLogin: string | null): boolean {
  if (!lastLogin) return true;
  const lastLoginTime = new Date(lastLogin).getTime();
  return Date.now() - lastLoginTime > AUTH_CONFIG.session.durationMs;
}
