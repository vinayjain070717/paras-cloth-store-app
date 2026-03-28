import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { verifySession } from "@/lib/auth";
import { withErrorHandler, unauthorizedError } from "@/lib/api-error";
import { DB_CONFIG } from "@/config/database.config";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const adminId = await verifySession();
  if (!adminId) throw unauthorizedError();

  const db = getServiceSupabase();
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit")) || DB_CONFIG.queryLimits.maxActivityLog;

  const { data, error } = await db
    .from(DB_CONFIG.tables.activityLog)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return NextResponse.json(data || []);
});
