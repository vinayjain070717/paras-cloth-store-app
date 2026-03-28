import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { verifySession } from "@/lib/auth";
import { withErrorHandler, unauthorizedError, validationError } from "@/lib/api-error";
import { categorySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async () => {
  const db = getServiceSupabase();
  const { data, error } = await db
    .from("categories")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) throw new Error(error.message);

  return NextResponse.json(data || []);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const adminId = await verifySession();
  if (!adminId) throw unauthorizedError();

  const db = getServiceSupabase();
  const body = await req.json();

  const validated = categorySchema.parse(body);

  const { data: maxOrder } = await db
    .from("categories")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .single();

  const { data, error } = await db
    .from("categories")
    .insert({
      name: validated.name,
      image_url: validated.image_url || null,
      display_order: (maxOrder?.display_order || 0) + 1,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return NextResponse.json(data);
});

export const PUT = withErrorHandler(async (req: NextRequest) => {
  const adminId = await verifySession();
  if (!adminId) throw unauthorizedError();

  const db = getServiceSupabase();
  const body = await req.json();

  if (body.reorder) {
    for (const item of body.reorder) {
      await db
        .from("categories")
        .update({ display_order: item.display_order })
        .eq("id", item.id);
    }
    return NextResponse.json({ success: true });
  }

  const { data, error } = await db
    .from("categories")
    .update({
      name: body.name,
      image_url: body.image_url,
    })
    .eq("id", body.id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return NextResponse.json(data);
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const adminId = await verifySession();
  if (!adminId) throw unauthorizedError();

  const db = getServiceSupabase();
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) throw validationError("Category ID is required");

  const { error } = await db.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);

  return NextResponse.json({ success: true });
});
