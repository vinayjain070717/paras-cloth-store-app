import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { verifySession } from "@/lib/auth";
import { withErrorHandler, unauthorizedError, rateLimitedError, validationError } from "@/lib/api-error";
import { notifySchema } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { AUTH_CONFIG } from "@/config/auth.config";
import { DB_CONFIG } from "@/config/database.config";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const ip = getClientIp(req);
  const { allowed, resetIn } = rateLimit(
    `notify:${ip}`,
    AUTH_CONFIG.rateLimit.notify.maxAttempts,
    AUTH_CONFIG.rateLimit.notify.windowMs
  );
  if (!allowed) throw rateLimitedError(resetIn);

  const body = await req.json();
  const validated = notifySchema.parse(body);

  const db = getServiceSupabase();

  const { data: existing } = await db
    .from(DB_CONFIG.tables.notifyRequests)
    .select("id")
    .eq("product_id", validated.product_id)
    .eq("whatsapp_number", validated.whatsapp_number)
    .single();

  if (existing) {
    return NextResponse.json({ success: true, message: "Already registered" });
  }

  const { error } = await db.from(DB_CONFIG.tables.notifyRequests).insert({
    product_id: validated.product_id,
    whatsapp_number: validated.whatsapp_number,
    customer_name: validated.customer_name,
  });

  if (error) throw new Error(error.message);

  return NextResponse.json({ success: true });
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  const adminId = await verifySession();
  if (!adminId) throw unauthorizedError();

  const db = getServiceSupabase();
  const url = new URL(req.url);
  const productId = url.searchParams.get("product_id");

  let query = db
    .from(DB_CONFIG.tables.notifyRequests)
    .select("*, product:products(id, name, code, is_available)")
    .eq("notified", false)
    .order("created_at", { ascending: false })
    .limit(DB_CONFIG.queryLimits.maxNotifyRequests);

  if (productId) {
    query = query.eq("product_id", productId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return NextResponse.json(data || []);
});

export const PUT = withErrorHandler(async (req: NextRequest) => {
  const adminId = await verifySession();
  if (!adminId) throw unauthorizedError();

  const body = await req.json();
  if (!body.ids || !Array.isArray(body.ids)) {
    throw validationError("ids array is required");
  }

  const db = getServiceSupabase();
  const { error } = await db
    .from(DB_CONFIG.tables.notifyRequests)
    .update({ notified: true })
    .in("id", body.ids);

  if (error) throw new Error(error.message);

  return NextResponse.json({ success: true });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const adminId = await verifySession();
  if (!adminId) throw unauthorizedError();

  const db = getServiceSupabase();
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (id) {
    const { error } = await db.from(DB_CONFIG.tables.notifyRequests).delete().eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await db.from(DB_CONFIG.tables.notifyRequests).delete().eq("notified", true);
    if (error) throw new Error(error.message);
  }

  return NextResponse.json({ success: true });
});
