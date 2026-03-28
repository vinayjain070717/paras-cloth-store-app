import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { createSession, needsOtp } from "@/lib/auth";
import { sendOtpEmail, generateOtp } from "@/lib/email";
import { withErrorHandler, unauthorizedError } from "@/lib/api-error";
import { loginSchema } from "@/lib/validation";
import { AUTH_CONFIG } from "@/config/auth.config";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { rateLimitedError } from "@/lib/api-error";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const ip = getClientIp(req);
  const { allowed, resetIn } = rateLimit(
    `login:${ip}`,
    AUTH_CONFIG.rateLimit.login.maxAttempts,
    AUTH_CONFIG.rateLimit.login.windowMs
  );
  if (!allowed) throw rateLimitedError(resetIn);

  const db = getServiceSupabase();
  const body = await req.json();
  const validated = loginSchema.parse(body);

  const { data: admin } = await db
    .from("admin")
    .select("*")
    .eq("username", validated.username)
    .single();

  if (!admin) throw unauthorizedError("Invalid credentials");

  const validPassword = await bcrypt.compare(validated.password, admin.password_hash);
  if (!validPassword) throw unauthorizedError("Invalid credentials");

  const requiresOtp = needsOtp(admin.last_login);

  if (requiresOtp && !validated.otp) {
    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + AUTH_CONFIG.otp.expiryMs).toISOString();

    await db.from("otp_codes").insert({
      code: otpCode,
      expires_at: expiresAt,
    });

    const { data: settings } = await db
      .from("site_settings")
      .select("shop_name")
      .single();

    await sendOtpEmail(
      admin.email,
      otpCode,
      settings?.shop_name || "Paras Cloth Store"
    );

    return NextResponse.json({ requiresOtp: true });
  }

  if (requiresOtp && validated.otp) {
    const { data: otpRecord } = await db
      .from("otp_codes")
      .select("*")
      .eq("code", validated.otp)
      .eq("used", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!otpRecord) throw unauthorizedError("Invalid or expired OTP");

    await db
      .from("otp_codes")
      .update({ used: true })
      .eq("id", otpRecord.id);
  }

  await db
    .from("admin")
    .update({ last_login: new Date().toISOString() })
    .eq("id", admin.id);

  await createSession(admin.id);

  return NextResponse.json({ success: true });
});
