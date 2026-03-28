import { NextResponse } from "next/server";
import { verifySession, destroySession } from "@/lib/auth";
import { withErrorHandler } from "@/lib/api-error";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async () => {
  const adminId = await verifySession();
  if (!adminId) {
    return NextResponse.json({ authenticated: false });
  }
  return NextResponse.json({ authenticated: true, adminId });
});

export const DELETE = withErrorHandler(async () => {
  await destroySession();
  return NextResponse.json({ success: true });
});
