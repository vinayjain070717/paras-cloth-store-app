import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { verifySession } from "@/lib/auth";
import { withErrorHandler, unauthorizedError, validationError } from "@/lib/api-error";
import { csvImportRowSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity-logger";
import { APP_CONFIG } from "@/config/app.config";

export const dynamic = "force-dynamic";

function generateCode(): string {
  const { codeMin, codeMax } = APP_CONFIG.product;
  return String(Math.floor(codeMin + Math.random() * (codeMax - codeMin)));
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });
    rows.push(row);
  }

  return rows;
}

export const POST = withErrorHandler(async (req: NextRequest) => {
  const adminId = await verifySession();
  if (!adminId) throw unauthorizedError();

  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) throw validationError("No CSV file provided");
  if (!file.name.endsWith(".csv")) throw validationError("File must be a .csv file");

  const text = await file.text();
  const rows = parseCSV(text);

  if (rows.length === 0) throw validationError("CSV file is empty or has no data rows");

  const db = getServiceSupabase();

  const { data: categories } = await db.from("categories").select("id, name");
  const catMap = new Map<string, string>();
  (categories || []).forEach((c) => catMap.set(c.name.toLowerCase(), c.id));

  const imported: string[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const parsed = csvImportRowSchema.parse(row);
      const code = parsed.code || generateCode();
      const categoryId = parsed.category ? catMap.get(parsed.category.toLowerCase()) || null : null;

      const { error } = await db.from("products").insert({
        code,
        name: parsed.name,
        price: parsed.price,
        description: parsed.description || "",
        category_id: categoryId,
        stock_count: parsed.stock_count ?? null,
        colors: parsed.colors ? parsed.colors.split("|").map((c: string) => c.trim()).filter(Boolean) : [],
        is_featured: parsed.is_featured,
        is_available: true,
      });

      if (error) {
        errors.push({ row: i + 2, message: error.message });
      } else {
        imported.push(parsed.name);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid data";
      errors.push({ row: i + 2, message });
    }
  }

  if (imported.length > 0) {
    await logActivity("csv_imported", "product", null, null, {
      count: imported.length,
      names: imported.slice(0, 5),
    });
  }

  return NextResponse.json({
    imported: imported.length,
    errors,
    total: rows.length,
  });
});
