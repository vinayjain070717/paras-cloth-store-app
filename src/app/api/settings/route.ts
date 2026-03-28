import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { verifySession } from "@/lib/auth";
import { withErrorHandler, unauthorizedError, notFoundError } from "@/lib/api-error";
import { settingsUpdateSchema } from "@/lib/validation";
import { AUTH_CONFIG } from "@/config/auth.config";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async () => {
  const db = getServiceSupabase();
  const { data, error } = await db
    .from("site_settings")
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return NextResponse.json(data);
});

export const PUT = withErrorHandler(async (req: NextRequest) => {
  const adminId = await verifySession();
  if (!adminId) throw unauthorizedError();

  const db = getServiceSupabase();
  const body = await req.json();

  const validated = settingsUpdateSchema.parse(body);

  if (validated.change_password && validated.new_password) {
    const password_hash = await bcrypt.hash(validated.new_password, AUTH_CONFIG.bcryptSaltRounds);
    await db
      .from("admin")
      .update({ password_hash })
      .eq("id", adminId);
    return NextResponse.json({ success: true });
  }

  if (validated.change_email && validated.new_email) {
    await db
      .from("admin")
      .update({ email: validated.new_email })
      .eq("id", adminId);
    return NextResponse.json({ success: true });
  }

  const updateData: Record<string, unknown> = {};
  const allowedFields = [
    "shop_name", "whatsapp_number", "logo_url",
    "primary_color", "accent_color", "dark_mode",
    "footer_text", "banner_text", "banner_active",
    "shop_address", "shop_timings",
    "instagram_url", "facebook_url",
  ];

  for (const field of allowedFields) {
    if ((validated as Record<string, unknown>)[field] !== undefined) {
      updateData[field] = (validated as Record<string, unknown>)[field];
    }
  }

  const { data: settings } = await db
    .from("site_settings")
    .select("id")
    .single();

  if (!settings) throw notFoundError("Settings not found");

  const { data, error } = await db
    .from("site_settings")
    .update(updateData)
    .eq("id", settings.id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return NextResponse.json(data);
});
