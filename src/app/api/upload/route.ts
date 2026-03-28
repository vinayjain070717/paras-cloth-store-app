import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { withErrorHandler, unauthorizedError, validationError } from "@/lib/api-error";
import { VALIDATION_CONFIG } from "@/config/validation.config";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const adminId = await verifySession();
  if (!adminId) throw unauthorizedError();

  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) throw validationError("No file provided");

  if (file.size > VALIDATION_CONFIG.upload.maxFileSizeBytes) {
    throw validationError(
      `File too large. Maximum size is ${VALIDATION_CONFIG.upload.maxFileSizeMb}MB`
    );
  }

  const cloudFormData = new FormData();
  cloudFormData.append("file", file);
  cloudFormData.append(
    "upload_preset",
    process.env.CLOUDINARY_UPLOAD_PRESET || "paras_cloth_store"
  );

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: cloudFormData }
  );

  if (!res.ok) {
    throw new Error("Cloudinary upload failed");
  }

  const data = await res.json();

  return NextResponse.json({
    url: data.secure_url,
    public_id: data.public_id,
  });
});
