import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { verifySession } from "@/lib/auth";
import { withErrorHandler, unauthorizedError } from "@/lib/api-error";
import { UI_CONFIG } from "@/config/ui.config";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async () => {
  const adminId = await verifySession();
  if (!adminId) throw unauthorizedError();

  const db = getServiceSupabase();
  const { data: products, error } = await db
    .from("products")
    .select("*, category:categories(name)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const headers = UI_CONFIG.csvExport.columns;
  const rows = (products || []).map((p) => [
    p.code,
    `"${(p.name || "").replace(/"/g, '""')}"`,
    p.price,
    `"${p.category?.name || ""}"`,
    p.is_available ? "Yes" : "No",
    p.is_featured ? "Yes" : "No",
    p.stock_count ?? "",
    `"${(p.colors || []).join(", ")}"`,
    `"${(p.description || "").replace(/"/g, '""')}"`,
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  const today = new Date().toISOString().split("T")[0];

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename=products_${today}.csv`,
    },
  });
});
