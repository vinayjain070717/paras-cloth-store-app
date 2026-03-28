import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { withErrorHandler, validationError, conflictError } from "@/lib/api-error";
import { installSchema } from "@/lib/validation";
import { AUTH_CONFIG } from "@/config/auth.config";
import { APP_CONFIG } from "@/config/app.config";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const db = getServiceSupabase();

  const { data: existing } = await db
    .from("site_settings")
    .select("is_installed")
    .single();

  if (existing?.is_installed) {
    throw conflictError("Store already installed");
  }

  const body = await req.json();
  const validated = installSchema.parse(body);

  const password_hash = await bcrypt.hash(validated.password, AUTH_CONFIG.bcryptSaltRounds);

  await db.from("admin").insert({
    username: validated.username,
    password_hash,
    email: validated.email,
  });

  const { data: settingsExist } = await db
    .from("site_settings")
    .select("id")
    .single();

  const settingsData = {
    shop_name: validated.shop_name || APP_CONFIG.shopDefaults.name,
    whatsapp_number: validated.whatsapp_number,
    primary_color: validated.primary_color || APP_CONFIG.shopDefaults.primaryColor,
    accent_color: APP_CONFIG.shopDefaults.accentColor,
    is_installed: true,
  };

  if (settingsExist) {
    await db
      .from("site_settings")
      .update(settingsData)
      .eq("id", settingsExist.id);
  } else {
    await db.from("site_settings").insert(settingsData);
  }

  return NextResponse.json({ success: true });
});

export const GET = withErrorHandler(async () => {
  const db = getServiceSupabase();
  const { data } = await db
    .from("site_settings")
    .select("is_installed")
    .single();

  return NextResponse.json({
    installed: data?.is_installed || false,
  });
});
