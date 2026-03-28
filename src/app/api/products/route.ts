import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { verifySession } from "@/lib/auth";
import { withErrorHandler, unauthorizedError, validationError } from "@/lib/api-error";
import { productCreateSchema, productUpdateSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity-logger";
import { APP_CONFIG } from "@/config/app.config";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const db = getServiceSupabase();
  const url = new URL(req.url);
  const category = url.searchParams.get("category");
  const search = url.searchParams.get("search");
  const featured = url.searchParams.get("featured");
  const available = url.searchParams.get("available");
  const minPrice = url.searchParams.get("minPrice");
  const maxPrice = url.searchParams.get("maxPrice");
  const code = url.searchParams.get("code");
  const sort = url.searchParams.get("sort");

  let query = db
    .from("products")
    .select("*, category:categories(*), images:product_images(*)");

  switch (sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    case "name_asc":
      query = query.order("name", { ascending: true });
      break;
    case "name_desc":
      query = query.order("name", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  if (category) query = query.eq("category_id", category);
  if (search) query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
  if (featured === "true") query = query.eq("is_featured", true);
  if (available === "true") query = query.eq("is_available", true);
  if (available === "false") query = query.eq("is_available", false);
  if (minPrice) query = query.gte("price", Number(minPrice));
  if (maxPrice) query = query.lte("price", Number(maxPrice));
  if (code) query = query.eq("code", code);

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return NextResponse.json(data || []);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const adminId = await verifySession();
  if (!adminId) throw unauthorizedError();

  const db = getServiceSupabase();
  const body = await req.json();

  const validated = productCreateSchema.parse(body);
  const code = validated.code || generateCode();

  const { data: product, error } = await db
    .from("products")
    .insert({
      code,
      name: validated.name,
      price: validated.price,
      description: validated.description,
      category_id: validated.category_id || null,
      is_available: validated.is_available,
      is_featured: validated.is_featured,
      stock_count: validated.stock_count ?? null,
      colors: validated.colors,
      video_url: validated.video_url || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (validated.images && validated.images.length > 0) {
    const imageRows = validated.images.map((url: string, i: number) => ({
      product_id: product.id,
      cloudinary_url: url,
      is_primary: i === 0,
      display_order: i,
    }));
    await db.from("product_images").insert(imageRows);
  }

  await logActivity("product_added", "product", product.id, validated.name, {
    price: validated.price,
    code,
  });

  return NextResponse.json(product);
});

export const PUT = withErrorHandler(async (req: NextRequest) => {
  const adminId = await verifySession();
  if (!adminId) throw unauthorizedError();

  const db = getServiceSupabase();
  const body = await req.json();

  const validated = productUpdateSchema.parse(body);

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (validated.name !== undefined) updateData.name = validated.name;
  if (validated.price !== undefined) updateData.price = validated.price;
  if (validated.description !== undefined) updateData.description = validated.description;
  if (validated.category_id !== undefined) updateData.category_id = validated.category_id;
  if (validated.is_available !== undefined) updateData.is_available = validated.is_available;
  if (validated.is_featured !== undefined) updateData.is_featured = validated.is_featured;
  if (validated.stock_count !== undefined) updateData.stock_count = validated.stock_count;
  if (validated.colors !== undefined) updateData.colors = validated.colors;
  if (validated.video_url !== undefined) updateData.video_url = validated.video_url;

  const { data, error } = await db
    .from("products")
    .update(updateData)
    .eq("id", validated.id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (validated.images !== undefined) {
    await db.from("product_images").delete().eq("product_id", validated.id);
    if (validated.images.length > 0) {
      const imageRows = validated.images.map((url: string, i: number) => ({
        product_id: validated.id,
        cloudinary_url: url,
        is_primary: i === 0,
        display_order: i,
      }));
      await db.from("product_images").insert(imageRows);
    }
  }

  if (validated.is_available === false) {
    await logActivity("product_sold", "product", validated.id, data?.name);
  } else if (validated.is_available === true) {
    await logActivity("product_restocked", "product", validated.id, data?.name);
  } else {
    await logActivity("product_edited", "product", validated.id, data?.name);
  }

  return NextResponse.json(data);
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const adminId = await verifySession();
  if (!adminId) throw unauthorizedError();

  const db = getServiceSupabase();
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) throw validationError("Product ID is required");

  const { data: existing } = await db.from("products").select("name, code").eq("id", id).single();

  const { error } = await db.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);

  await logActivity("product_deleted", "product", id, existing?.name, {
    code: existing?.code,
  });

  return NextResponse.json({ success: true });
});

function generateCode(): string {
  const { codeMin, codeMax } = APP_CONFIG.product;
  return String(Math.floor(codeMin + Math.random() * (codeMax - codeMin)));
}
