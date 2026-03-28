import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { withErrorHandler, rateLimitedError } from "@/lib/api-error";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { AUTH_CONFIG } from "@/config/auth.config";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const ip = getClientIp(req);
  const { allowed, resetIn } = rateLimit(
    `visitor:${ip}`,
    AUTH_CONFIG.rateLimit.visitor.maxAttempts,
    AUTH_CONFIG.rateLimit.visitor.windowMs
  );
  if (!allowed) throw rateLimitedError(resetIn);

  const db = getServiceSupabase();
  await db.rpc("increment_visitor_count");
  return NextResponse.json({ success: true });
});

export const GET = withErrorHandler(async () => {
  const db = getServiceSupabase();
  const { data } = await db
    .from("visitor_count")
    .select("count")
    .order("date", { ascending: false });

  const total = (data || []).reduce((sum, row) => sum + row.count, 0);
  const today = data?.[0]?.count || 0;

  return NextResponse.json({ total, today });
});
