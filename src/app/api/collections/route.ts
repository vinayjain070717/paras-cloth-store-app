import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { verifySession } from "@/lib/auth";
import { withErrorHandler, unauthorizedError, validationError } from "@/lib/api-error";
import { collectionSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const db = getServiceSupabase();
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const withProducts = url.searchParams.get("withProducts");

  if (id) {
    const { data, error } = await db
      .from("collections")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw new Error(error.message);

    if (withProducts === "true") {
      const { data: productLinks } = await db
        .from("collection_products")
        .select("product_id")
        .eq("collection_id", id);

      const productIds = (productLinks || []).map((p) => p.product_id);

      if (productIds.length > 0) {
        const { data: products } = await db
          .from("products")
          .select("*, category:categories(*), images:product_images(*)")
          .in("id", productIds);

        return NextResponse.json({ ...data, products: products || [] });
      }

      return NextResponse.json({ ...data, products: [] });
    }

    return NextResponse.json(data);
  }

  const { data, error } = await db
    .from("collections")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return NextResponse.json(data || []);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const adminId = await verifySession();
  if (!adminId) throw unauthorizedError();

  const db = getServiceSupabase();
  const body = await req.json();

  if (body.addProduct) {
    if (!body.collection_id || !body.product_id) {
      throw validationError("collection_id and product_id are required");
    }
    const { error } = await db.from("collection_products").insert({
      collection_id: body.collection_id,
      product_id: body.product_id,
    });
    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true });
  }

  if (body.removeProduct) {
    const { error } = await db
      .from("collection_products")
      .delete()
      .eq("collection_id", body.collection_id)
      .eq("product_id", body.product_id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true });
  }

  const validated = collectionSchema.parse(body);

  const { data, error } = await db
    .from("collections")
    .insert({
      name: validated.name,
      description: validated.description,
      is_active: validated.is_active,
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

  if (!body.id) throw validationError("Collection ID is required");

  const { data, error } = await db
    .from("collections")
    .update({
      name: body.name,
      description: body.description,
      is_active: body.is_active,
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

  if (!id) throw validationError("Collection ID is required");

  const { error } = await db.from("collections").delete().eq("id", id);
  if (error) throw new Error(error.message);

  return NextResponse.json({ success: true });
});
