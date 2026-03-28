import { getServiceSupabase } from "@/lib/supabase";
import { DB_CONFIG } from "@/config/database.config";

export type ActivityAction =
  | "product_added"
  | "product_edited"
  | "product_deleted"
  | "product_sold"
  | "product_restocked"
  | "csv_imported"
  | "category_added"
  | "category_deleted"
  | "collection_added"
  | "collection_deleted";

export async function logActivity(
  action: ActivityAction,
  entityType: string,
  entityId?: string | null,
  entityName?: string | null,
  details?: Record<string, unknown>
) {
  try {
    const db = getServiceSupabase();
    await db.from(DB_CONFIG.tables.activityLog).insert({
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      entity_name: entityName || null,
      details: details || {},
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}
